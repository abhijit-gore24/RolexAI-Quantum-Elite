import os
import requests
from typing import List
from langchain_openai import ChatOpenAI
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.embeddings.base import Embeddings
from utils.config import Config


class HuggingFaceDirectEmbeddings(Embeddings):
    """Custom embedding class that calls HuggingFace Inference API directly.
    This avoids all langchain-huggingface version conflict issues.
    """
    def __init__(self, api_token: str, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.api_token = api_token
        self.api_url = f"https://api-inference.huggingface.co/models/{model_name}"
        self.headers = {"Authorization": f"Bearer {api_token}"}

    def _call_api(self, inputs):
        for attempt in range(3):
            try:
                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json={"inputs": inputs},
                    timeout=30
                )
                if response.status_code == 503:
                    # Model is loading, wait and retry
                    import time
                    time.sleep(10)
                    continue
                response.raise_for_status()
                result = response.json()
                return result
            except Exception as e:
                if attempt == 2:
                    raise RuntimeError(f"HuggingFace API failed after 3 attempts: {e}")
        raise RuntimeError("HuggingFace API failed after 3 attempts")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        result = self._call_api(texts)
        # Handle both list-of-lists and list-of-list-of-lists responses
        if isinstance(result[0][0], list):
            # Some models return pooled output differently: take mean
            return [list(map(lambda x: sum(x)/len(x) if isinstance(x, list) else x, row)) for row in result]
        return result

    def embed_query(self, text: str) -> List[float]:
        result = self._call_api(text)
        if isinstance(result[0], list):
            # Some models return nested lists; flatten by averaging
            return [sum(x) / len(x) if isinstance(x, list) else x for x in result]
        return result


class RAGPipeline:
    def __init__(self):
        self.embeddings = HuggingFaceDirectEmbeddings(
            api_token=Config.HUGGINGFACE_API_TOKEN,
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        self.vector_db = Chroma(
            persist_directory=Config.CHROMA_DB_PATH,
            embedding_function=self.embeddings
        )
        self.llm = ChatOpenAI(
            openai_api_key=Config.OPENROUTER_API_KEY,
            model=Config.OPENROUTER_MODEL,
            base_url="https://openrouter.ai/api/v1",
            temperature=0.3
        )
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key="answer"
        )
        self.retriever = self.vector_db.as_retriever(search_kwargs={"k": 3})
        self.qa_chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=self.retriever,
            memory=self.memory,
            return_source_documents=True,
            verbose=False
        )

    def ingest_file(self, file_path: str):
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext == ".pdf":
            loader = PyPDFLoader(file_path)
        elif file_ext == ".docx":
            loader = Docx2txtLoader(file_path)
        elif file_ext == ".txt":
            loader = TextLoader(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")

        documents = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(documents)
        self.vector_db.add_documents(chunks)
        return len(chunks)

    def ask(self, query: str):
        response = self.qa_chain.invoke({"question": query})
        answer = response["answer"]
        sources = []
        if "source_documents" in response:
            for doc in response["source_documents"]:
                sources.append({
                    "content": doc.page_content[:200] + "...",
                    "metadata": doc.metadata
                })
        return answer, sources

    async def ask_stream(self, query: str):
        async for chunk in self.llm.astream(query):
            yield chunk.content
