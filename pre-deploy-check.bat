@echo off
REM Production Deployment Checklist & Verification Script (Windows)
REM Run this before deploying to production

cls
echo.
echo =========================================================
echo  ActiveCore Production Deployment Verification
echo =========================================================
echo.

setlocal enabledelayedexpansion

REM 1. Backend Build Check
echo Checking 1. Backend Build...
cd activecore-db
call npm run build > nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Backend builds successfully
    cd ..
) else (
    echo   [FAILED] Backend build failed - Check TypeScript errors
    echo   Run: cd activecore-db ^&^& npm run build
    cd ..
    pause
    exit /b 1
)

REM 2. Frontend Build Check
echo Checking 2. Frontend Build...
call npm run build > nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Frontend builds successfully
) else (
    echo   [FAILED] Frontend build failed - Check TypeScript errors
    echo   Run: npm run build
    pause
    exit /b 1
)

REM 3. Backend Dependencies
echo Checking 3. Backend Dependencies...
if exist "activecore-db\node_modules\" (
    echo   [OK] Backend dependencies installed
) else (
    echo   [WARNING] Missing dependencies
    echo   Run: cd activecore-db ^&^& npm install
)

REM 4. Frontend Dependencies
echo Checking 4. Frontend Dependencies...
if exist "node_modules\" (
    echo   [OK] Frontend dependencies installed
) else (
    echo   [WARNING] Missing dependencies
    echo   Run: npm install
)

REM 5. Environment Variables
echo Checking 5. Environment Configuration...
if exist ".env" (
    echo   [OK] .env file found
) else (
    echo   [WARNING] .env file not found - Copy from .env.production.template
)

echo.
echo =========================================================
echo  Pre-Deployment Checklist
echo =========================================================
echo.
echo Before deploying to production, verify:
echo   [ ] Database backups created
echo   [ ] SSL/TLS certificates installed
echo   [ ] PayPal LIVE credentials configured (not sandbox)
echo   [ ] SENTRY_DSN obtained and in .env
echo   [ ] ALLOWED_ORIGINS configured for CORS
echo   [ ] SMTP credentials verified (if using email)
echo   [ ] JWT_SECRET is 32+ characters long
echo   [ ] NODE_ENV=production in deployment environment

echo.
echo =========================================================
echo  Build Artifacts Ready
echo =========================================================
echo.
echo Frontend: .\build\
echo Backend:  .\activecore-db\dist\
echo.
echo =========================================================
echo  Next Steps
echo =========================================================
echo.
echo 1. Copy .env.production.template to your production server
echo.
echo 2. Update .env with production credentials:
echo    - Database host/user/password
echo    - JWT_SECRET (generate new for production)
echo    - PayPal LIVE credentials
echo    - SENTRY_DSN
echo    - ALLOWED_ORIGINS
echo.
echo 3. Start backend:
echo    cd activecore-db
echo    npm start
echo.
echo 4. Serve frontend (via nginx, Apache, or hosting provider):
echo    Serve the 'build\' folder
echo.
echo 5. Verify in production:
echo    - API responding at https://your-domain/api/auth/login
echo    - Frontend loads without errors
echo    - Login works
echo    - Payment processing works
echo    - Errors logged to Sentry dashboard
echo.
echo =========================================================
echo.
pause
