import os
import shutil
import time
from collections import defaultdict
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
import chromadb
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core.storage.storage_context import StorageContext
from llama_index.llms.openai_like import OpenAILike
from llama_index.core.vector_stores import ExactMatchFilter, MetadataFilters 
from llama_index.core.memory import ChatMemoryBuffer
# --- 1. IMPORT THE SPECIFIC CHAT ENGINE CLASS ---
from llama_index.core.chat_engine import ContextChatEngine
from .prompts import AgentType, get_prompt
from .analysis_engine import PitchDeckAnalyzer
from .ecosystem_research import StarknetEcosystemResearcher
from .competitor_analysis import CompetitorAnalyzer
from .adaptive_questioning import AdaptiveQuestionEngine


# --- Load Environment and Configure Settings ---
load_dotenv()

Settings.llm = OpenAILike(
    api_base="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    model="anthropic/claude-3.5-sonnet",
    is_chat_model=True,
    context_window=200000 
)
Settings.embed_model = "local:BAAI/bge-small-en-v1.5"

def get_llm_for_agent(agent_type: AgentType):
    """Get the appropriate LLM based on agent type"""
    if agent_type == AgentType.SHARK_VC:
        # Use Perplexity Sonar Pro for web-search enabled VC analysis
        return OpenAILike(
            api_base="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
            model="perplexity/sonar-pro",
            is_chat_model=True,
            context_window=200000,
            max_tokens=400  # Add this line
        )
    else:
        # Use Claude for Product PM deep thinking
        return OpenAILike(
            api_base="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
            model="anthropic/claude-3.5-sonnet",
            is_chat_model=True,
            context_window=200000,
            max_tokens=400  # Add this line
        )

# --- Database and Vector Store Setup ---
db = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = db.get_or_create_collection("starknet_copilot")
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
storage_context = StorageContext.from_defaults(vector_store=vector_store)
index = VectorStoreIndex.from_vector_store(
    vector_store, storage_context=storage_context
)

# --- In-Memory Session Storage ---
chat_engines = {}

# --- Analysis and Research Services ---
analyzer = PitchDeckAnalyzer()
researcher = StarknetEcosystemResearcher()
competitor_analyzer = CompetitorAnalyzer()
question_engine = AdaptiveQuestionEngine()

# --- Rate Limiting ---
request_counts = defaultdict(list)
expensive_request_counts = defaultdict(list)

# General API rate limits
RATE_LIMIT_REQUESTS = 60  # requests per minute for general endpoints
RATE_LIMIT_WINDOW = 60  # seconds

# Expensive operations rate limits (AI-powered features)
EXPENSIVE_RATE_LIMIT = 10  # requests per minute for AI operations
EXPENSIVE_RATE_WINDOW = 60  # seconds

def check_rate_limit(client_ip: str, is_expensive: bool = False):
    """Rate limiting based on client IP and operation type"""
    now = time.time()
    
    if is_expensive:
        # Clean old expensive requests
        expensive_request_counts[client_ip] = [
            req_time for req_time in expensive_request_counts[client_ip] 
            if now - req_time < EXPENSIVE_RATE_WINDOW
        ]
        
        # Check expensive operation rate limit
        if len(expensive_request_counts[client_ip]) >= EXPENSIVE_RATE_LIMIT:
            raise HTTPException(
                status_code=429, 
                detail=f"AI operation rate limit exceeded. Please wait before trying again. Limit: {EXPENSIVE_RATE_LIMIT} requests per minute."
            )
        
        # Add current expensive request
        expensive_request_counts[client_ip].append(now)
    
    # Always check general rate limit
    request_counts[client_ip] = [
        req_time for req_time in request_counts[client_ip] 
        if now - req_time < RATE_LIMIT_WINDOW
    ]
    
    if len(request_counts[client_ip]) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=429, 
            detail=f"Rate limit exceeded. Please try again later. Limit: {RATE_LIMIT_REQUESTS} requests per minute."
        )
    
    # Add current request
    request_counts[client_ip].append(now)



# --- Application Setup ---
app = FastAPI(
    title="Starknet VC Co-pilot MVP",
    description="An AI co-pilot for founders to get feedback on their pitch decks.",
    version="0.1.0",
)

# Determine allowed origins based on environment
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
PRODUCTION_FRONTEND = os.getenv("PRODUCTION_FRONTEND_URL", "")

# Build allowed origins list
allowed_origins = [FRONTEND_URL]
if PRODUCTION_FRONTEND:
    allowed_origins.append(PRODUCTION_FRONTEND)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Be more specific
    allow_headers=["Content-Type", "Authorization", "Accept"],  # Be more specific
)

# --- Data Models ---
class ChatRequest(BaseModel):
    founder_id: str
    message: str
    agent_type: Optional[str] = "Shark VC"  # Default to Shark VC

class ChatResponse(BaseModel):
    reply: str

class UploadResponse(BaseModel):
    message: str
    filename: str

# --- API Endpoints ---
@app.post("/upload/{founder_id}", response_model=UploadResponse)
async def upload_document(founder_id: str, file: UploadFile = File(...), request: Request = None):
    # Rate limiting (expensive operation - file processing + AI analysis)
    if request:
        client_ip = request.client.host
        check_rate_limit(client_ip, is_expensive=True)
    
    # Enhanced security validation
    if file.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs are accepted.")
    
    # File size check (10MB limit)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
    
    # Validate founder_id format (alphanumeric, email, or "anonymous")
    if not founder_id or len(founder_id) > 100:
        raise HTTPException(status_code=400, detail="Invalid founder ID.")
    
    # Sanitize filename to prevent path traversal attacks
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")
    
    safe_filename = "".join(c for c in file.filename if c.isalnum() or c in (' ', '.', '_', '-')).rstrip()
    if not safe_filename or not safe_filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid filename.")

    temp_dir = f"./temp_{founder_id.replace('@', '_').replace('.', '_')}/"
    os.makedirs(temp_dir, exist_ok=True)
    
    try:
        file_path = os.path.join(temp_dir, safe_filename)
        
        # Write file with size limit check during writing
        with open(file_path, "wb") as buffer:
            content = await file.read()
            if len(content) > 10 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
            buffer.write(content)

        reader = SimpleDirectoryReader(
            input_files=[file_path],
            file_metadata=lambda filename: {"founder_id": founder_id}
        )
        documents = reader.load_data()
        index.insert_nodes(documents)
        
        return {"message": f"Document indexed successfully for founder {founder_id}", "filename": safe_filename}
    
    except Exception as e:
        # Log error for debugging but don't expose internal details
        print(f"Upload error for {founder_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process document.")
    
    finally:
        # Ensure temp directory is always cleaned up
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


@app.post("/chat", response_model=ChatResponse)
async def handle_chat(request: ChatRequest):
    founder_id = request.founder_id
    agent_type = AgentType(request.agent_type)
    
    # Create composite key for session storage
    session_key = f"{founder_id}_{agent_type.value}"
    
    if session_key not in chat_engines:
        retriever = index.as_retriever(
            vector_store_query_mode="default",
            filters=MetadataFilters(filters=[ExactMatchFilter(key="founder_id", value=founder_id)])
        )
        memory = ChatMemoryBuffer.from_defaults(token_limit=1500)
        
        # Get the appropriate LLM and prompt
        llm = get_llm_for_agent(agent_type)
        prompt = get_prompt(agent_type)
        
        # Create chat engine with specific LLM
        chat_engines[session_key] = ContextChatEngine.from_defaults(
            retriever=retriever,
            memory=memory,
            system_prompt=prompt,
            llm=llm  # Pass the specific LLM
        )
    
    chat_engine = chat_engines[session_key]
    response = await chat_engine.achat(request.message)
    
    return {"reply": str(response)}

@app.post("/reset/{founder_id}")
async def reset_chat(founder_id: str, agent_type: Optional[str] = None):
    if agent_type:
        session_key = f"{founder_id}_{agent_type}"
        if session_key in chat_engines:
            del chat_engines[session_key]
            return {"message": f"Chat session for {agent_type} has been reset."}
    else:
        # Reset all sessions for this founder
        keys_to_delete = [key for key in chat_engines.keys() if key.startswith(f"{founder_id}_")]
        for key in keys_to_delete:
            del chat_engines[key]
        return {"message": f"All chat sessions for founder {founder_id} have been reset."}
    
    return {"message": f"No active session found."}

# --- Analysis and Research Endpoints ---
@app.post("/analyze/{founder_id}")
async def analyze_pitch_deck(founder_id: str, agent_type: str = "Shark VC", request: Request = None):
    # Rate limiting for AI analysis operations
    if request:
        client_ip = request.client.host
        check_rate_limit(client_ip, is_expensive=True)
    
    # Input validation
    if not founder_id or len(founder_id) > 100:
        raise HTTPException(status_code=400, detail="Invalid founder ID")
    
    # Validate agent_type
    valid_agents = ["Shark VC", "Product PM"]
    if agent_type not in valid_agents:
        raise HTTPException(status_code=400, detail="Invalid agent type")
    
    try:
        # Get founder's documents from vector store
        retriever = index.as_retriever(
            filters=MetadataFilters(filters=[ExactMatchFilter(key="founder_id", value=founder_id)])
        )
        
        # Retrieve relevant document content
        docs = retriever.retrieve("pitch deck analysis")
        content = " ".join([doc.text for doc in docs])
        
        if not content or len(content.strip()) < 50:
            raise HTTPException(status_code=404, detail="No sufficient document content found for analysis")
        
        analysis = analyzer.analyze_document_gaps(content, AgentType(agent_type))
        return analysis
    
    except Exception as e:
        print(f"Analysis error for {founder_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze documents")

@app.get("/ecosystem-updates/{founder_space}")
async def get_ecosystem_updates(founder_space: str, request: Request = None):
    # Rate limiting for AI research operations
    if request:
        client_ip = request.client.host
        check_rate_limit(client_ip, is_expensive=True)
    
    # Input validation and sanitization
    if not founder_space or len(founder_space) > 200:
        raise HTTPException(status_code=400, detail="Invalid founder space parameter")
    
    # Sanitize input to prevent injection attacks
    sanitized_space = "".join(c for c in founder_space if c.isalnum() or c in (' ', '-', '_')).strip()
    if not sanitized_space:
        raise HTTPException(status_code=400, detail="Invalid founder space format")
    
    try:
        updates = await researcher.research_ecosystem_updates(sanitized_space)
        return updates
    except Exception as e:
        print(f"Ecosystem research error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch ecosystem updates")

@app.get("/case-studies")
async def get_case_studies(request: Request = None):
    # Rate limiting for AI research operations
    if request:
        client_ip = request.client.host
        check_rate_limit(client_ip, is_expensive=True)
    
    try:
        case_studies = await researcher.research_successful_cases()
        return case_studies
    except Exception as e:
        print(f"Case studies error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch case studies")

@app.post("/competitor-analysis")
async def analyze_competitors(request: Dict[str, any], req: Request = None):
    # Rate limiting for expensive AI operations
    if req:
        client_ip = req.client.host
        check_rate_limit(client_ip, is_expensive=True)
    
    # Input validation
    if not isinstance(request, dict):
        raise HTTPException(status_code=400, detail="Invalid request format")
    
    project_description = request.get("description", "")
    starknet_focus = request.get("starknet_focus", True)
    
    # Validate project description
    if not project_description or len(project_description.strip()) < 10:
        raise HTTPException(status_code=400, detail="Project description must be at least 10 characters")
    
    if len(project_description) > 2000:
        raise HTTPException(status_code=400, detail="Project description too long (max 2000 characters)")
    
    # Validate starknet_focus parameter
    if not isinstance(starknet_focus, bool):
        raise HTTPException(status_code=400, detail="Invalid starknet_focus parameter")
    
    try:
        analysis = await competitor_analyzer.analyze_competitors(project_description.strip(), starknet_focus)
        return analysis
    except Exception as e:
        print(f"Competitor analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze competitors")

@app.post("/adaptive-questions")
async def get_adaptive_questions(request: Dict[str, any], req: Request = None):
    # Rate limiting for AI question generation
    if req:
        client_ip = req.client.host
        check_rate_limit(client_ip, is_expensive=True)
    
    # Input validation
    if not isinstance(request, dict):
        raise HTTPException(status_code=400, detail="Invalid request format")
    
    missing_sections = request.get("missing_sections", [])
    agent_type = request.get("agent_type", "Shark VC")
    founder_context = request.get("founder_context", "")
    document_content = request.get("document_content", "")
    
    # Validate missing_sections
    if not isinstance(missing_sections, list):
        raise HTTPException(status_code=400, detail="missing_sections must be a list")
    
    if len(missing_sections) > 20:
        raise HTTPException(status_code=400, detail="Too many missing sections")
    
    # Validate agent_type
    valid_agents = ["Shark VC", "Product PM"]
    if agent_type not in valid_agents:
        raise HTTPException(status_code=400, detail="Invalid agent type")
    
    # Validate string lengths
    if len(founder_context) > 500:
        raise HTTPException(status_code=400, detail="Founder context too long")
    
    if len(document_content) > 5000:
        raise HTTPException(status_code=400, detail="Document content too long")
    
    try:
        questions = question_engine.generate_adaptive_questions(missing_sections, agent_type)
        
        # Contextualize questions
        for question in questions:
            question["question"] = question_engine.contextualize_question(
                question["question"], founder_context.strip(), document_content.strip()
            )
        
        return {"questions": questions}
    except Exception as e:
        print(f"Adaptive questions error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate questions")

# --- Health Check ---
@app.get("/")
def read_root():
    return {"status": "Starknet VC Co-pilot API is running"}
