# 🚀 Deployment Checklist

## Quick Start (5-10 minutes)

### Step 1: Generate Production Secrets ✅
```powershell
# Generate secure JWT_SECRET (run in PowerShell)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
**Save this value** - you'll need it in Step 3.

---

### Step 2: Run Pre-Deployment Verification ✅
```bash
# Windows
pre-deploy-check.bat

# Linux/Mac
bash pre-deploy-check.sh
```
**Expected output:** All ✓ checks should pass
- ✓ Backend builds successfully
- ✓ Frontend builds successfully  
- ✓ Dependencies installed
- ✓ .env configured

---

### Step 3: Configure Production Environment ✅
```bash
# Copy template to actual .env
cp .env.production.template .env

# Then edit .env with production values:
```

**Critical variables to update:**
```bash
# Database (production database)
DB_HOST=your-production-db.com
DB_USER=production_user
DB_PASSWORD=your_db_password

# JWT (from Step 1)
JWT_SECRET=<paste-generated-secret-from-step-1>

# PayPal (SWITCH FROM SANDBOX TO LIVE)
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_SECRET=your_live_secret

# Sentry (from https://sentry.io dashboard)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# CORS - Your production domain
ALLOWED_ORIGINS=https://yourdomain.com

# Email (if using Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# (Optional) OpenAI if using meal planning AI
OPENAI_API_KEY=sk-xxxxx

# Node environment
NODE_ENV=production
PORT=3002
```

---

### Step 4: Deploy Backend ✅
```bash
cd activecore-db

# Install production dependencies
npm install --production

# Start the server
npm start
```

**Expected output:**
```
🌐 Server running on port 3002
✅ Database init finished
✅ Sentry initialized (if SENTRY_DSN set)
```

---

### Step 5: Deploy Frontend ✅
```bash
# Frontend is already built in /build folder
# Copy entire build/ folder to your web hosting:
# - Apache/Nginx: /var/www/html or /usr/share/nginx/html
# - cpanel/shared hosting: public_html/
# - Vercel/netlify: Push to main branch (auto-deploys)
```

**Configure your web server** to serve static files and route all non-file requests to `index.html`:

**Nginx example:**
```nginx
location / {
  try_files $uri /index.html;
}
```

**Apache example (in .htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Post-Deployment Health Checks ✅

### 1. API Health Check
```bash
# Test backend is running
curl http://your-domain.com/api/auth/login -X POST

# Should return: 400 (missing credentials) not 404
# Not 500 error
```

### 2. Frontend Loading
```bash
# Open in browser
https://your-domain.com

# Check browser console (F12) - should have NO errors
# All images/assets should load
```

### 3. Security Headers Check
```bash
curl -i http://your-domain.com/api/auth/login

# Should see these headers in response:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Referrer-Policy: strict-origin-when-cross-origin
# Content-Security-Policy: ...
```

### 4. Rate Limiting Check
```bash
# Try 6 login attempts rapidly
for i in {1..6}; do
  curl -X POST http://your-domain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
done

# 6th request should return: 429 (Too Many Requests)
```

### 5. Sentry Error Tracking
1. Go to https://sentry.io
2. Check your project dashboard
3. Trigger a test error - it should appear in dashboard

### 6. PayPal Integration
1. Process a test payment through the app
2. Check PayPal LIVE account (not sandbox)
3. Verify payment appears in your account

### 7. Database Connection
```bash
# Check logs for database connection
# Should see: ✅ Database init finished

# Test query
mysql -h your-db-host -u db_user -p -e "SELECT COUNT(*) FROM users;"
```

---

## Rollback Plan (If Issues Occur)

**If backend won't start:**
```bash
# Check logs
tail -f logs/combined.log

# Verify .env is correct
cat .env | grep JWT_SECRET
cat .env | grep DB_HOST

# Restart
npm start
```

**If frontend won't load:**
```bash
# Clear browser cache
# Ctrl+Shift+Delete (Chrome) / Cmd+Shift+Delete (Mac)
# Then reload

# Check that build/ folder is complete
ls -la build/index.html
ls -la build/static/

# Rebuild if needed
npm run build
```

**If database won't connect:**
```bash
# Test connection directly
mysql -h DB_HOST -u DB_USER -p DB_NAME

# Check:
1. DB_HOST is correct IP/hostname (not localhost!)
2. DB_USER has correct password
3. Database exists
4. Network firewall allows connection
5. MySQL daemon is running
```

---

## File Structure After Deployment

```
Production Server:
├── Backend (node activecore-db)
│   ├── package.json
│   ├── dist/ (TypeScript compiled)
│   ├── .env (PRODUCTION CONFIG - KEEP SECRET!)
│   └── logs/ (Winston log files)
│
├── Frontend (web server root)
│   ├── index.html
│   ├── static/
│   │   ├── css/
│   │   ├── js/
│   │   └── ...
│   └── (all files from build/)
│
└── Database
    └── activecore (MySQL database)
```

---

## Security Reminders ⚠️

1. **NEVER** commit `.env` to git (it's in .gitignore ✓)
2. **NEVER** expose JWT_SECRET or DB passwords
3. **ALWAYS** use HTTPS in production (not HTTP)
4. **ALWAYS** keep PayPal in LIVE mode (not SANDBOX)
5. **ALWAYS** set SENTRY_DSN for error tracking
6. **ALWAYS** rotate JWT_SECRET every 90 days
7. **Firewall:** Only expose port 80/443 (HTTP/HTTPS), block port 3002

---

## Success Criteria ✅

- [ ] Both builds compile with 0 errors
- [ ] Backend starts without errors
- [ ] Frontend loads without 404 errors
- [ ] API responds to requests (not 404)
- [ ] Security headers present in responses
- [ ] Rate limiting works (429 on 6th request)
- [ ] Errors appear in Sentry dashboard
- [ ] Database connected and queryable
- [ ] Payments process through PayPal LIVE

---

## Next Steps

1. **Monitor:** Check logs daily for first week
   ```bash
   tail -f logs/combined.log
   ```

2. **Alerts:** Set up Sentry alerts for errors

3. **Backups:** Automated MySQL backups every 24h

4. **Updates:** Patch Node.js/dependencies monthly

5. **Performance:** Monitor response times (target <200ms)

---

**Questions?** Check `DEPLOYMENT_COMPLETE.md` for detailed explanations.

