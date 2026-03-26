from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date, datetime
from data_loader import get_medicine_by_name

router = APIRouter(prefix="/api", tags=["compliance"])

SCHEDULE_METADATA = {
    "OTC": {
        "label": "OTC",
        "full_name": "Over-the-Counter",
        "color": "green",
        "risk_level": "low",
        "description": "This drug is available without a prescription. Patients can purchase it directly from a pharmacy.",
        "regulatory_body": "CDSCO (Drugs & Cosmetics Act, 1940)",
        "key_requirements": [
            "No prescription required",
            "Pharmacist may provide self-medication guidance",
            "Must comply with standard labeling requirements",
            "Cannot advertise prescription drugs as OTC"
        ]
    },
    "H": {
        "label": "Schedule H",
        "full_name": "Prescription-Only Drug (Schedule H)",
        "color": "amber",
        "risk_level": "medium",
        "description": "This drug is a prescription-only medicine under Schedule H of the Drugs and Cosmetics Act. It must only be dispensed with a valid doctor's prescription.",
        "regulatory_body": "CDSCO (Drugs & Cosmetics Rules, Rule 65(15))",
        "key_requirements": [
            "Valid prescription from a Registered Medical Practitioner (RMP) required",
            "Label must display 'Schedule H Drug — Warning' text",
            "Pharmacy must maintain a prescription register",
            "Cannot be sold over-the-counter",
            "Rx symbol mandatory on label"
        ]
    },
    "H1": {
        "label": "Schedule H1",
        "full_name": "Prescription-Only Drug (Schedule H1 — Enhanced Monitoring)",
        "color": "orange",
        "risk_level": "high",
        "description": "Schedule H1 drug with enhanced monitoring requirements. These are often antibiotics or high-risk drugs subject to antibiotic stewardship. Extra record-keeping is mandatory.",
        "regulatory_body": "CDSCO Amendment 2013 (Drugs & Cosmetics Rules)",
        "key_requirements": [
            "Valid prescription from a Registered Medical Practitioner required",
            "Pharmacy must maintain a dedicated H1 drug register",
            "Register must record: patient name, age, doctor's details, quantity dispensed",
            "Records must be preserved for minimum 3 years",
            "Label must contain specific H1 warning text",
            "Restricted under Antibiotic Stewardship Program"
        ]
    },
    "X": {
        "label": "Schedule X",
        "full_name": "Controlled Substance (Schedule X — NDPS Act)",
        "color": "red",
        "risk_level": "critical",
        "description": "This is a controlled narcotic/psychotropic substance under Schedule X and the NDPS Act, 1985. Strict licensing, storage (locked safe), and record-keeping requirements apply. Violations carry criminal penalties.",
        "regulatory_body": "NDPS Act 1985 + Drugs & Cosmetics Act (Schedule X)",
        "key_requirements": [
            "Pharmacy must hold special Form 20-F license for Schedule X",
            "Prescription required in TRIPLICATE; pharmacy retains one copy",
            "Drug must be stored in a locked iron safe/cabinet",
            "Quantity per prescription strictly limited",
            "Detailed register entry mandatory for every transaction",
            "Records must be preserved for minimum 2 years",
            "Violations: imprisonment up to 10–20 years under NDPS Act"
        ]
    }
}


class ComplianceRequest(BaseModel):
    medicine_name: str


@router.post("/compliance")
def check_compliance(req: ComplianceRequest):
    med = get_medicine_by_name(req.medicine_name)
    if not med:
        raise HTTPException(status_code=404, detail=f"Medicine '{req.medicine_name}' not found.")

    schedule = med.get("schedule", "OTC")
    meta = SCHEDULE_METADATA.get(schedule, SCHEDULE_METADATA["OTC"])

    # Expiry check
    today = date.today()
    expiry_str = med.get("expiry_date", "")
    expiry_date = datetime.strptime(expiry_str, "%Y-%m-%d").date()
    days_to_expiry = (expiry_date - today).days

    expiry_status = "ok"
    if days_to_expiry < 0:
        expiry_status = "expired"
    elif days_to_expiry <= 90:
        expiry_status = "expiring_soon"

    # Stock check
    stock = med.get("stock_qty", 0)
    reorder = med.get("reorder_level", 0)
    stock_status = "ok"
    if stock == 0:
        stock_status = "out_of_stock"
    elif stock <= reorder:
        stock_status = "low_stock"

    return {
        "medicine_name": med["name"],
        "salt": med["salt"],
        "schedule": schedule,
        "schedule_metadata": meta,
        "requires_prescription": med.get("requires_prescription", False),
        "brand_names": med.get("brand_names", []),
        "category": med.get("category", ""),
        "alternatives": med.get("alternatives", []),
        "stock_qty": stock,
        "reorder_level": reorder,
        "expiry_date": expiry_str,
        "expiry_status": expiry_status,
        "days_to_expiry": days_to_expiry,
        "stock_status": stock_status,
        "audit_trail": {
            "data_source": "Medicines Dataset v1.0 (Internal)",
            "regulatory_reference": meta["regulatory_body"],
            "checked_at": datetime.now().isoformat(),
            "logic": f"Schedule determined from structured dataset. Compliance requirements derived from SCHEDULE_METADATA lookup for '{schedule}'."
        }
    }
