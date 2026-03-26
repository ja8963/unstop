import { useRef, useEffect } from "react";

function MiniBarChart({ data, ma3, ma6 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data?.length) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const max = Math.max(...data, 1);
    const barW = (w - (data.length - 1) * 4) / data.length;

    ctx.clearRect(0, 0, w, h);

    data.forEach((v, i) => {
      const bh = (v / max) * (h - 8);
      const x = i * (barW + 4);
      const y = h - bh;
      const grad = ctx.createLinearGradient(0, y, 0, h);
      grad.addColorStop(0, "#6366f1");
      grad.addColorStop(1, "rgba(99,102,241,0.2)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, bh, 3);
      ctx.fill();
    });

    // MA3 line
    if (ma3) {
      const y3 = h - (ma3 / max) * (h - 8);
      ctx.strokeStyle = "rgba(16,185,129,0.8)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(0, y3);
      ctx.lineTo(w, y3);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }, [data, ma3, ma6]);

  return <canvas ref={canvasRef} className="mini-chart" width={220} height={60} />;
}

export default function RecommendCard({ data, loading, error }) {
  if (loading) return (
    <div className="card loading-card">
      <div className="spinner" />
      <span className="loading-text">Generating AI recommendation...</span>
    </div>
  );
  if (error) return <div className="card error-banner">⚠ {error}</div>;
  if (!data) return null;

  const { recommendation: rec, forecast, sales_trend, audit_reasoning } = data;

  const urgencyClass = {
    critical: "urgency-critical",
    high: "urgency-high",
    medium: "urgency-medium",
    low: "urgency-low"
  }[rec.urgency] || "urgency-low";

  const trendClass = {
    increasing: "trend-increasing",
    stable: "trend-stable",
    decreasing: "trend-decreasing"
  }[sales_trend.trend] || "trend-stable";

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon cyan">🤖</div>
        <span className="card-title">AI Restocking Recommendation</span>
      </div>

      <div className={`urgency-banner ${urgencyClass}`}>
        {rec.urgency_message}
      </div>

      <div className="restock-hero">
        <div className="restock-qty">{rec.restock_quantity}</div>
        <div className="restock-meta">
          <span className="label">Recommended Restock</span>
          <span className="unit">units to order</span>
          {rec.estimated_cost_inr > 0 && (
            <span className="cost">≈ ₹{rec.estimated_cost_inr.toLocaleString()}</span>
          )}
        </div>
      </div>

      <div className="trend-label">
        6-month sales trend:
        <span className={`trend-badge ${trendClass}`}>{sales_trend.trend}</span>
        <span style={{ marginLeft: "auto", fontSize: "10px" }}>
          MA3: {sales_trend.ma_3} | MA6: {sales_trend.ma_6}
        </span>
      </div>

      <MiniBarChart data={sales_trend.data} ma3={sales_trend.ma_3} ma6={sales_trend.ma_6} />

      <div className="meta-row" style={{ marginBottom: "8px" }}>
        <span>🌡️</span>
        <span>Seasonal factor ({forecast.seasonality_period}): {forecast.seasonality_factor}×</span>
        <span className="dot-sep">·</span>
        <span>Target coverage: 2 months</span>
      </div>

      <div className="audit-accordion">
        <div
          className="audit-accordion-header"
          onClick={(e) => {
            const body = e.currentTarget.nextElementSibling;
            body.style.display = body.style.display === "none" ? "flex" : "none";
            e.currentTarget.querySelector(".audit-accordion-chevron").classList.toggle("open");
          }}
        >
          <span>🔍 Audit Reasoning — {audit_reasoning.model}</span>
          <span className="audit-accordion-chevron">▾</span>
        </div>
        <div className="audit-accordion-body" style={{ display: "none" }}>
          {(audit_reasoning.steps || []).map((step, i) => (
            <div key={i} className="audit-step">
              <span className="audit-step-num">{i + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
