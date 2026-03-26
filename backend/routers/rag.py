import os
import re
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import numpy as np
from dotenv import load_dotenv
from data_loader import load_rag_docs, get_medicine_by_name

load_dotenv()

router = APIRouter(prefix="/api", tags=["rag"])

GEMINI_AVAILABLE = False
gemini_model = None

try:
    import google.generativeai as genai
    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key and api_key != "your_gemini_api_key_here":
        genai.configure(api_key=api_key)
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        GEMINI_AVAILABLE = True
except Exception:
    pass


STOPWORDS = {"the", "a", "an", "and", "or", "is", "in", "to", "of", "for",
             "be", "are", "as", "by", "at", "its", "this", "that", "with",
             "from", "on", "it", "not", "have", "must", "under", "any", "all"}


def tokenize(text: str) -> list[str]:
    words = re.findall(r"[a-z]+", text.lower())
    return [w for w in words if w not in STOPWORDS and len(w) > 2]


def build_vocab(docs: list[list[str]]) -> dict[str, int]:
    vocab: dict[str, int] = {}
    for tokens in docs:
        for t in tokens:
            if t not in vocab:
                vocab[t] = len(vocab)
    return vocab


def vectorize(tokens: list[str], vocab: dict[str, int]) -> np.ndarray:
    vec = np.zeros(len(vocab), dtype=float)
    for t in tokens:
        if t in vocab:
            vec[vocab[t]] += 1.0
    norm = np.linalg.norm(vec)
    return vec / norm if norm > 0 else vec


def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b))


def retrieve_relevant_docs(query: str, top_k: int = 3) -> list[dict]:
    """Bag-of-words cosine similarity retrieval over CDSCO knowledge base."""
    docs = load_rag_docs()
    corpus_texts = [f"{d['title']}. {d['content']} {' '.join(d.get('tags', []))}" for d in docs]
    corpus_tokens = [tokenize(t) for t in corpus_texts]
    query_tokens = tokenize(query)

    all_tokens = corpus_tokens + [query_tokens]
    vocab = build_vocab(all_tokens)

    doc_vecs = [vectorize(t, vocab) for t in corpus_tokens]
    query_vec = vectorize(query_tokens, vocab)

    similarities = [cosine_sim(query_vec, dv) for dv in doc_vecs]
    top_indices = sorted(range(len(similarities)), key=lambda i: similarities[i], reverse=True)[:top_k]

    results = []
    for idx in top_indices:
        results.append({
            "doc_id": docs[idx]["id"],
            "title": docs[idx]["title"],
            "content": docs[idx]["content"],
            "similarity_score": round(similarities[idx], 4)
        })
    return results


def generate_explanation_fallback(med: dict, retrieved_docs: list[dict]) -> str:
    """Rule-based explanation when Gemini is not available."""
    schedule = med.get("schedule", "OTC")
    name = med["name"]
    salt = med["salt"]
    
    schedule_text = {
        "OTC": f"{name} is an Over-the-Counter (OTC) medicine. No prescription is required, and patients can self-purchase from any licensed pharmacy.",
        "H": f"{name} falls under Schedule H of the Drugs and Cosmetics Act. A valid prescription from a Registered Medical Practitioner is mandatory before dispensing.",
        "H1": f"{name} is a Schedule H1 drug. In addition to requiring a prescription, pharmacies must maintain a dedicated H1 register with patient and prescriber details, to be preserved for 3 years.",
        "X": f"{name} is a Schedule X controlled substance under the NDPS Act, 1985. It requires a prescription in triplicate, locked cabinet storage, and a special Form 20-F pharmacy license."
    }
    
    base = schedule_text.get(schedule, f"{name} is classified as {schedule}.")
    sources = " | ".join([d["title"] for d in retrieved_docs[:2]])
    
    return f"{base}\n\nActive Ingredient: {salt}.\n\nRegulatory Reference: {sources}."


class ExplainRequest(BaseModel):
    medicine_name: str


@router.post("/explain")
def explain_drug(req: ExplainRequest):
    med = get_medicine_by_name(req.medicine_name)
    if not med:
        raise HTTPException(status_code=404, detail=f"Medicine '{req.medicine_name}' not found.")
    
    # Build RAG query
    schedule = med.get("schedule", "OTC")
    query = f"{req.medicine_name} {med.get('salt', '')} Schedule {schedule} CDSCO regulations prescription requirements India pharmacy"
    
    # Retrieve relevant passages
    retrieved_docs = retrieve_relevant_docs(query, top_k=3)
    
    # Generate explanation
    if GEMINI_AVAILABLE and gemini_model:
        context = "\n\n".join([
            f"[Source: {d['title']}]\n{d['content']}"
            for d in retrieved_docs
        ])
        
        prompt = f"""You are a regulatory compliance expert for Indian pharmacy. Using the provided regulatory context, give a clear, structured explanation for a pharmacist about the drug '{req.medicine_name}'.

Drug Details:
- Salt: {med.get('salt', 'N/A')}
- Schedule: Schedule {schedule}
- Requires Prescription: {med.get('requires_prescription', False)}
- Category: {med.get('category', 'N/A')}
- Storage: {med.get('storage', 'N/A')}

Regulatory Context:
{context}

Provide:
1. A 2–3 sentence explanation of what this drug does and why it is in Schedule {schedule}
2. Key dispensing rules the pharmacist must follow
3. Storage and handling requirements
4. Any special warnings or restrictions
Keep it professional, concise, and in plain English. Format with clear headers."""
        
        try:
            response = gemini_model.generate_content(prompt)
            explanation = response.text
            source = "gemini-1.5-flash"
        except Exception as e:
            explanation = generate_explanation_fallback(med, retrieved_docs)
            source = "rule-based-fallback"
    else:
        explanation = generate_explanation_fallback(med, retrieved_docs)
        source = "rule-based-fallback"
    
    return {
        "medicine_name": med["name"],
        "schedule": schedule,
        "explanation": explanation,
        "retrieved_passages": retrieved_docs,
        "audit_reasoning": {
            "retrieval_method": "TF-IDF cosine similarity over CDSCO knowledge base",
            "generation_source": source,
            "top_passages_used": [d["title"] for d in retrieved_docs],
            "query_used": query,
            "generated_at": datetime.now().isoformat(),
            "gemini_available": GEMINI_AVAILABLE
        }
    }
