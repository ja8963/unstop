export default function SaltCard({ data, onSelectAlternative }) {
  if (!data) return null;
  const { medicine_name, salt, category, brand_names, alternatives } = data;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon violet">⚗️</div>
        <span className="card-title">Salt Composition & Alternatives</span>
      </div>

      <div className="salt-text">{salt}</div>
      <div className="category-tag">{category}</div>

      {brand_names && brand_names.length > 0 && (
        <>
          <div className="section-label">Brand Names</div>
          <div className="brand-names" style={{ marginBottom: "16px" }}>
            {brand_names.map((b) => (
              <span key={b} className="brand-chip">{b}</span>
            ))}
          </div>
        </>
      )}

      <div className="section-label">Alternative Drugs</div>
      <div className="alternatives-list">
        {(alternatives || []).map((alt) => (
          <button
            key={alt}
            className="alt-pill"
            onClick={() => onSelectAlternative && onSelectAlternative(alt)}
            title={`Switch to ${alt}`}
          >
            💊 {alt}
          </button>
        ))}
      </div>
    </div>
  );
}
