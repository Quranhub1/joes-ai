@echo off
REM Quick setup script for Joe's AI with authentication

echo.
echo ========================================
echo   Joe's AI - Quick Setup
echo ========================================
echo.

REM Check if .env.local exists
if exist ".env.local" (
    echo ✓ .env.local already exists
) else (
    echo Creating .env.local from .env.example...
    copy .env.example .env.local
    echo ✓ Created .env.local - please fill in your credentials
    echo.
)

REM Check if node_modules exists
if exist "node_modules" (
    echo ✓ node_modules already exists
) else (
    echo Installing dependencies...
    call npm install
    echo ✓ Dependencies installed
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env.local with your credentials:
echo    - GOOGLE_CLIENT_ID
echo    - GOOGLE_CLIENT_SECRET
echo    - NEXTAUTH_SECRET (run: openssl rand -base64 32)
echo.
echo 2. See GOOGLE_OAUTH_SETUP.md for OAuth setup
echo.
echo 3. Run: npm run dev
echo.
echo 4. Visit: http://localhost:3000
echo.
