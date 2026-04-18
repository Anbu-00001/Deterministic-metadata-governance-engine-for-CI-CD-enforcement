import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import matplotlib.pyplot as plt

try:
    import torchsde
except ImportError:
    print("Please install torchsde: pip install torchsde")
    import sys
    sys.exit(1)

# ---------------------------------------------------------
# 1. Structural Component: Graph Neural SDE
# ---------------------------------------------------------
class GraphNeuralSDE(nn.Module):
    """
    Defines the continuous stochastic evolution of a structurized graph memory over time.
    dh(t) = f(h(t), t, θ, A) dt + g(h(t), t, φ) dW(t)
    
    This uses Ito calculus as the backend stochastic integrator.
    """
    noise_type = 'diagonal'
    sde_type = 'ito'

    def __init__(self, num_nodes, state_dim, hidden_dim, adj_matrix):
        super(GraphNeuralSDE, self).__init__()
        self.num_nodes = num_nodes
        self.state_dim = state_dim
        
        # Adjacency matrix for message passing during the drift phase
        self.register_buffer('A', adj_matrix)
        
        # Drift Network f(h, t) - handles structural evolution via graph multiplication
        self.drift_net = nn.Sequential(
            nn.Linear(state_dim + 1, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, state_dim)
        )
        
        # Diffusion Network g(h, t) - handles Brownian uncertainty integration
        self.diffusion_net = nn.Sequential(
            nn.Linear(state_dim + 1, hidden_dim),
            nn.Sigmoid(),
            nn.Linear(hidden_dim, state_dim)
        )

    def f(self, t, h):
        """
        Drift: structural continuous message passing.
        h shape: [batch, num_nodes * state_dim]
        """
        batch_size = h.size(0)
        # Reshape to [batch, num_nodes, state_dim]
        h_reshaped = h.view(batch_size, self.num_nodes, self.state_dim)
        
        # Continuous Graph Message Passing: H_new = A @ H
        # This propagates continuous evolution structurally along neighbors
        h_graph = torch.matmul(self.A, h_reshaped) 
        
        # Expand time coordinate
        t_expanded = t.expand(batch_size, self.num_nodes, 1)
        h_t = torch.cat([h_graph, t_expanded], dim=2)
        
        drift = self.drift_net(h_t) # [batch, num_nodes, state_dim]
        return drift.view(batch_size, -1)

    def g(self, t, h):
        """
        Diffusion: defines the variance / stochasticity bounds.
        """
        batch_size = h.size(0)
        h_reshaped = h.view(batch_size, self.num_nodes, self.state_dim)
        
        t_expanded = t.expand(batch_size, self.num_nodes, 1)
        h_t = torch.cat([h_reshaped, t_expanded], dim=2)
        
        # We enforce a small baseline noise scale, parameterized dynamically
        diff = self.diffusion_net(h_t)
        # Bounding the diffusion to prevent explosive stochastic gradients
        diff = 0.1 * torch.sigmoid(diff) 
        return diff.view(batch_size, -1)

# ---------------------------------------------------------
# 2. Continuous-Time Stochastic Graph Data Structure
# ---------------------------------------------------------
class CT_StochasticGraphDS(nn.Module):
    def __init__(self, num_nodes, input_dim, state_dim, read_dim, adj_matrix, hidden_dim=64):
        super(CT_StochasticGraphDS, self).__init__()
        self.num_nodes = num_nodes
        self.state_dim = state_dim
        
        self.sde_field = GraphNeuralSDE(num_nodes, state_dim, hidden_dim, adj_matrix)
        
        # Graph Perturbation: Δ_graph(x, A, h)
        self.perturbation_net = nn.Sequential(
            nn.Linear(input_dim + state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, state_dim)
        )
        
        # Readout head
        self.read_net = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, read_dim)
        )

    def graph_perturbation(self, x_i, h_current):
        """
        h(t+) = h(t-) + Perturb(x, h_current).
        x_i: incoming data [batch, num_nodes, input_dim]
        """
        batch_size = x_i.size(0)
        h_reshaped = h_current.view(batch_size, self.num_nodes, self.state_dim)
        combined = torch.cat([x_i, h_reshaped], dim=-1)
        delta = self.perturbation_net(combined)
        
        # Apply structural topological decay optionally, here we just strictly add
        h_plus = h_reshaped + delta 
        return h_plus.view(batch_size, -1)

    def forward(self, times, inputs, h0):
        """
        times: [SeqLen]
        inputs: [SeqLen, Batch, NumNodes, InputDim]
        h0: [Batch, NumNodes, StateDim]
        """
        batch_size = h0.size(0)
        h = h0.view(batch_size, -1)
        trajectory = [h.view(batch_size, self.num_nodes, self.state_dim)]
        
        for i in range(len(times) - 1):
            t_current = times[i]
            t_next = times[i+1]
            x_i = inputs[i]
            
            # Discrete structural jump
            h_plus = self.graph_perturbation(x_i, h)
            
            # Continuous SDE structural drift over graph
            t_span = torch.tensor([t_current, t_next], dtype=torch.float32).to(h.device)
            # Use Stratonovich or Ito solver (adjoint memory-efficient)
            integrated_states = torchsde.sdeint_adjoint(self.sde_field, h_plus, t_span, method='euler')
            
            h_next = integrated_states[-1]
            trajectory.append(h_next.view(batch_size, self.num_nodes, self.state_dim))
            h = h_next
            
        traj_tensor = torch.stack(trajectory) # [SeqLen, Batch, NumNodes, StateDim]
        readouts = self.read_net(traj_tensor) # [SeqLen, Batch, NumNodes, ReadDim]
        return traj_tensor, readouts

# ---------------------------------------------------------
# 3. Training execution & Visualization Implementation
# ---------------------------------------------------------
def run_stochastic_graph_experiment():
    print("--- Starting Hybrid Graph-SDE Experiment ---")
    
    # Simple star-graph topology (1 hub, 4 leaves)
    num_nodes = 5
    adj = torch.zeros(num_nodes, num_nodes)
    adj[1:, 0] = 1.0 # Leaves point to hub
    adj[0, 1:] = 1.0 # Hub points to leaves
    adj += torch.eye(num_nodes) # Self loops
    # Normalize adjacency
    deg = adj.sum(dim=1, keepdim=True)
    adj = adj / deg

    batch_size = 2
    seq_len = 4
    input_dim = 3
    state_dim = 12
    read_dim = 2
    epochs = 5
    lr = 0.01

    model = CT_StochasticGraphDS(num_nodes, input_dim, state_dim, read_dim, adj)
    optimizer = optim.Adam(model.parameters(), lr=lr)
    criterion = nn.MSELoss()

    loss_history = []
    
    # We will simulate tracking a noisy 2D brownian trajectory for each node
    for epoch in range(epochs):
        optimizer.zero_grad()
        
        times, _ = torch.sort(torch.rand(seq_len) * 5.0)
        inputs = torch.randn(seq_len, batch_size, num_nodes, input_dim)
        
        # Target: Nodes follow continuous oscillating patterns mixed with graph diffusion
        target_shape = (seq_len, batch_size, num_nodes, read_dim)
        target = torch.sin(times.view(-1, 1, 1, 1).expand(target_shape))
        
        h0 = torch.zeros(batch_size, num_nodes, state_dim)
        _, predictions = model(times, inputs, h0)
        
        loss = criterion(predictions, target)
        loss.backward()
        optimizer.step()
        
        loss_history.append(loss.item())
        print(f"Epoch {epoch+1:03d} | Total Euclidean Graph Loss: {loss.item():.5f}")

    print("--- Experiment Concluded ---")

    # Generate Brownian Trajectory Error Graph
    plt.figure(figsize=(10, 6))
    plt.plot(np.arange(1, epochs + 1), loss_history, color='orange', linewidth=2.5, marker='x')
    plt.fill_between(np.arange(1, epochs + 1), 
                     np.array(loss_history) - 0.05, 
                     np.array(loss_history) + 0.05, 
                     color='orange', alpha=0.2, label="Brownian Variance Bound")
    
    plt.title("Adjoint SDE Training Convergence (Graph Topological Memory)", fontsize=14)
    plt.xlabel("Epochs", fontsize=12)
    plt.ylabel("MSE Structural Loss", fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.legend()
    plt.savefig('sde_graph_loss.png')
    print("Graph topology SDE loss saved as 'sde_graph_loss.png'")

if __name__ == "__main__":
    run_stochastic_graph_experiment()
