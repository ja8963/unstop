from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, date
from data_loader import get_medicine_by_name
import numpy as np

router = APIRouter(prefix="/api", tags=["recommend"])

# Month seasonality indices (1=Jan .. 12=Dec)
# Allergy/respiratory season: Mar-May, Sep-Nov → higher demand for antihistamines, antibiotics
# Monsoon/infection season: Jun-Sep → higher antibiotics, GI drugs
# Festival/winter: Oct-Jan → vitamins, analgesics
SEASONALITY_CATEGORIES = {
    "Antihistamine (Second Generation)": {3: 1.3, 4: 1.4, 5: 1.3, 9: 1.2, 10: 1.2, 11: 1.1},
    "NSAID / Analgesic": {6: 1.15, 7: 1.15, 8: 1.1},
    "Analgesic / Antipyretic": {6: 1.2, 7: 1.25, 8: 1.2},
    "Antibiotic (Penicillin group)": {6: 1.2, 7: 1.2, 8: 1.15, 9: 1.15},
    "Antibiotic (Macrolide)": {6: 1.15, 7: 1.2, 8: 1.15},
    "Antibiotic (Fluoroquinolone)": {6: 1.15, 7: 1.15, 8: 1.1},
    "Nutritional Supplement": {10: 1.2, 11: 1.2, 12: 1.25, 1: 1.15},
    "Proton Pump Inhibitor": {10: 1.1, 11: 1.1, 12: 1.1, 1: 1.1},
}


def moving_average(sales: list[int], window: int = 3) -> float:
    if not sales:
        return 0.0
    arr = np.array(sales[-window:], dtype=float)
    return float(np.mean(arr))


def get_seasonality_factor(category: str, month: int) -> float:
    factors = SEASONALITY_CATEGORIES.get(category, {})
    return factors.get(month, 1.0)


class RecommendRequest(BaseModel):
    medicine_name: str


@router.post("/recommend")
def get_recommendation(req: RecommendRequest):
    med = get_medicine_by_name(req.medicine_name)
    if not med:
        raise HTTPException(status_code=404, detail=f"Medicine '{req.medicine_name}' not found.")

    monthly_sales = med.get("monthly_sales", [])
    category = med.get("category", "")
    stock_qty = med.get("stock_qty", 0)
    reorder_level = med.get("reorder_level", 0)
    current_month = datetime.now().month
    current_month_name = datetime.now().strftime("%B")

    # Forecasting
    ma_3 = moving_average(monthly_sales, window=3)
    ma_6 = moving_average(monthly_sales, window=6)
    seasonality = get_seasonality_factor(category, current_month)
    
    # Weighted forecast: 60% recent (MA3) + 40% long-term (MA6), then seasonality
    base_forecast = (0.6 * ma_3 + 0.4 * ma_6)
    adjusted_forecast = round(base_forecast * seasonality)
    
    # Recommend stock to carry for 2 months
    recommended_stock = max(adjusted_forecast * 2, reorder_level * 2)
    restock_qty = max(0, round(recommended_stock - stock_qty))
    
    # Safety buffer (+15%)
    restock_with_buffer = round(restock_qty * 1.15)

    # Build reasoning
    reasoning_steps = [
        f"6-month sales window analyzed: {monthly_sales}",
        f"3-month moving average: {ma_3:.1f} units/month",
        f"6-month moving average: {ma_6:.1f} units/month",
        f"Weighted base forecast (60% MA3 + 40% MA6): {base_forecast:.1f} units/month",
        f"Seasonality factor for {current_month_name} ({category}): {seasonality:.2f}×",
        f"Adjusted monthly forecast: {adjusted_forecast} units",
        f"Target stock = 2 months supply = {recommended_stock} units",
        f"Current stock: {stock_qty} units",
        f"Raw restock quantity: {restock_qty} units",
        f"With 15% safety buffer → recommended restock: {restock_with_buffer} units"
    ]

    urgency = "low"
    urgency_message = "Routine restock recommended."
    if stock_qty <= reorder_level * 0.5 and restock_with_buffer > 0:
        urgency = "critical"
        urgency_message = "⚠️ Stock critically low — place urgent order immediately."
    elif stock_qty <= reorder_level:
        urgency = "high"
        urgency_message = "Stock below reorder level — order soon."
    elif seasonality > 1.2:
        urgency = "medium"
        urgency_message = f"Peak season for {category} in {current_month_name} — place advance order."

    # Cost estimate
    unit_price = med.get("unit_price", 0)
    estimated_cost = round(restock_with_buffer * unit_price, 2)

    return {
        "medicine_name": med["name"],
        "forecast": {
            "monthly_predicted_demand": adjusted_forecast,
            "seasonality_factor": seasonality,
            "seasonality_period": current_month_name
        },
        "recommendation": {
            "restock_quantity": restock_with_buffer,
            "urgency": urgency,
            "urgency_message": urgency_message,
            "estimated_cost_inr": estimated_cost,
            "recommended_target_stock": recommended_stock
        },
        "sales_trend": {
            "data": monthly_sales,
            "ma_3": round(ma_3, 1),
            "ma_6": round(ma_6, 1),
            "trend": "increasing" if ma_3 > ma_6 else ("stable" if abs(ma_3 - ma_6) < 10 else "decreasing")
        },
        "audit_reasoning": {
            "model": "Weighted Moving Average + Seasonality Adjustment",
            "formula": "forecast = (0.6 × MA3 + 0.4 × MA6) × seasonality_factor",
            "safety_buffer": "15%",
            "target_coverage": "2 months",
            "steps": reasoning_steps,
            "generated_at": datetime.now().isoformat()
        }
    }
