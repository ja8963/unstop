import { useRef, useEffect } from "react";

function StockRing({ qty, reorderLevel }) {
  const maxDisplay = Math.max(qty, reorderLevel * 3, 100);
  const pct = Math.min(qty / maxDisplay, 1);
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  const color = qty === 0 ? "#ef4444"
    : qty <= reorderLevel * 0.5 ? "#ef4444"
    : qty <= reorderLevel ? "#f59e0b"
    : "#10b981";

  return (
    <div className="stock-ring-container">
      <div className="stock-ring">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r}
            fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="stock-ring-value">
          <span className="qty">{qty}</span>
          <span className="unit">units</span>
        </div>
      </div>
      <div className="stock-stat">
        <div className="stat-label">Reorder Level</div>
        <div className="stat-value">{reorderLevel} units</div>
      </div>
    </div>
  );
}

export default function InventoryCard({ data, loading, error }) {
  if (loading) return (
    <div className="card loading-card">
      <div className="spinner" />
      <span className="loading-text">Fetching inventory...</span>
    </div>
  );
  if (error) return <div className="card error-banner">⚠ {error}</div>;
  if (!data) return null;

  const { stock, expiry, storage_requirements, overall_alert, audit_trail } = data;

  const expiryColor = { expired: "chip-red", critical: "chip-red", expiring_soon: "chip-orange", caution: "chip-yellow", ok: "chip-green" };
  const stockColor = { out_of_stock: "chip-red", critical_low: "chip-red", low_stock: "chip-yellow", adequate: "chip-blue", well_stocked: "chip-green" };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon amber">📦</div>
        <span className="card-title">Inventory & Expiry Alerts</span>
      </div>

      <div className="inventory-grid">
        <StockRing qty={stock.current_qty} reorderLevel={stock.reorder_level} />

        <div className="inventory-detail">
          <div className="inventory-row">
            <span className="inventory-row-icon">📊</span>
            <div className="inventory-row-text">
              <div className="row-label">Stock Status</div>
              <span className={`status-chip ${stockColor[stock.status] || "chip-blue"}`}>
                {stock.label}
              </span>
            </div>
          </div>

          <div className="inventory-row">
            <span className="inventory-row-icon">📅</span>
            <div className="inventory-row-text">
              <div className="row-label">Expiry Date</div>
              <div className="row-value">{expiry.expiry_date}</div>
              <span className={`status-chip ${expiryColor[expiry.status] || "chip-green"}`} style={{ marginTop: "4px" }}>
                {expiry.label}
              </span>
            </div>
          </div>

          <div className="inventory-row">
            <span className="inventory-row-icon">💰</span>
            <div className="inventory-row-text">
              <div className="row-label">Stock Value</div>
              <div className="row-value">₹{stock.total_value?.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className={`alert-banner ${overall_alert}`} style={{ marginTop: "14px" }}>
        {expiry.message} {stock.message !== expiry.message ? `• ${stock.message}` : ""}
      </div>

      <div className="meta-row" style={{ marginTop: "10px" }}>
        <span>🌡️</span>
        <span>{storage_requirements}</span>
      </div>
    </div>
  );
}
