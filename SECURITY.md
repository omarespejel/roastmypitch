# Security Documentation for Starknet Founders Bot

## Security Measures Implemented

### 🔒 Backend Security

#### Input Validation & Sanitization
- **File Upload**: PDF validation, size limits (10MB), filename sanitization
- **User Input**: Length limits, type validation, special character filtering
- **Path Traversal Protection**: Sanitized filenames and secure temp directories

#### Rate Limiting
- **General API**: 60 requests per minute per IP address
- **AI Operations**: 10 requests per minute per IP address (for expensive operations)
- **Two-tier system**: Separate limits for regular and AI-powered endpoints
- **Automatic cleanup**: Old request tracking data automatically purged

#### CORS Configuration
- Dynamic origin handling based on environment variables
- Specific allowed methods (GET, POST, PUT, DELETE, OPTIONS)
- Restricted headers (Content-Type, Authorization, Accept)

#### Error Handling
- No internal error details exposed to clients
- Comprehensive logging for debugging
- Graceful error responses

### 🛡️ Data Protection

#### Environment Variables
- All sensitive data stored in environment variables
- No hardcoded secrets in codebase
- Separate configuration for development/production

#### File System Security
- Temporary files automatically cleaned up
- Database files excluded from version control
- Secure file path handling

## Deployment Security Checklist

### Before Deployment

#### 1. Environment Setup
Ensure these environment variables are set on Render:

**Backend Service:**
```bash
OPENROUTER_API_KEY=your_actual_api_key
FRONTEND_URL=http://localhost:3000  # Development
PRODUCTION_FRONTEND_URL=https://your-frontend-app.onrender.com  # Production
```

**Frontend Service:**
```bash
GITHUB_ID=your_github_oauth_app_id
GITHUB_SECRET=your_github_oauth_app_secret
NEXTAUTH_URL=https://your-frontend-app.onrender.com
NEXTAUTH_SECRET=generate_random_32_character_string
NEXT_PUBLIC_API_URL=https://your-backend-app.onrender.com
```

#### 2. GitHub OAuth Configuration
Update your GitHub OAuth app settings:
- **Homepage URL**: `https://your-frontend-app.onrender.com`
- **Authorization callback URL**: `https://your-frontend-app.onrender.com/api/auth/callback/github`

#### 3. Verify .gitignore
Ensure sensitive files are excluded:
```
.env*
backend/chroma_db/
temp_*/
*.log
.DS_Store
```

### Production Deployment Steps

#### 1. Deploy Backend to Render
1. Connect your GitHub repository
2. Set **Build Command**: `cd backend && pip install -r requirements.txt`
3. Set **Start Command**: `cd backend && uvicorn src.main:app --host 0.0.0.0 --port $PORT`
4. Add all required environment variables
5. Enable auto-deploy from main branch

#### 2. Deploy Frontend to Render
1. Connect your GitHub repository
2. Set **Build Command**: `cd frontend && bun install && bun run build`
3. Set **Start Command**: `cd frontend && bun start`
4. Add all required environment variables
5. Enable auto-deploy from main branch

#### 3. Update CORS Origins
After deployment, update your backend environment variables:
```bash
PRODUCTION_FRONTEND_URL=https://your-actual-frontend-url.onrender.com
```

### Security Monitoring

#### Log Monitoring
Monitor these log entries for security issues:
- Rate limiting triggers
- File upload errors
- Authentication failures
- API endpoint errors

#### Regular Security Updates
- Keep dependencies updated using `uv` and `bun`
- Monitor for security advisories
- Review and update rate limits based on usage

### Security Best Practices

#### API Usage
- Always validate input on both frontend and backend
- Use HTTPS in production (automatic on Render)
- Implement proper error handling
- Log security events for monitoring

#### File Handling
- Only accept PDF files for uploads
- Implement file size limits
- Clean up temporary files
- Validate file content, not just extensions

#### Database Security
- ChromaDB files are local (secure by default)
- Regular backups of important data
- Monitor database access patterns

## Incident Response

### If Security Issues Are Detected
1. **Immediate**: Disable affected endpoints if necessary
2. **Investigation**: Check logs for scope of impact
3. **Mitigation**: Apply patches or configuration changes
4. **Monitoring**: Increase log monitoring post-incident
5. **Documentation**: Update security measures based on findings

### Emergency Contacts
- Primary: Monitor application logs on Render dashboard
- Secondary: Check GitHub repository for any unauthorized changes
- Backup: Review API usage patterns for anomalies

---

**Last Updated**: January 2025
**Next Review**: Monitor continuously, formal review quarterly 