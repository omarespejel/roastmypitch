import os
import shutil
import time
import logging
import asyncio
from collections import defaultdict
from typing import Dict, Optional, Any, List
from logging.handlers import RotatingFileHandler

import chromadb
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import socketio
from llama_index.core import Settings, SimpleDirectoryReader, VectorStoreIndex
# --- 1. IMPORT THE SPECIFIC CHAT ENGINE CLASS ---
from llama_index.core.chat_engine import ContextChatEngine, SimpleChatEngine
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.core.storage.storage_context import StorageContext
from llama_index.core.vector_stores import ExactMatchFilter, MetadataFilters
from llama_index.llms.openai_like import OpenAILike
from llama_index.vector_stores.chroma import ChromaVectorStore
from pydantic import BaseModel

from .adaptive_questioning import AdaptiveQuestionEngine
from .analysis_engine import PitchDeckAnalyzer
from .prompts import AgentType, get_prompt

# --- Load Environment and Configure Settings ---
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Create a rotating file handler
file_handler = RotatingFileHandler(
    'backend.log', maxBytes=10485760, backupCount=5
)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(
    logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
)

# Get logger
logger = logging.getLogger(__name__)
logger.addHandler(file_handler)

Settings.llm = OpenAILike(
    api_base="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    model="anthropic/claude-3.5-sonnet",
    is_chat_model=True,
    context_window=200000,
)
Settings.embed_model = "local:BAAI/bge-small-en-v1.5"


def get_llm_for_agent(agent_type: AgentType):
    """Get the appropriate LLM based on agent type"""
    
    # Add validation
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.error("❌ OPENROUTER_API_KEY not found!")
        raise ValueError("OpenRouter API key not configured")
    
    try:
        if agent_type == AgentType.SHARK_VC:
            llm = OpenAILike(
                api_base="https://openrouter.ai/api/v1",
                api_key=api_key,
                model="perplexity/sonar-pro",
                is_chat_model=True,
                context_window=200000,
                max_tokens=400,
                temperature=0.7,  # Add temperature
                request_timeout=30.0,  # Add timeout
            )
        else:
            llm = OpenAILike(
                api_base="https://openrouter.ai/api/v1", 
                api_key=api_key,
                model="anthropic/claude-3.5-sonnet",
                is_chat_model=True,
                context_window=200000,
                max_tokens=400,
                temperature=0.7,  # Add temperature  
                request_timeout=30.0,  # Add timeout
            )
        
        logger.info(f"✅ LLM configured: {llm.model}")
        return llm
        
    except Exception as e:
        logger.error(f"❌ LLM configuration failed: {e}")
        raise


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
question_engine = AdaptiveQuestionEngine()

# --- Rate Limiting ---
request_counts = defaultdict(list)
expensive_request_counts = defaultdict(list)

# General API rate limits
RATE_LIMIT_REQUESTS = 60  # requests per minute for general endpoints
RATE_LIMIT_WINDOW = 60  # seconds

# Expensive operations rate limits (AI-powered features)
EXPENSIVE_RATE_LIMIT = 30  # requests per minute for AI operations (increased for better UX)
EXPENSIVE_RATE_WINDOW = 60  # seconds


def check_rate_limit(client_ip: str, is_expensive: bool = False):
    """Rate limiting based on client IP and operation type"""
    now = time.time()

    if is_expensive:
        # Clean old expensive requests
        expensive_request_counts[client_ip] = [
            req_time
            for req_time in expensive_request_counts[client_ip]
            if now - req_time < EXPENSIVE_RATE_WINDOW
        ]

        # Check expensive operation rate limit
        if len(expensive_request_counts[client_ip]) >= EXPENSIVE_RATE_LIMIT:
            wait_time = EXPENSIVE_RATE_WINDOW - (now - min(expensive_request_counts[client_ip]))
            logger.warning(f"Rate limit exceeded for {client_ip}: {len(expensive_request_counts[client_ip])}/{EXPENSIVE_RATE_LIMIT} requests")
            raise HTTPException(
                status_code=429,
                detail=f"Too many AI requests. Please wait {int(wait_time)} seconds before trying again. Current: {len(expensive_request_counts[client_ip])}/{EXPENSIVE_RATE_LIMIT} requests per minute.",
                headers={"Retry-After": str(int(wait_time))}
            )

        # Add current expensive request
        expensive_request_counts[client_ip].append(now)

    # Always check general rate limit
    request_counts[client_ip] = [
        req_time
        for req_time in request_counts[client_ip]
        if now - req_time < RATE_LIMIT_WINDOW
    ]

    if len(request_counts[client_ip]) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Please try again later. Limit: {RATE_LIMIT_REQUESTS} requests per minute.",
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

# Build allowed origins list with proper protocol handling
allowed_origins = []

# Handle FRONTEND_URL (from Render service or local dev)
if FRONTEND_URL:
    # Ensure production URLs have https:// prefix for Render services
    if FRONTEND_URL.endswith(".onrender.com") and not FRONTEND_URL.startswith("http"):
        FRONTEND_URL = f"https://{FRONTEND_URL}"
    # Handle case where Render gives us just the hostname
    elif "starknet-founders-bot-frontend" in FRONTEND_URL and not FRONTEND_URL.startswith("http"):
        FRONTEND_URL = f"https://{FRONTEND_URL}"
    allowed_origins.append(FRONTEND_URL)

# Handle additional production frontend URL
if PRODUCTION_FRONTEND:
    allowed_origins.append(PRODUCTION_FRONTEND)

# Always allow localhost for development
development_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",  # In case of port conflicts
]
for dev_origin in development_origins:
    if dev_origin not in allowed_origins:
        allowed_origins.append(dev_origin)

# Add the specific Render frontend URL as fallback
render_frontend = "https://starknet-founders-bot-frontend-zc93.onrender.com"
if render_frontend not in allowed_origins:
    allowed_origins.append(render_frontend)

# Log allowed origins for debugging
logger.info(f"CORS allowed origins: {allowed_origins}")
logger.info(f"Raw FRONTEND_URL env var: {os.getenv('FRONTEND_URL')}")
logger.info(f"Raw PRODUCTION_FRONTEND_URL env var: {os.getenv('PRODUCTION_FRONTEND_URL')}")

# IMPORTANT: Add CORS middleware BEFORE SocketManager to ensure OPTIONS requests work
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Add startup event to verify configuration
@app.on_event("startup")
async def verify_config():
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.error("❌ CRITICAL: OPENROUTER_API_KEY not found!")
        raise RuntimeError("OpenRouter API key not configured")
    else:
        logger.info(f"✅ OpenRouter API key configured (length: {len(api_key)})")
        # Test the API key
        try:
            import requests
            response = requests.get(
                "https://openrouter.ai/api/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=10
            )
            if response.status_code == 200:
                logger.info("✅ OpenRouter API key is valid")
            else:
                logger.error(f"❌ OpenRouter API key test failed: {response.status_code}")
        except Exception as e:
            logger.error(f"❌ OpenRouter API key test error: {e}")

# Create Socket.IO server with explicit CORS configuration
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=[
        "https://starknet-founders-bot-frontend-zc93.onrender.com",
        "http://localhost:3000",
        "https://localhost:3000",  # In case of local HTTPS
        "http://127.0.0.1:3000"
    ]
)

# Wrap FastAPI app with Socket.IO
socket_app = socketio.ASGIApp(sio, app)

# Add exception handler with CORS for error responses
@app.exception_handler(400)
async def bad_request_handler(request: Request, exc):
    response = JSONResponse(
        status_code=400,
        content={"detail": "Bad Request"}
    )
    
    # Add CORS headers to error responses
    origin = request.headers.get('origin')
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

# Add explicit OPTIONS handler for preflight requests
@app.options("/{path:path}")
async def options_handler(request: Request, path: str):
    """Handle preflight OPTIONS requests"""
    origin = request.headers.get('origin')
    
    headers = {
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400"
    }
    
    if origin in allowed_origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    return JSONResponse(content={}, headers=headers)

@sio.event
async def connect(sid, environ):
    origin = environ.get('HTTP_ORIGIN', 'Unknown')
    logger.info(f"Client {sid} connected from origin: {origin}")

@sio.event
async def disconnect(sid):
    logger.info(f"Client {sid} disconnected")

@sio.event
async def connect_error(sid, data):
    logger.error(f"Socket.IO connection error for {sid}: {data}")

@sio.event
async def user_typing(sid, data):
    founder_id = data.get('founderId')
    await sio.emit('user_typing', 
                   {'userId': data.get('userId')}, 
                   room=founder_id)


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
    analysis: Optional[Dict[str, Any]] = None  # Contains analysis results for both agents


class AdaptiveQuestionsRequest(BaseModel):
    missing_sections: List[str]
    agent_type: str = "Shark VC"
    founder_context: str = ""
    document_content: str = ""


# --- API Endpoints ---
@app.post("/upload/{founder_id}", response_model=UploadResponse)
async def upload_document(
    founder_id: str, file: UploadFile = File(...), request: Request = None
):
    # Rate limiting (expensive operation - file processing + AI analysis)
    if request:
        client_ip = request.client.host
        check_rate_limit(client_ip, is_expensive=True)

    # Enhanced security validation
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400, detail="Invalid file type. Only PDFs are accepted."
        )

    # File size check (10MB limit)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413, detail="File too large. Maximum size is 10MB."
        )

    # Validate founder_id format (alphanumeric, email, or "anonymous")
    if not founder_id or len(founder_id) > 100:
        raise HTTPException(status_code=400, detail="Invalid founder ID.")

    # Sanitize filename to prevent path traversal attacks
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    safe_filename = "".join(
        c for c in file.filename if c.isalnum() or c in (" ", ".", "_", "-")
    ).rstrip()
    if not safe_filename or not safe_filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid filename.")

    temp_dir = f"./temp_{founder_id.replace('@', '_').replace('.', '_')}/"
    os.makedirs(temp_dir, exist_ok=True)

    try:
        file_path = os.path.join(temp_dir, safe_filename)

        # Write file with size limit check during writing
        with open(file_path, "wb") as buffer:
            content = await file.read()
            if len(content) > 10 * 1024 * 1024:
                raise HTTPException(
                    status_code=413, detail="File too large. Maximum size is 10MB."
                )
            buffer.write(content)

        reader = SimpleDirectoryReader(
            input_files=[file_path],
            file_metadata=lambda filename: {"founder_id": founder_id},
        )
        documents = reader.load_data()
        index.insert_nodes(documents)

        # 🔄 Reset chat engines for this user to transition from SimpleChatEngine to ContextChatEngine
        keys_to_reset = [key for key in chat_engines.keys() if key.startswith(f"{founder_id}_")]
        for key in keys_to_reset:
            logger.info(f"🔄 Resetting chat engine {key} due to first document upload")
            del chat_engines[key]

        # 🔥 Automatically analyze the newly uploaded document for both agent types!
        analysis = None
        try:
            document_text = " ".join(doc.text for doc in documents)
            
            # Run analysis for both agent types
            analysis_pm = analyzer.analyze_document_gaps(
                document_text, AgentType("Product Manager")
            )
            analysis_vc = analyzer.analyze_document_gaps(
                document_text, AgentType("Shark VC")
            )
            
            analysis = {
                "Product Manager": analysis_pm.dict() if hasattr(analysis_pm, 'dict') else analysis_pm,
                "Shark VC": analysis_vc.dict() if hasattr(analysis_vc, 'dict') else analysis_vc,
            }
            
            # Notify connected clients via Socket.IO
            await sio.emit("analysis_ready", {
                "founder_id": founder_id,
                "analysis": analysis,
                "filename": safe_filename
            })
            
            logger.info(f"Auto-analysis completed for {founder_id}")
            
        except Exception as analysis_error:
            logger.error(f"Auto-analysis on upload failed for {founder_id}: {analysis_error}", exc_info=True)
            analysis = None

        return {
            "message": f"Document indexed and analyzed successfully for founder {founder_id}",
            "filename": safe_filename,
            "analysis": analysis,
        }

    except Exception as e:
        # Log error for debugging but don't expose internal details
        logger.error(f"Upload error for {founder_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process document.")

    finally:
        # Ensure temp directory is always cleaned up
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)


@app.post("/chat", response_model=ChatResponse)
async def handle_chat(request: ChatRequest, req: Request = None):
    # Rate limiting for chat operations
    if req:
        client_ip = req.client.host
        check_rate_limit(client_ip, is_expensive=True)

    founder_id = request.founder_id
    agent_type = AgentType(request.agent_type)
    
    # Add input validation logging
    logger.info(f"📨 Chat request received - Founder: {founder_id}, Agent: {agent_type}")
    logger.info(f"📝 Message: '{request.message[:100]}...'")
    
    if not request.message or not request.message.strip():
        logger.warning(f"❌ Empty message received from {founder_id}")
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    session_key = f"{founder_id}_{agent_type.value}"
    
    try:
        if session_key not in chat_engines:
            logger.info(f"🔧 Creating new chat engine for session: {session_key}")
            
            # Check if user has any uploaded documents
            retriever = index.as_retriever(
                vector_store_query_mode="default",
                filters=MetadataFilters(
                    filters=[ExactMatchFilter(key="founder_id", value=founder_id)]
                ),
            )
            
            # Test if documents exist for this user
            test_results = retriever.retrieve("test query")
            has_documents = len(test_results) > 0
            
            memory = ChatMemoryBuffer.from_defaults(token_limit=1500)
            llm = get_llm_for_agent(agent_type)
            prompt = get_prompt(agent_type)
            
            logger.info(f"🤖 Using LLM model: {llm.model if hasattr(llm, 'model') else 'Unknown'}")
            logger.info(f"📝 System prompt length: {len(prompt)} characters")
            logger.info(f"📁 User has documents: {has_documents}")

            if has_documents:
                # User has uploaded documents - use context chat engine
                logger.info(f"📚 Creating ContextChatEngine with document retrieval")
                chat_engines[session_key] = ContextChatEngine.from_defaults(
                    retriever=retriever,
                    memory=memory,
                    system_prompt=prompt,
                    llm=llm,
                )
            else:
                # New user without documents - use simple chat engine
                logger.info(f"💬 Creating SimpleChatEngine for conversation without documents")
                enhanced_prompt = f"""{prompt}

IMPORTANT: The user has not uploaded any documents yet. You should:
1. Introduce yourself and your role as a {agent_type.value}
2. Explain how you can help them with their startup
3. Offer to review their pitch deck if they upload one
4. Provide general startup advice based on your expertise
5. Ask relevant questions to understand their business

Be conversational, helpful, and engaging even without documents to analyze."""

                chat_engines[session_key] = SimpleChatEngine.from_defaults(
                    memory=memory,
                    system_prompt=enhanced_prompt,
                    llm=llm,
                )
            
            logger.info(f"✅ Chat engine created successfully for {session_key}")

        chat_engine = chat_engines[session_key]
        
        # Log before AI call
        logger.info(f"🧠 Sending message to AI engine...")
        
        # The critical call - add timeout and error handling
        response = await asyncio.wait_for(
            chat_engine.achat(request.message), 
            timeout=30.0
        )
        
        # Log the AI response
        response_text = str(response) if response else ""
        logger.info(f"🎯 AI Response received - Length: {len(response_text)} chars")
        logger.info(f"🎯 Raw response object type: {type(response)}")
        logger.info(f"🎯 Raw response object: {repr(response)}")
        
        if len(response_text) > 0:
            logger.info(f"🎯 AI Response preview: '{response_text[:200]}...'")
        
        if not response_text or not response_text.strip():
            logger.error(f"❌ AI returned empty response for message: '{request.message}'")
            logger.error(f"❌ Response was: {repr(response)}")
            # Return a fallback response instead of empty
            return {"reply": "I apologize, but I didn't generate a response. Could you please rephrase your question?"}
        
        return {"reply": response_text}
        
    except asyncio.TimeoutError:
        logger.error(f"⏰ Timeout waiting for AI response from {founder_id}")
        raise HTTPException(status_code=504, detail="AI response timed out")
    except Exception as e:
        logger.error(f"💥 Chat error for {founder_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@app.post("/reset/{founder_id}")
async def reset_chat(founder_id: str, agent_type: Optional[str] = None):
    if agent_type:
        session_key = f"{founder_id}_{agent_type}"
        if session_key in chat_engines:
            del chat_engines[session_key]
            return {"message": f"Chat session for {agent_type} has been reset."}
    else:
        # Reset all sessions for this founder
        keys_to_delete = [
            key for key in chat_engines.keys() if key.startswith(f"{founder_id}_")
        ]
        for key in keys_to_delete:
            del chat_engines[key]
        return {
            "message": f"All chat sessions for founder {founder_id} have been reset."
        }

    return {"message": f"No active session found."}


# --- Analysis and Research Endpoints ---
@app.post("/analyze/{founder_id}")
async def analyze_pitch_deck(
    founder_id: str, agent_type: str = "Shark VC", request: Request = None
):
    # Rate limiting for AI analysis operations
    if request:
        client_ip = request.client.host
        check_rate_limit(client_ip, is_expensive=True)

    # Input validation
    if not founder_id or len(founder_id) > 100:
        raise HTTPException(status_code=400, detail="Invalid founder ID")

    # Validate agent_type
    valid_agents = ["Shark VC", "Product Manager"]
    if agent_type not in valid_agents:
        raise HTTPException(status_code=400, detail="Invalid agent type")

    try:
        # Get founder's documents from vector store
        retriever = index.as_retriever(
            filters=MetadataFilters(
                filters=[ExactMatchFilter(key="founder_id", value=founder_id)]
            )
        )

        # Retrieve relevant document content
        docs = retriever.retrieve("pitch deck analysis")
        content = " ".join([doc.text for doc in docs])

        if not content or len(content.strip()) < 50:
            return JSONResponse(
                status_code=404,
                content={
                    "detail": "No documents uploaded yet. Upload a document for detailed analysis, or continue chatting for general advice!",
                    "code": "NO_DOCUMENTS",
                    "founder_id": founder_id
                }
            )

        analysis = analyzer.analyze_document_gaps(content, AgentType(agent_type))
        return analysis

    except Exception as e:
        logger.error(f"Analysis error for {founder_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to analyze documents")











@app.post("/adaptive-questions")
async def get_adaptive_questions(request: AdaptiveQuestionsRequest, req: Request = None):
    # Rate limiting for AI question generation
    if req:
        client_ip = req.client.host
        check_rate_limit(client_ip, is_expensive=True)

    # Validate list length
    if len(request.missing_sections) > 20:
        raise HTTPException(status_code=400, detail="Too many missing sections")

    # Validate agent_type
    valid_agents = ["Shark VC", "Product Manager"]
    if request.agent_type not in valid_agents:
        raise HTTPException(status_code=400, detail="Invalid agent type")

    # Validate string lengths
    if len(request.founder_context) > 500:
        raise HTTPException(status_code=400, detail="Founder context too long")

    if len(request.document_content) > 5000:
        raise HTTPException(status_code=400, detail="Document content too long")

    try:
        questions = question_engine.generate_adaptive_questions(
            request.missing_sections, request.agent_type
        )

        # Contextualize questions
        for question in questions:
            question["question"] = question_engine.contextualize_question(
                question["question"], request.founder_context, request.document_content
            )

        return {"questions": questions}
    except Exception as e:
        logger.error(f"Adaptive questions error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate questions")


# --- Health Check ---
@app.get("/")
def read_root():
    return {"status": "Starknet VC Co-pilot API is running"}

@app.get("/debug/env")
def debug_env():
    """Debug endpoint to check environment configuration"""
    api_key = os.getenv("OPENROUTER_API_KEY")
    return {
        "has_openrouter_key": bool(api_key),
        "key_length": len(api_key) if api_key else 0,
        "key_prefix": api_key[:8] + "..." if api_key and len(api_key) > 8 else None,
        "frontend_url": os.getenv("FRONTEND_URL"),
        "production_frontend": os.getenv("PRODUCTION_FRONTEND_URL"),
        "environment_vars": {
            "OPENROUTER_API_KEY": "SET" if api_key else "MISSING",
            "FRONTEND_URL": "SET" if os.getenv("FRONTEND_URL") else "MISSING",
        }
    }

@app.get("/debug/test-ai")
async def test_ai_connection():
    """Test endpoint to verify AI connectivity"""
    try:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            return {"error": "OPENROUTER_API_KEY not configured"}
        
        # Test basic LLM functionality
        llm = get_llm_for_agent(AgentType.PRODUCT_PM)
        response = await llm.acomplete("Say 'AI connection test successful'")
        
        return {
            "success": True,
            "response": str(response),
            "model": getattr(llm, 'model', 'Unknown')
        }
    except Exception as e:
        logger.error(f"AI test failed: {e}", exc_info=True)
        return {"error": str(e), "success": False}


# Export the Socket.IO wrapped app for both REST and WebSocket support
# This preserves all FastAPI middleware (including CORS) and adds Socket.IO functionality
if __name__ != "__main__":
    # For production (uvicorn/gunicorn), export the Socket.IO wrapped FastAPI app
    app = socket_app

# For local development (CLI run)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:socket_app", host="0.0.0.0", port=8000)
