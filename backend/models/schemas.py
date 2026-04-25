from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    timestamp: Optional[str] = None
    sources: Optional[List[dict]] = None


class ChatRequest(BaseModel):
    session_id: str
    message: str
    use_rag: bool = True
    stream: bool = True


class ChatSession(BaseModel):
    session_id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int = 0


class RenameSessionRequest(BaseModel):
    title: str


class UploadResponse(BaseModel):
    filename: str
    chunks: int
    message: str
    file_id: str


class DocumentInfo(BaseModel):
    file_id: str
    filename: str
    uploaded_at: str
    chunk_count: int
    size_bytes: int


class SettingsRequest(BaseModel):
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048
    system_prompt: Optional[str] = None
    use_memory: Optional[bool] = True
    chunk_size: Optional[int] = 1000
    chunk_overlap: Optional[int] = 200


class HealthResponse(BaseModel):
    status: str
    version: str
    model: str
    vector_db: str
    documents_indexed: int
