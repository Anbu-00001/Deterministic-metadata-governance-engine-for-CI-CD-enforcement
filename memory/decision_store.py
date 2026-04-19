import json
import os

LOG_FILE = os.path.join(os.path.dirname(__file__), "..", "chronos", "decision_log.json")

def load_history():
    if not os.path.exists(LOG_FILE):
        return []
    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def append_decision(record):
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    history = load_history()
    
    if history:
        last = history[-1]
        is_duplicate = True
        for k, v in record.items():
            if k != "timestamp" and last.get(k) != v:
                is_duplicate = False
                break
        if is_duplicate:
            return
            
    history.append(record)
    try:
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            if os.name != 'nt':
                import fcntl
                fcntl.flock(f, fcntl.LOCK_EX)
            json.dump(history, f, indent=2)
            if os.name != 'nt':
                fcntl.flock(f, fcntl.LOCK_UN)
    except Exception:
        pass
