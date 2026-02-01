@echo off
echo Building Chrome Extension...

REM Clean dist directory
if exist dist rmdir /s /q dist

REM Build popup (React)
echo Building popup...
call npm run build:popup

REM Build background scripts
echo Building background scripts...
call npm run build:background

REM Build content scripts
echo Building content scripts...
call npm run build:content

echo Build complete! Files are in dist/ directory

