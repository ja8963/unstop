export default function ComplianceCard({ data, loading, error }) {
  if (loading) return (
    <div className="card loading-card">
      <div className="spinner" />
      <span className="loading-text">Checking compliance...</span>
    </div>
  );
  if (error) return <div className="card error-banner">⚠ {error}</div>;
  if (!data) return null;

  const { medicine_name, schedule, schedule_metadata: meta, requires_prescription, category, audit_trail } = data;

  const scheduleClass = {
    OTC: "schedule-otc", H: "schedule-h", H1: "schedule-h1", X: "schedule-x"
  }[schedule] || "schedule-otc";

  const riskClass = {
    low: "risk-low", medium: "risk-medium", high: "risk-high", critical: "risk-critical"
  }[meta?.risk_level] || "risk-low";

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon indigo">🛡️</div>
        <span className="card-title">Compliance Status</span>
      </div>

      <div className="compliance-main">
        <div className="compliance-schedule-row">
          <span className="compliance-name">{medicine_name}</span>
          <span className={`schedule-badge ${scheduleClass}`}>
            <span className="badge-dot" />
            {meta?.label || schedule}
          </span>
          <span className={`risk-level ${riskClass}`}>
            Risk: {meta?.risk_level}
          </span>
        </div>

        <div className={`rx-flag ${requires_prescription ? "required" : "not-required"}`}>
          {requires_prescription ? "🔒 Prescription Required" : "✓ No Prescription Needed"}
        </div>

        <div className="compliance-description">
          {meta?.description}
        </div>

        <div>
          <div className="section-label">Regulatory Requirements</div>
          <ul className="requirements-list">
            {(meta?.key_requirements || []).map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </div>

        <hr className="card-divider" />
        <div className="meta-row">
          <span>📋</span>
          <span>{audit_trail?.regulatory_reference}</span>
          <span className="dot-sep">·</span>
          <span>Category: {category}</span>
        </div>
      </div>
    </div>
  );
}
