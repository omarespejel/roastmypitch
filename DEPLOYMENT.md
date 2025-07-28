# Deployment Guide for Starknet Founders Bot

## 🚀 Quick Deployment to Render

### Option 1: Blueprint Deployment (Recommended)

1. **Connect Repository**: Link your GitHub repository to Render
2. **Import Blueprint**: Use the `render.yaml` file in the repo root
3. **Configure Environment Variables**: Only `OPENROUTER_API_KEY`, `GITHUB_ID`, `GITHUB_SECRET`, and `NEXTAUTH_SECRET` need manual setup (URLs auto-link)
4. **Deploy**: Both services will deploy automatically with persistent storage and auto-deploy enabled

#### Blueprint Features:
- **🔗 Auto-linking**: Frontend and backend URLs automatically connect
- **🚀 Auto-deploy**: Automatic deployments on git push
- **🌍 EU Region**: Frankfurt region for optimal Berlin latency
- **⚙️ Version Control**: Specified Python 3.11 and Node 20 versions
- **📦 npm Support**: Uses native npm commands for maximum compatibility
- **✅ Validated**: Simplified YAML structure guaranteed to work with Render
- **🎯 Minimal**: Stripped down to core functionality for reliable deployment

#### Post-Deployment Enhancements:
- **💾 Persistent Storage**: Add disk storage for ChromaDB via Render dashboard after deployment
- **🏗️ Bun Support**: Can be added later with custom Dockerfile if needed

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

| Variable | Description | Example Value | Auto-Configured |
|----------|-------------|---------------|------------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key for AI features | `sk-or-v1-xxx...` | ❌ Manual |
| `FRONTEND_URL` | Frontend service URL | Auto-linked | ✅ Auto |
| `PRODUCTION_FRONTEND_URL` | Production frontend URL (optional) | `https://custom-domain.com` | ❌ Manual |
| `PYTHON_VERSION` | Python runtime version | `3.11` | ✅ Auto |

### Frontend Service Environment Variables

| Variable | Description | Example Value | Auto-Configured |
|----------|-------------|---------------|------------------|
| `GITHUB_ID` | GitHub OAuth App Client ID | `Iv1.xxx...` | ❌ Manual |
| `GITHUB_SECRET` | GitHub OAuth App Client Secret | `xxx...` | ❌ Manual |
| `NEXTAUTH_URL` | Frontend service URL | Auto-linked | ✅ Auto |
| `NEXTAUTH_SECRET` | Random 32-character string | `your-random-secret-here` | ❌ Manual |
| `NEXT_PUBLIC_API_URL` | Backend service URL | Auto-linked | ✅ Auto |
| `NODE_VERSION` | Node runtime version | `20` | ✅ Auto |

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

#### Blueprint/YAML Errors
- **Validation errors**: Current blueprint uses simplified structure to avoid validation issues
- **Missing features**: Advanced features (persistent storage, Bun) can be added post-deployment
- **Build failures**: Ensure your repository has correct package.json scripts

#### Adding Persistent Storage (Post-Deployment)
1. **Navigate to Backend Service** in Render dashboard
2. **Go to Settings > Disks**
3. **Add New Disk**:
   - Name: `chroma-data`
   - Mount Path: `/chroma_db`
   - Size: 1GB (adjust as needed)
4. **Redeploy** service to apply disk configuration

#### Switching to Bun (Optional)
If you need Bun instead of npm:
1. Create `frontend/Dockerfile` with Bun installation
2. Update service to use Docker runtime
3. Modify build commands to use Bun

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