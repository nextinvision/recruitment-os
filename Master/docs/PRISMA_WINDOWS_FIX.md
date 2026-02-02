# Prisma Windows DLL Lock Fix

## Problem

On Windows, when running `npm run db:migrate` or `npm run db:generate`, you may encounter this error:

```
EPERM: operation not permitted, rename 'C:\...\node_modules\.prisma\client\query_engine-windows.dll.node.tmp...' -> 'C:\...\node_modules\.prisma\client\query_engine-windows.dll.node'
```

## Root Cause

This happens when:
1. **Node.js processes are still running** (dev server, worker, etc.) and have the Prisma client loaded
2. The Prisma query engine DLL file is locked by a running process
3. Windows cannot rename/replace the locked DLL file

## Solution

We've created automated scripts to fix this issue:

### Quick Fix

```bash
# Clean up and regenerate Prisma client
npm run db:clean
npm run db:generate
```

Or use the safe migration command:

```bash
# Clean, then migrate (includes generate)
npm run db:migrate:safe
```

### Manual Fix

If the automated script doesn't work:

1. **Stop all Node.js processes:**
   ```powershell
   # Find Node.js processes
   tasklist | findstr node.exe
   
   # Kill all Node.js processes
   taskkill /F /IM node.exe
   ```

2. **Close your IDE/editor** (VS Code, WebStorm, etc.) - they may have the DLL locked

3. **Delete Prisma client manually:**
   ```powershell
   Remove-Item -Recurse -Force node_modules\.prisma
   ```

4. **Regenerate Prisma client:**
   ```bash
   npm run db:generate
   ```

## Automated Scripts

### `npm run db:clean`
- Kills all running Node.js processes
- Removes the `.prisma` directory
- Cross-platform (Windows/Unix)

### `npm run db:generate:safe`
- Runs cleanup first
- Then generates Prisma client
- Prevents DLL lock issues

### `npm run db:migrate:safe`
- Runs cleanup first
- Then runs migrations
- Includes Prisma client generation

## Prevention

To avoid this issue in the future:

1. **Stop dev servers before migrations:**
   ```bash
   # Stop Next.js dev server (Ctrl+C)
   # Stop worker process (Ctrl+C)
   # Then run migrations
   npm run db:migrate
   ```

2. **Use the safe commands:**
   ```bash
   # Instead of: npm run db:migrate
   npm run db:migrate:safe
   
   # Instead of: npm run db:generate
   npm run db:generate:safe
   ```

3. **Close IDE/editor** if you're still getting lock errors

## Script Details

### `scripts/clean-prisma.js`
- Cross-platform Node.js script
- Automatically detects and kills Node.js processes
- Retries deletion with backoff
- Provides helpful error messages

### `scripts/fix-prisma-lock.ps1`
- PowerShell script for Windows
- Can be run directly: `.\scripts\fix-prisma-lock.ps1`

### `scripts/fix-prisma-lock.sh`
- Bash script for Unix systems
- Can be run directly: `bash scripts/fix-prisma-lock.sh`

## Troubleshooting

### Script can't kill processes
- Run PowerShell/terminal as Administrator
- Manually kill processes using Task Manager

### Still getting lock errors
1. Close all terminals
2. Close your IDE/editor
3. Restart your computer (last resort)
4. Manually delete `node_modules/.prisma`

### Process keeps restarting
- Check if you have auto-restart scripts running
- Check if your IDE has auto-reload enabled
- Check for background services

## Related Issues

- Prisma GitHub: https://github.com/prisma/prisma/issues/5529
- Windows file locking: Common issue with DLL files on Windows

