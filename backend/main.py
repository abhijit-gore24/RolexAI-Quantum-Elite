import os
import uuid
import json
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Security, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from models.schemas import (
    LoginRequest, TokenResponse, ChatRequest, ChatMessage,
    UploadResponse, HealthResponse, ChatSession
)
from rag.pipeline import RAGPipeline
from utils.config import Config

app = FastAPI(
    title="Rolex Quantum Elite API",
    description="Intelligence orchestration layer for document neural processing",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global pipeline instance
rag_pipeline = RAGPipeline()

# Mock database/state for sessions and history
# In a production environment, use PostgreSQL/Redis
SESSIONS_FILE = "./data/sessions.json"
if not os.path.exists(SESSIONS_FILE):
    os.makedirs("./data", exist_ok=True)
    with open(SESSIONS_FILE, "w") as f:
        json.dump({}, f)

def get_sessions():
    try:
        with open(SESSIONS_FILE, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def save_sessions(sessions):
    with open(SESSIONS_FILE, "w") as f:
        json.dump(sessions, f)

# --- SECURITY MIDDLEWARE ---
async def verify_token(authorization: Optional[str] = Header(None)):
    """
    Validates the bearer token in the request header.
    In this implementation, we check for a 'mock-token-' prefix as a baseline.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Authentication required. Please provide a valid elite token."
        )
    
    token = authorization.split(" ")[1]
    # Simple validation for the demo
    if not token.startswith("mock-token-"):
        raise HTTPException(status_code=403, detail="Invalid or expired session token.")
    
    return token

# --- ROUTES ---

@app.get("/health", response_model=HealthResponse)
async def health():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "model": Config.OPENROUTER_MODEL,
        "vector_db": "ChromaDB",
        "documents_indexed": 0
    }

@app.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    # Fix: Use secure comparison for credentials
    if req.username == Config.ADMIN_USERNAME and req.password == Config.ADMIN_PASSWORD:
        # Generate a secure session token
        access_token = "mock-token-" + str(uuid.uuid4()).replace("-", "")
        return {
            "access_token": access_token,
            "username": req.username,
            "token_type": "bearer"
        }
    raise HTTPException(status_code=401, detail="Elite credentials verification failed.")

@app.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    token: str = Depends(verify_token)
):
    file_path = os.path.join(Config.UPLOAD_DIR, file.filename)
    
    # Security: Ensure upload directory exists
    os.makedirs(Config.UPLOAD_DIR, exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    try:
        chunks_count = rag_pipeline.ingest_file(file_path)
        return {
            "filename": file.filename,
            "chunks": chunks_count,
            "message": "Neural indexing complete",
            "file_id": str(uuid.uuid4())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Intelligence ingestion error: {str(e)}")

@app.post("/chat")
async def chat(
    req: ChatRequest,
    token: str = Depends(verify_token)
):
    if req.stream:
        async def stream_generator():
            try:
                async for chunk in rag_pipeline.ask_stream(req.message):
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'content': f'Error: {str(e)}'})}\n\n"
                yield "data: [DONE]\n\n"
        
        return StreamingResponse(stream_generator(), media_type="text/event-stream")
    else:
        try:
            answer, sources = rag_pipeline.ask(req.message)
            return {
                "role": "assistant",
                "content": answer,
                "sources": sources,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
async def get_history(token: str = Depends(verify_token)):
    sessions = get_sessions()
    # Sort by updated_at descending
    sorted_sessions = sorted(
        sessions.values(), 
        key=lambda x: x.get('updated_at', ''), 
        reverse=True
    )
    return sorted_sessions

@app.post("/sessions")
async def create_session(token: str = Depends(verify_token)):
    session_id = str(uuid.uuid4())
    sessions = get_sessions()
    new_session = {
        "session_id": session_id,
        "title": f"Nexus Session {len(sessions) + 1}",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "message_count": 0
    }
    sessions[session_id] = new_session
    save_sessions(sessions)
    return new_session

@app.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    token: str = Depends(verify_token)
):
    sessions = get_sessions()
    if session_id in sessions:
        del sessions[session_id]
        save_sessions(sessions)
        return {"message": "Neural session purged"}
    raise HTTPException(status_code=404, detail="Session not found in Nexus storage")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
