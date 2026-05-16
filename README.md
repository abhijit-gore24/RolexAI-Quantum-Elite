# 🌌 Rolex Quantum Elite — BotForge AI
### *The Pinnacle of Document Intelligence & Neural Orchestration*

Rolex Quantum Elite (BotForge) is a premium, production-grade AI ecosystem engineered for elite data analysis, RAG-based document intelligence, and real-time neural processing. Designed with a stunning white-glass "Nexus" aesthetic, it provides a seamless bridge between complex data structures and actionable intelligence.

---

## 💎 Elite Capabilities

- **🧠 Neural Chat** — High-performance real-time streaming with context-aware memory and deep retrieval.
- **📚 Knowledge Fusion** — Secure ingestion of PDF, DOCX, and TXT files into a private ChromaDB vector database.
- **🔍 RAG Pipeline** — Retrieval-Augmented Generation powered by LangChain for grounded, source-cited responses.
- **🛡️ Enterprise Security** — JWT-based authentication with multi-layer token verification and local data persistence.
- **✨ Nexus Interface** — A state-of-the-art glassmorphic UI with premium animations and micro-interactions.
- **⚡ Atomic Speed** — Powered by FastAPI + OpenRouter for lightning-fast inference with streaming support.
- **📊 Session Management** — Persistent chat history with session creation, retrieval, and deletion.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (React)                │
│   Vite • TypeScript • Tailwind • Framer Motion   │
│                                                   │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │  Chat    │ │  Docs    │ │  History/Settings│  │
│  │  Page    │ │  Upload  │ │  Pages           │  │
│  └────┬─────┘ └────┬─────┘ └────────┬────────┘  │
│       └─────────────┴────────────────┘            │
│                     │  /api proxy                 │
└─────────────────────┼─────────────────────────────┘
                      │
┌─────────────────────┼─────────────────────────────┐
│                  Backend (FastAPI)                 │
│                     │                              │
│  ┌──────────────────┴───────────────────────────┐ │
│  │              RAG Pipeline                     │ │
│  │  LangChain • HuggingFace Embeddings          │ │
│  │  ChromaDB (Vector Store) • OpenRouter LLM     │ │
│  └───────────────────────────────────────────────┘ │
│                                                    │
│  Auth (JWT) • Sessions (JSON) • File Uploads       │
└────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Orchestration

### 1. Intelligence Core (Backend)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```
> Ensure your `.env` is configured with a valid **OpenRouter API Key**.

### 2. Neural Interface (Frontend)
```bash
cd frontend
npm install
npm run dev
```
> Access the portal at **http://localhost:5173**

---

## 🔐 Credentials & Security

| Field | Value |
|-------|-------|
| **Access Portal** | `http://localhost:5173` |
| **API Docs (Swagger)** | `http://localhost:8000/docs` |
| **Username** | `Abhijit` |
| **Password** | `Abhijit` |
| **Protocol** | Bearer Token (JWT) |

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | FastAPI, LangChain, ChromaDB, HuggingFace Embeddings |
| **LLM** | OpenRouter (GPT-3.5-Turbo / configurable) |
| **Architecture** | Modular RAG (Retrieval-Augmented Generation) |
| **Auth** | JWT with HS256 |

---

## 📁 Project Structure

```
RolexAI/
├── backend/
│   ├── main.py              # FastAPI application & routes
│   ├── rag/
│   │   └── pipeline.py      # RAG pipeline (ingest, query, stream)
│   ├── models/
│   │   └── schemas.py       # Pydantic request/response models
│   ├── utils/
│   │   ├── config.py        # Environment configuration
│   │   └── auth.py          # JWT authentication
│   ├── data/                # Sessions & messages (JSON store)
│   ├── uploads/             # Uploaded documents
│   ├── chroma_db/           # ChromaDB vector store
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Router & layout
│   │   ├── context/         # Auth context provider
│   │   ├── components/      # Sidebar, Navbar
│   │   ├── pages/           # Chat, Docs, History, Settings, Login
│   │   └── index.css        # Premium design system
│   ├── vite.config.ts       # Vite + API proxy config
│   └── package.json
└── README.md
```

---

**Engineered for Excellence by Abhijit**
*Quantum Elite Implementation v1.0.0*
