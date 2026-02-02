# PowerShell script to fix Prisma DLL lock issues on Windows
# This script kills Node.js processes and cleans up Prisma client

Write-Host "🔍 Checking for running Node.js processes..." -ForegroundColor Yellow

# Find all Node.js processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "⚠️  Found $($nodeProcesses.Count) Node.js process(es) running" -ForegroundColor Yellow
    Write-Host "🛑 Stopping Node.js processes..." -ForegroundColor Yellow
    
    foreach ($process in $nodeProcesses) {
        Write-Host "   Stopping process: $($process.Id) - $($process.ProcessName)" -ForegroundColor Gray
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    
    # Wait a bit for processes to fully terminate
    Start-Sleep -Seconds 2
    Write-Host "✅ Node.js processes stopped" -ForegroundColor Green
} else {
    Write-Host "✅ No Node.js processes found" -ForegroundColor Green
}

Write-Host "🧹 Cleaning up Prisma client..." -ForegroundColor Yellow

# Remove Prisma client directory
$prismaClientPath = Join-Path $PSScriptRoot "..\node_modules\.prisma"
if (Test-Path $prismaClientPath) {
    try {
        Remove-Item -Path $prismaClientPath -Recurse -Force -ErrorAction Stop
        Write-Host "✅ Prisma client directory removed" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not remove Prisma client directory: $_" -ForegroundColor Yellow
        Write-Host "   You may need to close your IDE/editor and try again" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  Prisma client directory not found (already clean)" -ForegroundColor Gray
}

Write-Host "✨ Cleanup complete! You can now run: npm run db:generate" -ForegroundColor Green

