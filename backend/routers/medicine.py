from fastapi import APIRouter, HTTPException
from data_loader import load_medicines, get_medicine_by_name

router = APIRouter(prefix="/api", tags=["medicines"])


@router.get("/medicines")
def list_medicines():
    """Return all medicine names and IDs for the dropdown."""
    medicines = load_medicines()
    return [{"id": m["id"], "name": m["name"], "schedule": m["schedule"]} for m in medicines]


@router.get("/medicine/{name}")
def get_medicine(name: str):
    """Return full medicine record by name."""
    med = get_medicine_by_name(name)
    if not med:
        raise HTTPException(status_code=404, detail=f"Medicine '{name}' not found.")
    return med
