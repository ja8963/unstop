# 🧪 AI Pharmacy Assistant — RxIntelligence

> **Unstop Hackathon Submission** | AI-powered pharmacy compliance, regulatory explainability, and inventory intelligence dashboard.

![RxIntelligence Dashboard](https://img.shields.io/badge/React-18-blue?logo=react) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi) ![AI](https://img.shields.io/badge/AI-RAG%20%2B%20Gemini-purple?logo=google) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🎯 Problem Statement

Indian pharmacies face three critical pain points every day:
1. **Compliance confusion** — Schedule H/H1/X rules are complex; errors lead to legal penalties
2. **Regulatory opacity** — CDSCO guidelines are hard to interpret at the point of dispensing
3. **Inventory blindspots** — expired stock, stockouts, and over-ordering cost money and patient safety

**RxIntelligence** solves all three with an AI-first dashboard — one medicine search, instant 360° insight.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🛡️ **Compliance Flag** | Instant Schedule H / H1 / X / OTC badge with risk level, prescription requirement, and key regulatory rules |
| 📚 **RAG Explanation** | Retrieval-Augmented Generation over 12 CDSCO regulatory passages — explains *why* a drug is controlled |
| ⚗️ **Salt & Alternatives** | Active salt composition, brand names, and clickable alternative drugs |
| 📦 **Inventory Alerts** | Color-coded stock ring chart + multi-tier expiry classification (expired/critical/expiring soon) |
| 🤖 **AI Restock Recommendation** | Weighted Moving Average + seasonality forecasting with full audit reasoning |
| 🔍 **Audit Trail** | Every decision includes traceable reasoning (which passages retrieved, which formula used, when computed) |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│  SearchBar → ComplianceCard → SaltCard → InventoryCard      │
│           → RecommendCard → RegulatoryPanel (RAG)           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (REST API)
┌──────────────────────▼──────────────────────────────────────┐
│                    FastAPI Backend                           │
│  /api/medicines    /api/compliance    /api/explain (RAG)     │
│  /api/inventory    /api/recommend                            │
└──────────┬───────────────────────────┬───────────────────────┘
           │                           │
┌──────────▼──────────┐   ┌───────────▼──────────────────────┐
│  medicines.json      │   │  cdsco_rag_docs.json (12 passages│
│  (25 drugs: OTC,    │   │  from CDSCO/Drugs & Cosmetics    │
│  H, H1, X)          │   │  Act / NDPS Act)                 │
└─────────────────────┘   └──────────────────────────────────┘
                                       │
                           ┌───────────▼──────────────────────┐
                           │  TF-IDF BoW Retrieval (NumPy)    │
                           │       +                           │
                           │  Google Gemini 1.5 Flash          │
                           │  (rule-based fallback if no key)  │
                           └───────────────────────────────────┘
```

---

## 📂 Project Structure

```
.
├── backend/
│   ├── main.py                    # FastAPI app, CORS, router registration
│   ├── data_loader.py             # JSON data loader utilities
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # API key template
│   ├── data/
│   │   ├── medicines.json         # 25 structured medicine records
│   │   └── cdsco_rag_docs.json    # 12 CDSCO regulatory passages (RAG KB)
│   └── routers/
│       ├── medicine.py            # GET /api/medicines, /api/medicine/{name}
│       ├── compliance.py          # POST /api/compliance (schedule + audit)
│       ├── rag.py                 # POST /api/explain (TF-IDF + Gemini)
│       ├── inventory.py           # POST /api/inventory (stock/expiry alerts)
│       └── recommend.py           # POST /api/recommend (WMA + seasonality)
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                # Layout, state management, API orchestration
│   │   ├── index.css              # Full design system (dark mode + animations)
│   │   ├── api.js                 # Centralized API layer
│   │   └── components/
│   │       ├── SearchBar.jsx      # Autocomplete medicine picker
│   │       ├── ComplianceCard.jsx # Schedule badge + regulatory requirements
│   │       ├── SaltCard.jsx       # Salt + alternatives (clickable)
│   │       ├── InventoryCard.jsx  # SVG stock ring + expiry chips
│   │       ├── RecommendCard.jsx  # Canvas bar chart + audit accordion
│   │       └── RegulatoryPanel.jsx# RAG explanation + passage chips
├── start_backend.bat              # One-click backend launcher (Windows)
├── start_frontend.bat             # One-click frontend launcher (Windows)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+ with `python` on PATH
- Node.js 18+ with `npm`

### 1. Clone / Download

```bash
git clone <your-repo-url>
cd "unstop prototype"
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
python -m pip install -r requirements.txt

# Optional: enable Gemini AI explanations
copy .env.example .env
# Edit .env and add: GEMINI_API_KEY=your_key_here

# Start the server
python -m uvicorn main:app --reload --port 8000
```

Backend runs at **http://localhost:8000** — API docs at **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

### Windows One-Click Launchers
Double-click **`start_backend.bat`** and **`start_frontend.bat`** in separate windows.

---

## 🤖 AI Components

### RAG Pipeline (Regulatory Explanation)
- **Retrieval**: Bag-of-words cosine similarity (NumPy) over 12 CDSCO passages
- **Generation**: Google Gemini 1.5 Flash — sends query + top-3 retrieved passages
- **Fallback**: Rule-based explanation if no Gemini API key is configured
- **Audit**: Full trace of query used, passages retrieved, similarity scores, and generation source

### Forecasting Model (Inventory Recommendation)
```
forecast = (0.6 × MA3 + 0.4 × MA6) × seasonality_factor
restock  = max(0, 2-month_target − current_stock) × 1.15  (15% buffer)
```
- **MA3**: 3-month weighted average (60% weight — recent trends)
- **MA6**: 6-month weighted average (40% weight — long-term baseline)
- **Seasonality**: Category-specific monthly modifiers (e.g., antihistamines spike in allergy season Mar–May)
- **Output**: Restock quantity + urgency level + step-by-step audit log

---

## 💊 Medicine Dataset

25 drugs across all Indian regulatory schedules:

| Schedule | Count | Examples |
|---|---|---|
| OTC | 4 | Paracetamol, Ibuprofen, Cetirizine, Vitamin D3 |
| Schedule H | 15 | Amoxicillin, Metformin, Atorvastatin, Alprazolam |
| Schedule X | 3 | Morphine, Codeine, Diazepam |

Each record includes: salt, brand names, alternatives, stock qty, expiry date, reorder level, unit price, 6-month sales history, storage requirements.

---

## 📋 API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/medicines` | List all medicines (name, id, schedule) |
| GET | `/api/medicine/{name}` | Full medicine record |
| POST | `/api/compliance` | Compliance check + schedule metadata |
| POST | `/api/explain` | RAG regulatory explanation + audit |
| POST | `/api/inventory` | Stock + expiry status + alerts |
| POST | `/api/recommend` | AI restocking recommendation + forecast |

Interactive docs: http://localhost:8000/docs

---

## 🎨 UI Highlights

- **Dark mode** glassmorphism design (no third-party UI library)
- **Workflow stepper** tracks the 5-step analysis pipeline in real time
- **SVG stock ring** dynamically colored by stock level
- **Canvas mini bar chart** shows 6-month sales trend with MA3 dashed line
- **Collapsible audit accordions** on every AI-generated output
- **Clickable alternative drugs** — clicking any alternative instantly refreshes the full dashboard

---

## 🔒 Compliance Coverage

| Schedule | Regulatory Basis | Requirements Shown |
|---|---|---|
| OTC | Drugs & Cosmetics Act | No prescription; self-medication guidance |
| Schedule H | D&C Rules, Rule 65(15) | Rx, pharmacist register, label warning |
| Schedule H1 | CDSCO Amendment 2013 | H1 register, 3-year records, stewardship |
| Schedule X | NDPS Act 1985 | Form 20-F license, locked storage, triplicate Rx |

---

## 🛠️ Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Fast HMR, modern SPA |
| Styling | Vanilla CSS | Full control, no Tailwind overhead |
| Backend | FastAPI + Uvicorn | Async Python, auto-docs |
| AI (RAG) | NumPy + Gemini Flash | Lightweight retrieval, powerful generation |
| Forecasting | NumPy (WMA) | No heavy ML lib needed |
| Data | JSON | Portable, no DB setup required |

---

## 👤 Team

Built for **Unstop Hackathon 2025**

---

## 📄 License

MIT License — free to use and modify.
