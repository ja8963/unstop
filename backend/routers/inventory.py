from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date, datetime
from data_loader import get_medicine_by_name

router = APIRouter(prefix="/api", tags=["inventory"])


class InventoryRequest(BaseModel):
    medicine_name: str


def classify_expiry(days_to_expiry: int) -> dict:
    if days_to_expiry < 0:
        return {
            "status": "expired",
            "label": "EXPIRED",
            "color": "red",
            "message": f"This drug EXPIRED {abs(days_to_expiry)} day(s) ago. Quarantine immediately and do NOT dispense.",
            "action": "Remove from shelf, quarantine, and dispose as per CPCB biomedical waste guidelines."
        }
    elif days_to_expiry <= 30:
        return {
            "status": "critical",
            "label": "CRITICAL",
            "color": "red",
            "message": f"Expiring in {days_to_expiry} day(s). Immediate action required.",
            "action": "Return to distributor or arrange disposal. Do not accept new stock with same expiry."
        }
    elif days_to_expiry <= 90:
        return {
            "status": "expiring_soon",
            "label": "EXPIRING SOON",
            "color": "orange",
            "message": f"Expiring in {days_to_expiry} day(s) (~{days_to_expiry // 30} month(s)).",
            "action": "Apply FEFO (First Expiry First Out). Prioritize dispensing this batch. Consider returning to distributor."
        }
    elif days_to_expiry <= 180:
        return {
            "status": "caution",
            "label": "CAUTION",
            "color": "yellow",
            "message": f"Expiring in {days_to_expiry} day(s) (~{days_to_expiry // 30} month(s)).",
            "action": "Monitor closely. Apply FEFO principle. Ensure rapid stock rotation."
        }
    else:
        return {
            "status": "ok",
            "label": "VALID",
            "color": "green",
            "message": f"Valid for {days_to_expiry} more day(s) (~{days_to_expiry // 30} month(s)).",
            "action": "No immediate action required. Continue normal FEFO rotation."
        }


def classify_stock(stock_qty: int, reorder_level: int) -> dict:
    if stock_qty == 0:
        return {
            "status": "out_of_stock",
            "label": "OUT OF STOCK",
            "color": "red",
            "message": "Zero stock available. Cannot fulfil prescriptions.",
            "action": "Place emergency order immediately."
        }
    elif stock_qty <= reorder_level * 0.5:
        return {
            "status": "critical_low",
            "label": "CRITICALLY LOW",
            "color": "red",
            "message": f"Stock ({stock_qty} units) is less than 50% of reorder level ({reorder_level} units).",
            "action": "Place urgent restocking order now."
        }
    elif stock_qty <= reorder_level:
        return {
            "status": "low_stock",
            "label": "LOW STOCK",
            "color": "amber",
            "message": f"Stock ({stock_qty} units) at or below reorder level ({reorder_level} units).",
            "action": "Initiate restocking order to avoid stockout."
        }
    elif stock_qty <= reorder_level * 2:
        return {
            "status": "adequate",
            "label": "ADEQUATE",
            "color": "blue",
            "message": f"Stock ({stock_qty} units) above reorder level.",
            "action": "No immediate action. Monitor consumption rate."
        }
    else:
        return {
            "status": "well_stocked",
            "label": "WELL STOCKED",
            "color": "green",
            "message": f"Stock level ({stock_qty} units) is healthy.",
            "action": "No action required. Continue routine monitoring."
        }


@router.post("/inventory")
def get_inventory_status(req: InventoryRequest):
    med = get_medicine_by_name(req.medicine_name)
    if not med:
        raise HTTPException(status_code=404, detail=f"Medicine '{req.medicine_name}' not found.")

    today = date.today()
    expiry_date = datetime.strptime(med["expiry_date"], "%Y-%m-%d").date()
    days_to_expiry = (expiry_date - today).days

    expiry_info = classify_expiry(days_to_expiry)
    stock_info = classify_stock(med["stock_qty"], med["reorder_level"])

    # Determine combined alert severity
    severities = {"expired": 5, "critical": 4, "out_of_stock": 4, "critical_low": 3, 
                  "expiring_soon": 3, "low_stock": 2, "caution": 1, "adequate": 0, 
                  "well_stocked": 0, "ok": 0}
    max_severity = max(severities.get(expiry_info["status"], 0), 
                       severities.get(stock_info["status"], 0))
    
    overall_alert = "none"
    if max_severity >= 4:
        overall_alert = "critical"
    elif max_severity >= 3:
        overall_alert = "warning"
    elif max_severity >= 2:
        overall_alert = "caution"
    elif max_severity >= 1:
        overall_alert = "info"

    return {
        "medicine_name": med["name"],
        "stock": {
            "current_qty": med["stock_qty"],
            "reorder_level": med["reorder_level"],
            "unit_price": med.get("unit_price", 0),
            "total_value": round(med["stock_qty"] * med.get("unit_price", 0), 2),
            **stock_info
        },
        "expiry": {
            "expiry_date": med["expiry_date"],
            "days_to_expiry": days_to_expiry,
            **expiry_info
        },
        "storage_requirements": med.get("storage", "Store as per manufacturer instructions"),
        "overall_alert": overall_alert,
        "monthly_sales_history": med.get("monthly_sales", []),
        "audit_trail": {
            "checked_at": datetime.now().isoformat(),
            "logic": f"Expiry classified using threshold rules (expired/<30/<90/<180 days). Stock classified relative to reorder_level ({med['reorder_level']} units). Data sourced from Medicines Dataset v1.0."
        }
    }
