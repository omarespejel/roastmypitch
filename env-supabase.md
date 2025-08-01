# Supabase Environment Variables

Update your `.env.local` file with these Supabase variables:

```bash
# Remove NextAuth variables (no longer needed):
# GITHUB_ID=...
# GITHUB_SECRET=...
# NEXTAUTH_SECRET=...
# NEXTAUTH_URL=...

# Add Supabase variables:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Keep existing API URL:
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Supabase Dashboard Configuration

### 1. Authentication Settings
In your Supabase dashboard → Authentication → Settings:

- ✅ **Enable Email authentication**
- ✅ **Configure redirect URLs**: 
  - `http://localhost:3000/auth/callback` (development)
  - `https://your-domain.com/auth/callback` (production)

### 2. OAuth Providers
In Authentication → Providers:

#### Google OAuth:
- ✅ Enable Google provider
- Add your Google Client ID and Secret
- Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

#### GitHub OAuth:
- ✅ Enable GitHub provider  
- Add your GitHub Client ID and Secret
- Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 3. Email Templates (Optional)
Customize the Magic Link email template in Authentication → Email Templates

## Features Enabled

✅ **Magic Link Authentication** (primary method)
✅ **Google OAuth** (fallback option)
✅ **GitHub OAuth** (fallback option)  
✅ **Automatic session management**
✅ **Email verification**
✅ **User metadata support**