@echo off
:: Script-এর নিজের ফোল্ডারে যাও (double-click করলেও কাজ করবে)
pushd "%~dp0"

title Van Bazer BD - Local Dev Server
color 0A

echo.
echo  ==========================================
echo   Van Bazer BD - Local Development Server
echo  ==========================================
echo.

:: node_modules না থাকলে install করো
if not exist "node_modules" (
    echo  [*] node_modules নেই, install করা হচ্ছে...
    call npm install
    if errorlevel 1 (
        echo.
        echo  [ERROR] npm install ব্যর্থ হয়েছে!
        pause
        exit /b 1
    )
    echo.
)

:: local.db না থাকলে DB setup করো
if not exist "local.db" (
    echo  [*] Local database তৈরি করা হচ্ছে...
    call npx drizzle-kit push
    echo.
)

echo  ==========================================
echo   [OK] সার্ভার চালু হচ্ছে...
echo   Landing Page : http://localhost:3000
echo   Admin Panel  : http://localhost:3000/admin
echo   বন্ধ করতে   : Ctrl + C
echo  ==========================================
echo.

call npm run dev

echo.
echo  সার্ভার বন্ধ হয়ে গেছে।
pause
