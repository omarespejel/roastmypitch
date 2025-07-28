# Environment Variables Template for Render Deployment

## Backend Service Environment Variables

**Manual Configuration Required** (URLs auto-link with render.yaml blueprint):

```
OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here
PRODUCTION_FRONTEND_URL=https://custom-domain.com  # Optional: Only if using custom domain
```

**Auto-Configured by Blueprint**:
- `FRONTEND_URL` - Auto-links to frontend service
- `PYTHON_VERSION` - Set to 3.11

**Note**: This simplified blueprint focuses on core functionality. Advanced features like persistent storage for ChromaDB can be added manually via the Render dashboard after deployment.

### Getting OPENROUTER_API_KEY:
1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up and verify your account
3. Navigate to "Keys" section
4. Create a new API key
5. Add credits to your account (minimum $5 recommended)

---

## Frontend Service Environment Variables

**Manual Configuration Required** (URLs auto-link with render.yaml blueprint):

```
GITHUB_ID=Iv1.your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret
NEXTAUTH_SECRET=your-random-32-character-secret-here
```

**Auto-Configured by Blueprint**:
- `NEXTAUTH_URL` - Auto-links to frontend service URL
- `NEXT_PUBLIC_API_URL` - Auto-links to backend service URL
- `NODE_VERSION` - Set to 20

### Getting GitHub OAuth Credentials:
1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Create a new OAuth App with these settings:
   - **Application name**: `Starknet Founders Bot`
   - **Homepage URL**: `https://your-frontend-app.onrender.com`
   - **Authorization callback URL**: `https://your-frontend-app.onrender.com/api/auth/callback/github`
3. Copy the Client ID (GITHUB_ID) and generate a Client Secret (GITHUB_SECRET)

### Generating NEXTAUTH_SECRET:
Run this command locally to generate a random secret:
```bash
openssl rand -base64 32
```

---

## Deployment Order

### Step 1: Deploy Backend First
1. Create Render web service for backend
2. Set the backend environment variables above
3. Deploy and note the backend URL (e.g., `https://starknet-founders-bot-backend.onrender.com`)

### Step 2: Deploy Frontend  
1. Create Render web service for frontend
2. Update `NEXT_PUBLIC_API_URL` with your actual backend URL
3. Set all frontend environment variables
4. Deploy and note the frontend URL (e.g., `https://starknet-founders-bot-frontend.onrender.com`)

### Step 3: Update Cross-References
1. **Backend**: Update `PRODUCTION_FRONTEND_URL` with your actual frontend URL
2. **GitHub OAuth**: Update the OAuth app settings with your actual frontend URL
3. **Frontend**: Verify `NEXTAUTH_URL` matches your frontend URL

---

## Environment Variables Checklist

### Before Deployment:
- [ ] OpenRouter account created with API key and credits
- [ ] GitHub OAuth app created with correct URLs
- [ ] NEXTAUTH_SECRET generated
- [ ] All template variables prepared

### After Backend Deployment:
- [ ] Backend health check working (`GET /`)
- [ ] Backend URL noted for frontend configuration

### After Frontend Deployment:
- [ ] Frontend loads correctly
- [ ] GitHub OAuth login works
- [ ] Backend URLs updated with frontend URL
- [ ] GitHub OAuth app updated with actual URLs

### Final Verification:
- [ ] File upload functionality works
- [ ] AI features respond correctly
- [ ] Rate limiting is working (check 429 errors in logs)
- [ ] No CORS errors in browser console

---

## Quick Copy-Paste Templates

### For Render Backend Service:
```
OPENROUTER_API_KEY=sk-or-v1-[YOUR_KEY]
FRONTEND_URL=http://localhost:3000
PRODUCTION_FRONTEND_URL=[UPDATE_AFTER_FRONTEND_DEPLOY]
```

### For Render Frontend Service:
```
GITHUB_ID=[YOUR_GITHUB_CLIENT_ID]
GITHUB_SECRET=[YOUR_GITHUB_CLIENT_SECRET]
NEXTAUTH_URL=[YOUR_FRONTEND_URL]
NEXTAUTH_SECRET=[YOUR_GENERATED_SECRET]
NEXT_PUBLIC_API_URL=[YOUR_BACKEND_URL]
```

## Troubleshooting Common Issues

- **CORS Errors**: Verify `PRODUCTION_FRONTEND_URL` matches your frontend URL exactly
- **OAuth Errors**: Double-check GitHub OAuth app callback URL
- **AI Not Working**: Verify OpenRouter API key and account credits
- **404 Errors**: Ensure `NEXT_PUBLIC_API_URL` points to correct backend

---

**Pro Tip**: Keep this template handy and fill in the actual values as you deploy each service! 