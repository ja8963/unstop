import { useState } from "react";

export default function RegulatoryPanel({ data, loading, error }) {
  const [open, setOpen] = useState(false);

  if (loading) return (
    <div className="card loading-card card-full">
      <div className="spinner" />
      <span className="loading-text">Running RAG pipeline — retrieving CDSCO regulations...</span>
    </div>
  );
  if (error) return <div className="card error-banner card-full">⚠ {error}</div>;
  if (!data) return null;

  const { explanation, retrieved_passages, audit_reasoning } = data;

  return (
    <div className="card card-full">
      <div className="card-header">
        <div className="card-icon green">📚</div>
        <span className="card-title">Regulatory Explanation (RAG)</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          <span className="topbar-badge rag">
            {audit_reasoning.generation_source === "gemini-1.5-flash" ? "🤖 Gemini Flash" : "📋 Rule-Based"}
          </span>
          <span className="topbar-badge live">TF-IDF Retrieval</span>
        </div>
      </div>

      <div className="explanation-text">{explanation}</div>

      <div className="section-label" style={{ marginBottom: "8px" }}>Retrieved CDSCO Passages</div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
        {(retrieved_passages || []).map((p) => (
          <span key={p.doc_id} className="passage-chip" title={p.content.slice(0, 120) + "..."}>
            📄 {p.title.slice(0, 40)}... <small>({(p.similarity_score * 100).toFixed(0)}%)</small>
          </span>
        ))}
      </div>

      <div className="audit-accordion">
        <div
          className="audit-accordion-header"
          onClick={() => setOpen((o) => !o)}
        >
          <span>🔍 Audit Reasoning</span>
          <span className={`audit-accordion-chevron ${open ? "open" : ""}`}>▾</span>
        </div>
        {open && (
          <div className="audit-accordion-body">
            <div className="audit-step">
              <span className="audit-step-num">1</span>
              <span>Retrieval method: {audit_reasoning.retrieval_method}</span>
            </div>
            <div className="audit-step">
              <span className="audit-step-num">2</span>
              <span>Query used: <em style={{ color: "var(--accent-cyan)" }}>{audit_reasoning.query_used}</em></span>
            </div>
            <div className="audit-step">
              <span className="audit-step-num">3</span>
              <span>Top passages retrieved:</span>
            </div>
            {(audit_reasoning.top_passages_used || []).map((p, i) => (
              <div key={i} className="audit-step" style={{ paddingLeft: "28px" }}>
                <span className="passage-chip">📄 {p}</span>
              </div>
            ))}
            <div className="audit-step">
              <span className="audit-step-num">4</span>
              <span>Generation: {audit_reasoning.generation_source} | Gemini available: {String(audit_reasoning.gemini_available)}</span>
            </div>
            <div className="audit-step">
              <span className="audit-step-num">5</span>
              <span>Generated at: {new Date(audit_reasoning.generated_at).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
