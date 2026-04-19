"""
Policy Engine Core
"""
from policy.rules import evaluate_metrics

class PolicyEngine:
    def evaluate(self, decision: str, metrics: dict) -> dict:
        return evaluate_metrics(decision, metrics)

policy_engine = PolicyEngine()