@echo off
REM Production Build Script for Recruitment OS Extension (Windows)
REM Usage: build-production.bat https://api.yourdomain.com

setlocal

set API_URL=%1

if "%API_URL%"=="" (
    echo Usage: build-production.bat ^<API_URL^>
    echo Example: build-production.bat https://api.yourdomain.com
    exit /b 1
)

echo Building extension for production with API URL: %API_URL%

REM Create backup and update constants.ts
copy src\shared\constants.ts src\shared\constants.ts.bak >nul
powershell -Command "(Get-Content src\shared\constants.ts) -replace 'const buildTimeUrl = ''[^'']*''', 'const buildTimeUrl = ''%API_URL%''' | Set-Content src\shared\constants.ts"
powershell -Command "(Get-Content src\shared\constants.ts) -replace 'return ''http://localhost:3000''', 'return ''%API_URL%''' | Set-Content src\shared\constants.ts"

REM Build the extension
call npm run build

REM Restore original file
move /Y src\shared\constants.ts.bak src\shared\constants.ts >nul

echo Build complete! Extension is ready in dist\ directory
echo Package it by zipping the dist folder, manifest.json, and icons folder

endlocal

