import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import matplotlib.pyplot as plt

# Attempt to import torchdiffeq, instruct the user if missing
try:
    from torchdiffeq import odeint_adjoint as odeint
except ImportError:
    print("torchdiffeq is not installed. Please run: pip install torchdiffeq")
    # Fallback to a simple Euler solver if missing, for demonstration purposes.
    def odeint(func, y0, t, method=None):
        out = [y0]
        y = y0
        for i in range(len(t) - 1):
            dt = t[i+1] - t[i]
            y = y + func(t[i], y) * dt
            out.append(y)
        return torch.stack(out)

# ---------------------------------------------------------
# 1. Continuous Vector Field f(h(t), t, θ)
# ---------------------------------------------------------
class ContinuousVectorField(nn.Module):
    """
    Defines the continuous evolution of the memory state over time.
    dh/dt = f(h(t), t, θ)
    """
    def __init__(self, state_dim, hidden_dim):
        super(ContinuousVectorField, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim + 1, hidden_dim), # +1 for time t
            nn.Tanh(),
            nn.Linear(hidden_dim, state_dim)
        )
        
        # Initialize weights for stability (close to zero drift initially)
        for m in self.net.modules():
            if isinstance(m, nn.Linear):
                nn.init.normal_(m.weight, mean=0, std=0.01)
                nn.init.constant_(m.bias, 0)

    def forward(self, t, h):
        """
        Calculates the gradient df/dt.
        torchdiffeq requires forward to take (t, y)
        """
        # Expand t to batch_size, state_dim mapping
        t_vec = torch.ones(h.shape[0], 1).to(h.device) * t
        
        # Concatenate time as an input feature for time-aware drift
        h_t = torch.cat([h, t_vec], dim=1)
        return self.net(h_t)

# ---------------------------------------------------------
# 2. Continuous-Time Neural Data Structure (CTNDS)
# ---------------------------------------------------------
class CTNDS(nn.Module):
    def __init__(self, input_dim, state_dim, read_dim, hidden_dim=64):
        super(CTNDS, self).__init__()
        self.state_dim = state_dim
        
        # Vector Field defined above
        self.vector_field = ContinuousVectorField(state_dim, hidden_dim)
        
        # Perturbation mechanism (Memory Insertion): Δ(x)
        self.update_net = nn.Sequential(
            nn.Linear(input_dim + state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, state_dim)
        )
        
        # Read mechanism (Querying): r(t) = g(h(t))
        self.read_net = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, read_dim)
        )
        
    def memory_perturbation(self, x_i, h_current):
        """
        Instantaneous jump: h(t_i^+) = h(t_i^-) + Δ(x_i, h)
        """
        combined = torch.cat([x_i, h_current], dim=1)
        delta = self.update_net(combined)
        return h_current + delta
    
    def read(self, h):
        return self.read_net(h)

    def forward(self, times, inputs, h0):
        """
        Simulates the continuous dynamical system with asynchronous discrete inputs.
        times: A sequence of observation times [N]
        inputs: Data arriving at those times [N, batch_size, input_dim]
        h0: Initial state [batch_size, state_dim]
        """
        trajectory = []
        outputs = []
        h = h0
        
        # Start of sequence
        trajectory.append(h)
        outputs.append(self.read(h))
        
        # Evolve over irregular intervals
        for i in range(len(times) - 1):
            t_current = times[i]
            t_next = times[i+1]
            x_i = inputs[i]
            
            # STEP 1: Apply input perturbation at t_current
            h_plus = self.memory_perturbation(x_i, h)
            
            # STEP 2: Continuous ODE integration from t_current to t_next
            # We evaluate odeint over [t_current, t_next] and take the final state [-1]
            t_span = torch.tensor([t_current, t_next], dtype=torch.float32).to(h.device)
            integrated_states = odeint(self.vector_field, h_plus, t_span, method='rk4')
            
            h_next = integrated_states[-1] # State at t_next
            
            # STEP 3: Store and emit
            trajectory.append(h_next)
            outputs.append(self.read(h_next))
            
            h = h_next
            
        return torch.stack(trajectory), torch.stack(outputs)

# ---------------------------------------------------------
# 3. Training Loop & Validation
# ---------------------------------------------------------
def train_ctnds():
    print("--- Starting CTNDS Training ---")
    
    # Hyperparameters
    batch_size = 16
    seq_len = 10
    input_dim = 2
    state_dim = 10
    read_dim = 1
    epochs = 50
    learning_rate = 0.01

    # Initialize model
    model = CTNDS(input_dim, state_dim, read_dim)
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)
    criterion = nn.MSELoss()

    loss_history = []

    # Let's generate a synthetic set of irregular timestamps and target signals
    # Target function: sin(t) mapping memory capabilities
    for epoch in range(epochs):
        optimizer.zero_grad()
        
        # 1. Asynchronous irregular timestamps
        # Sorted random times between 0 and 10 to simulate irregular sampling
        times, _ = torch.sort(torch.rand(seq_len) * 10)
        
        # 2. Random synthetic inputs representing events that happen at `times`
        inputs = torch.randn(seq_len, batch_size, input_dim)
        
        # 3. True memory target (sine wave of the timestamps)
        # We want the network to recall a continuous target representation
        target = torch.sin(times).view(seq_len, 1, 1).expand(seq_len, batch_size, read_dim)
        
        # 4. Forward execution through ODE memory block
        h0 = torch.zeros(batch_size, state_dim)
        _, predictions = model(times, inputs, h0)
        
        # 5. Loss calculation over the temporal trajectory integral bounds
        loss = criterion(predictions, target)
        
        # 6. Adjoint Backward (differentiates safely through the ODE solver limit)
        loss.backward()
        optimizer.step()
        
        loss_history.append(loss.item())
        
        if (epoch + 1) % 10 == 0:
            print(f"Epoch: {epoch + 1:03d} | Loss: {loss.item():.6f}")

    print("--- Training Complete ---")
    return model, loss_history

def visualize_results(loss_history):
    plt.figure(figsize=(10, 5))
    plt.plot(np.arange(1, len(loss_history)+1), loss_history, marker='o', color='purple', linewidth=2)
    plt.title('Training Loss Curve - Adjoint Propagation', fontsize=14)
    plt.xlabel('Epochs', fontsize=12)
    plt.ylabel('MSE Loss', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.6)
    plt.savefig('ctnds_training_loss.png')
    print("Loss curve saved as 'ctnds_training_loss.png'")
    # plt.show() # Uncomment if interactive

if __name__ == "__main__":
    trained_model, losses = train_ctnds()
    visualize_results(losses)
