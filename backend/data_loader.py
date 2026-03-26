import json
import os
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

def load_medicines() -> list[dict]:
    with open(DATA_DIR / "medicines.json", "r") as f:
        return json.load(f)

def load_rag_docs() -> list[dict]:
    with open(DATA_DIR / "cdsco_rag_docs.json", "r") as f:
        return json.load(f)

def get_medicine_by_name(name: str) -> dict | None:
    medicines = load_medicines()
    name_lower = name.lower()
    for med in medicines:
        if med["name"].lower() == name_lower:
            return med
    return None
