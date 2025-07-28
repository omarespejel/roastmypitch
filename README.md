# Starknet Founders Bot v2

An AI-powered co-pilot for Starknet founders to get expert feedback on their pitch decks and product strategies. Features multiple AI agent personalities (VC and Product PM) with advanced analysis capabilities.

## 🚀 Features

### Core Functionality
- **PDF Pitch Deck Upload**: Secure file processing with comprehensive validation
- **Multi-Agent Chat**: Switch between "Shark VC" and "Product PM" personalities
- **Progress Tracking**: Visual indicators for pitch deck completeness
- **GitHub OAuth**: Secure authentication system

### Advanced Intelligence Features
- **Smart Suggestions**: AI-powered gap analysis with contextual help
- **Ecosystem Research**: Real-time Starknet ecosystem updates and case studies
- **Competitor Analysis**: Automated competitor identification and positioning
- **Adaptive Questioning**: Context-aware follow-up questions

## 🏗️ Architecture

```
Frontend (Next.js + TypeScript)     Backend (FastAPI + Python)
├── Smart Suggestions UI            ├── Analysis Engine
├── Ecosystem Updates               ├── Ecosystem Research
├── Competitor Analysis             ├── Competitor Analysis
├── Adaptive Questions              ├── Adaptive Questioning
└── Chat Interface                  └── Vector Store (ChromaDB)
```

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Bun (package manager)
- NextAuth.js (authentication)

**Backend:**
- FastAPI
- LlamaIndex
- ChromaDB (vector store)
- OpenRouter API (multiple LLMs)
- UV (package manager)

## 🔧 Development Setup

### Prerequisites
- Python 3.8+
- Node.js 18+
- Bun
- UV

### Environment Variables
Create a `.env` file in the project root:

```bash
# OpenRouter API key for AI features
OPENROUTER_API_KEY=your_openrouter_key_here

# GitHub OAuth (create app at github.com/settings/applications/new)
GITHUB_ID=your_github_oauth_id
GITHUB_SECRET=your_github_oauth_secret

# NextAuth configuration
NEXTAUTH_SECRET=your_random_32_character_secret
NEXTAUTH_URL=http://localhost:3000

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend Setup
```bash
cd backend
uv sync
uv run uvicorn src.main:app --reload
```

### Frontend Setup
```bash
cd frontend
bun install
bun run dev
```

## 🔒 Security Features

- **Input Validation**: Comprehensive validation on all user inputs
- **File Upload Security**: PDF validation, size limits, filename sanitization
- **Rate Limiting**: 100 requests/minute per IP
- **CORS Protection**: Dynamic origin handling for production
- **Error Handling**: No internal details exposed to clients

See [SECURITY.md](./SECURITY.md) for complete security documentation.

## 🚀 Deployment

### Quick Deploy to Render

#### Option 1: Blueprint Deployment (Recommended)
1. Import the `render.yaml` blueprint from your repository
2. Configure environment variables using [`env-template.md`](./env-template.md)
3. Deploy both services automatically

#### Option 2: Manual Deployment
1. **Backend Service**:
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn src.main:app --host 0.0.0.0 --port $PORT`

2. **Frontend Service**:
   - Build Command: `cd frontend && bun install && bun run build`
   - Start Command: `cd frontend && bun start`

3. **Environment Variables**: Use [`env-template.md`](./env-template.md) for setup

### Deployment Documentation
- 📋 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- 🔧 **[env-template.md](./env-template.md)** - Environment variables template
- 🔒 **[SECURITY.md](./SECURITY.md)** - Security configurations
- ⚙️ **[render.yaml](./render.yaml)** - Render blueprint configuration

## 📡 API Endpoints

### Core Endpoints
- `POST /upload/{founder_id}` - Upload pitch deck PDF
- `POST /chat` - Chat with AI agents
- `POST /reset/{founder_id}` - Reset chat session

### Advanced Features
- `POST /analyze/{founder_id}` - Smart pitch analysis
- `GET /ecosystem-updates/{space}` - Starknet ecosystem research
- `GET /case-studies` - Success story case studies
- `POST /competitor-analysis` - Automated competitor analysis
- `POST /adaptive-questions` - Context-aware questions

## 🧪 Development

### Testing Backend
```bash
cd backend
uv run python -c "from src.analysis_engine import PitchDeckAnalyzer; print('✅ Backend working')"
```

### Testing Frontend
```bash
cd frontend
bun run build
```

### Code Quality
- TypeScript strict mode enabled
- Comprehensive error handling
- Security-first development practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow security best practices
4. Test both frontend and backend
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for the Starknet ecosystem
