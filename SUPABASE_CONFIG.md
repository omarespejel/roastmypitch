# Supabase Dashboard Configuration

## Important: Complete these configurations in your Supabase dashboard to fix PKCE authentication issues.

### 1. Authentication → URL Configuration

**Site URL:**
```
https://starknet-founders-bot-frontend-zc93.onrender.com
```

**Redirect URLs:**
```
https://starknet-founders-bot-frontend-zc93.onrender.com/auth/callback
https://starknet-founders-bot-frontend-zc93.onrender.com/*
```

### 2. OAuth Provider Configuration

**GitHub OAuth:**
- Provider: GitHub
- Client ID: `[Your GitHub OAuth App Client ID]`
- Client Secret: `[Your GitHub OAuth App Client Secret]`
- Redirect URL: `https://[your-supabase-project].supabase.co/auth/v1/callback`

**Important:** The GitHub OAuth redirect URL should point to **Supabase**, not your application. Supabase handles the OAuth flow and then redirects to your application's callback URL.

### 3. GitHub OAuth App Configuration

In your GitHub OAuth App settings:
- **Homepage URL:** `https://starknet-founders-bot-frontend-zc93.onrender.com`
- **Authorization callback URL:** `https://[your-supabase-project].supabase.co/auth/v1/callback`

### 4. Environment Variables for Render

Set these in your Render dashboard:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# API Configuration  
NEXT_PUBLIC_API_URL=https://starknet-founders-bot-backend-zc93.onrender.com
```

### 5. Testing Checklist

After configuration:

✅ **Magic Link Test:**
1. Go to your deployed app
2. Enter email address
3. Check email for magic link
4. Click link → should redirect to app authenticated

✅ **GitHub OAuth Test:**
1. Click "Sign in with GitHub"
2. Authorize on GitHub
3. Should redirect through Supabase
4. Should land back in app authenticated

✅ **Browser Network Tab:**
- Look for PKCE flow parameters: `code_challenge`, `code_verifier`
- Auth callback should return 200 status
- No "invalid request" errors in console

### 6. Troubleshooting

**Common Issues:**

1. **"Invalid request: both auth code and code verifier should be non-empty"**
   - Check redirect URLs are exactly matching
   - Verify PKCE flow configuration in code

2. **"Invalid redirect URL"**
   - Ensure all URLs are added to Supabase allowed list
   - Check for trailing slashes or protocol mismatches

3. **"OAuth provider error"**
   - Verify GitHub OAuth app callback URL points to Supabase
   - Check GitHub app is set to public, not private

### 7. PKCE Flow Diagram

```
User clicks OAuth → GitHub → Supabase → Your App
                                ↓
                         /auth/callback
                                ↓
                         Exchange code + verifier
                                ↓
                         Redirect to main app
```

This configuration ensures proper PKCE (Proof Key for Code Exchange) flow for secure authentication in production environments.