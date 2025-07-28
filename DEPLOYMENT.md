# Deployment Guide for Starknet Founders Bot

## 🚀 Quick Deployment to Render

### Option 1: Blueprint Deployment (Recommended)

1. **Connect Repository**: Link your GitHub repository to Render
2. **Import Blueprint**: Use the `render.yaml` file in the repo root
3. **Configure Environment Variables**: Set the required variables (see below)
4. **Deploy**: Both services will deploy automatically

### Option 2: Manual Service Creation

#### Backend Service
1. **Create Web Service** on Render dashboard
2. **Connect Repository**: Link to your GitHub repo
3. **Configure Build**:
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn src.main:app --host 0.0.0.0 --port $PORT`
   - **Python Version**: 3.9+ (3.11 recommended)

#### Frontend Service  
1. **Create Web Service** on Render dashboard
2. **Connect Repository**: Link to your GitHub repo
3. **Configure Build**:
   - **Build Command**: `cd frontend && bun install && bun run build`
   - **Start Command**: `cd frontend && bun start`
   - **Node Version**: 18+ (20 recommended)

## 🔧 Environment Variables Configuration

### Backend Service Environment Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key for AI features | `sk-or-v1-xxx...` |
| `FRONTEND_URL` | Development frontend URL | `http://localhost:3000` |
| `PRODUCTION_FRONTEND_URL` | Production frontend URL | `https://your-frontend.onrender.com` |

### Frontend Service Environment Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `GITHUB_ID` | GitHub OAuth App Client ID | `Iv1.xxx...` |
| `GITHUB_SECRET` | GitHub OAuth App Client Secret | `xxx...` |
| `NEXTAUTH_URL` | Your frontend service URL | `https://your-frontend.onrender.com` |
| `NEXTAUTH_SECRET` | Random 32-character string | `your-random-secret-here` |
| `NEXT_PUBLIC_API_URL` | Your backend service URL | `https://your-backend.onrender.com` |

## 📋 Pre-Deployment Checklist

### 1. GitHub OAuth App Setup
Create a GitHub OAuth app at [github.com/settings/applications/new](https://github.com/settings/applications/new):

- **Application name**: `Starknet Founders Bot`
- **Homepage URL**: `https://your-frontend.onrender.com`
- **Authorization callback URL**: `https://your-frontend.onrender.com/api/auth/callback/github`

### 2. Generate Required Secrets

#### NEXTAUTH_SECRET
```bash
# Generate a random 32-character secret
openssl rand -base64 32
```

#### OpenRouter API Key
1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Create an API key
3. Add credits to your account

### 3. Repository Setup
Ensure your repository has:
- ✅ All environment variables in `.env` (for local development)
- ✅ `.env` files excluded in `.gitignore`
- ✅ `requirements.txt` in backend directory
- ✅ Proper `package.json` scripts in frontend

## 🔄 Deployment Process

### Step 1: Deploy Backend First
1. Create backend service on Render
2. Set environment variables (except `PRODUCTION_FRONTEND_URL`)
3. Deploy and note the service URL
4. Test health check at `https://your-backend.onrender.com/`

### Step 2: Deploy Frontend
1. Create frontend service on Render
2. Set `NEXT_PUBLIC_API_URL` to your backend URL
3. Set other environment variables
4. Deploy and note the service URL

### Step 3: Update Cross-Service URLs
1. **Backend**: Set `PRODUCTION_FRONTEND_URL` to your frontend URL
2. **GitHub OAuth**: Update callback URL to your frontend URL
3. **Frontend**: Verify `NEXTAUTH_URL` matches your frontend URL

### Step 4: Verify Deployment
- ✅ Frontend loads correctly
- ✅ GitHub OAuth login works
- ✅ Backend API responds
- ✅ File upload functionality
- ✅ AI features working

## 🐛 Troubleshooting

### Common Issues

#### CORS Errors
- Verify `PRODUCTION_FRONTEND_URL` is set correctly
- Check that frontend and backend URLs are correct

#### OAuth Errors
- Verify GitHub OAuth app callback URL matches `NEXTAUTH_URL`
- Check `GITHUB_ID` and `GITHUB_SECRET` are correct

#### AI Features Not Working
- Verify `OPENROUTER_API_KEY` is set and valid
- Check OpenRouter account has sufficient credits

#### Build Failures
- **Backend**: Check Python version (3.9+) and dependencies
- **Frontend**: Check Node version (18+) and bun installation

### Environment Variables Verification

Create a test endpoint to verify (remove after testing):
```python
# Temporary - add to main.py for testing
@app.get("/debug/env")
def debug_env():
    return {
        "openrouter_configured": bool(os.getenv("OPENROUTER_API_KEY")),
        "frontend_url": os.getenv("FRONTEND_URL", "not_set"),
        "production_frontend": os.getenv("PRODUCTION_FRONTEND_URL", "not_set"),
    }
```

## 📊 Monitoring

### Health Checks
- **Backend**: `GET /` returns `{"status": "Starknet VC Co-pilot API is running"}`
- **Frontend**: Homepage loads correctly

### Rate Limiting Monitoring
- General API: 60 requests/minute
- AI Operations: 10 requests/minute
- Monitor 429 errors in logs

### Performance Monitoring
- Monitor response times for AI operations
- Check ChromaDB performance for large document collections
- Monitor OpenRouter API usage and costs

## 🔄 Updates and Maintenance

### Automatic Deployments
- Enable auto-deploy from `main` branch
- Test changes in development first
- Monitor deployment logs

### Dependency Updates
```bash
# Backend
cd backend && uv sync --upgrade
uv export --format requirements-txt > requirements.txt

# Frontend  
cd frontend && bun update
```

### Security Updates
- Regular dependency updates
- Monitor security advisories
- Review and update rate limits based on usage patterns

---

**Need Help?** Check the logs in Render dashboard or refer to [SECURITY.md](./SECURITY.md) for security configurations. 