import { useState, useEffect, useCallback } from "react";
import "./index.css";
import SearchBar from "./components/SearchBar";
import ComplianceCard from "./components/ComplianceCard";
import SaltCard from "./components/SaltCard";
import InventoryCard from "./components/InventoryCard";
import RecommendCard from "./components/RecommendCard";
import RegulatoryPanel from "./components/RegulatoryPanel";
import {
  fetchMedicines,
  fetchCompliance,
  fetchExplain,
  fetchInventory,
  fetchRecommend,
} from "./api";

export default function App() {
  const [medicines, setMedicines] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [data, setData] = useState({
    compliance: null,
    explain: null,
    inventory: null,
    recommend: null,
  });

  useEffect(() => {
    fetchMedicines()
      .then(setMedicines)
      .catch(() => {});
  }, []);

  const setLoad = (key, val) =>
    setLoading((prev) => ({ ...prev, [key]: val }));
  const setErr = (key, val) =>
    setErrors((prev) => ({ ...prev, [key]: val }));

  const runAll = useCallback(async (name) => {
    setData({ compliance: null, explain: null, inventory: null, recommend: null });
    setErrors({});

    const tasks = [
      {
        key: "compliance",
        fn: () => fetchCompliance(name),
      },
      {
        key: "explain",
        fn: () => fetchExplain(name),
      },
      {
        key: "inventory",
        fn: () => fetchInventory(name),
      },
      {
        key: "recommend",
        fn: () => fetchRecommend(name),
      },
    ];

    // Run compliance first (fast), then RAG in parallel with rest
    for (const { key, fn } of tasks) {
      setLoad(key, true);
    }

    await Promise.all(
      tasks.map(async ({ key, fn }) => {
        try {
          const result = await fn();
          setData((prev) => ({ ...prev, [key]: result }));
        } catch (e) {
          setErr(key, e.message || "Error loading data");
        } finally {
          setLoad(key, false);
        }
      })
    );
  }, []);

  const handleSelect = (name) => {
    if (!name) {
      setSelected(null);
      setData({ compliance: null, explain: null, inventory: null, recommend: null });
      setErrors({});
      return;
    }
    setSelected(name);
    runAll(name);
  };

  // Workflow stepper state
  const steps = [
    { label: "Select Medicine", done: !!selected },
    { label: "Compliance Flag", done: !!data.compliance },
    { label: "Regulatory Explanation", done: !!data.explain },
    { label: "Inventory Insight", done: !!data.inventory },
    { label: "AI Recommendation", done: !!data.recommend },
  ];
  const currentStep = steps.findLastIndex((s) => s.done);

  const hasAnyData = Object.values(data).some(Boolean);
  const isAnyLoading = Object.values(loading).some(Boolean);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">💊</div>
          <h1>RxIntelligence</h1>
          <p>AI Pharmacy Assistant</p>
        </div>

        <div className="sidebar-section">
          <label htmlFor="medicine-search">Medicine Lookup</label>
          <SearchBar
            medicines={medicines}
            onSelect={handleSelect}
            selected={selected}
          />
        </div>

        <div style={{ flex: 1 }} />

        <div className="sidebar-footer">
          <div>📋 <span>{medicines.length}</span> medicines indexed</div>
          <div>🏛️ <span>12</span> CDSCO passages</div>
          <div>🤖 RAG + WMA Forecasting</div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h2>{selected ? `Results for: ${selected}` : "AI Pharmacy Compliance Dashboard"}</h2>
            <p>
              {selected
                ? "Showing end-to-end analysis — compliance, explanation, inventory, and AI recommendation"
                : "Select a medicine from the sidebar to begin compliance analysis"}
            </p>
          </div>
          <div className="topbar-badges">
            <span className="topbar-badge live">● Live</span>
            <span className="topbar-badge rag">RAG Enabled</span>
          </div>
        </div>

        <div className="dashboard">
          {/* Workflow Stepper */}
          {(selected || hasAnyData) && (
            <div className="workflow-stepper">
              {steps.map((step, i) => {
                const status =
                  step.done ? "done"
                  : i === currentStep + 1 && isAnyLoading ? "active"
                  : "pending";
                return (
                  <div key={i} className="step">
                    <div className={`step ${status}`}>
                      <div className="step-circle">
                        {step.done ? "✓" : i + 1}
                      </div>
                      <span className="step-label">{step.label}</span>
                    </div>
                    {i < steps.length - 1 && <span className="step-arrow">→</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!selected && !hasAnyData && (
            <div className="dashboard-empty">
              <div className="empty-icon">💊</div>
              <h3>Search for a medicine to begin</h3>
              <p>
                Enter any medicine name in the sidebar to instantly view compliance
                status, regulatory rules, inventory alerts, and AI-powered restocking
                recommendations.
              </p>
            </div>
          )}

          {/* Dashboard Grid */}
          {(selected || hasAnyData) && (
            <div className="dashboard-grid">
              {/* Compliance + Salt row */}
              <ComplianceCard
                data={data.compliance}
                loading={loading.compliance}
                error={errors.compliance}
              />
              <SaltCard
                data={data.compliance}
                onSelectAlternative={handleSelect}
              />

              {/* Inventory + Recommend row */}
              <InventoryCard
                data={data.inventory}
                loading={loading.inventory}
                error={errors.inventory}
              />
              <RecommendCard
                data={data.recommend}
                loading={loading.recommend}
                error={errors.recommend}
              />

              {/* Regulatory Panel — full width */}
              <RegulatoryPanel
                data={data.explain}
                loading={loading.explain}
                error={errors.explain}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
