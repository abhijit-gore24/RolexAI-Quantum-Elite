import os
from typing import List, Optional
from langchain_openai import ChatOpenAI
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from utils.config import Config

class RAGPipeline:
    def __init__(self):
        # Use HuggingFace Inference API — no local model loaded, minimal RAM usage
        self.embeddings = HuggingFaceEndpointEmbeddings(
            huggingfacehub_api_token=Config.HUGGINGFACE_API_TOKEN,
            model="sentence-transformers/all-MiniLM-L6-v2"
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
            verbose=True
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
