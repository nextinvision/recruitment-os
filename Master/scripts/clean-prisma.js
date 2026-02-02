/**
 * Clean Prisma client to fix DLL lock issues on Windows
 * This script kills Node.js processes and removes the Prisma client directory
 * 
 * Note: This is a CommonJS script (not ES modules) for compatibility
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
/* eslint-enable @typescript-eslint/no-require-imports */

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('🔍 Checking for running Node.js processes...')

  try {
    // Check for Node.js processes (cross-platform)
    let nodeProcesses = []
    
    if (process.platform === 'win32') {
      // Windows: Use tasklist
      try {
        const output = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: 'utf-8' })
        const lines = output.split('\n').filter(line => line.includes('node.exe'))
        nodeProcesses = lines.map(line => {
          const match = line.match(/"(\d+)"/)
          return match ? match[1] : null
      }).filter(Boolean)
    } catch {
      // tasklist might not find processes, that's okay
    }
    } else {
      // Unix: Use pgrep
      try {
        const output = execSync('pgrep -f node', { encoding: 'utf-8' })
      nodeProcesses = output.trim().split('\n').filter(Boolean)
    } catch {
      // pgrep returns non-zero if no processes found, that's okay
    }
    }

    if (nodeProcesses.length > 0) {
      console.log(`⚠️  Found ${nodeProcesses.length} Node.js process(es) running`)
      console.log('🛑 Stopping Node.js processes...')
      
      nodeProcesses.forEach((pid) => {
        try {
          if (process.platform === 'win32') {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' })
          } else {
            execSync(`kill -9 ${pid}`, { stdio: 'ignore' })
          }
          console.log(`   Stopped process: ${pid}`)
        } catch {
          // Process might have already terminated, ignore
        }
      })
      
      // Wait a bit for processes to fully terminate
      console.log('   Waiting for processes to terminate...')
      await sleep(2000)
      console.log('✅ Node.js processes stopped')
    } else {
      console.log('✅ No Node.js processes found')
    }
  } catch (err) {
    console.log('⚠️  Could not check for Node.js processes:', err.message)
  }

  console.log('🧹 Cleaning up Prisma client...')

  // Remove Prisma client directory
  const prismaClientPath = path.join(process.cwd(), 'node_modules', '.prisma')

  if (fs.existsSync(prismaClientPath)) {
    try {
      // On Windows, we need to retry deletion as files might still be locked
      let retries = 5
      let deleted = false
      
      while (retries > 0 && !deleted) {
        try {
          fs.rmSync(prismaClientPath, { recursive: true, force: true })
          deleted = true
          console.log('✅ Prisma client directory removed')
        } catch (err) {
          retries--
          if (retries > 0) {
            console.log(`   Retrying... (${retries} attempts left)`)
            await sleep(1000)
          } else {
            console.log('⚠️  Could not remove Prisma client directory')
            console.log('   Error:', err.message)
            console.log('   You may need to:')
            console.log('   1. Close your IDE/editor')
            console.log('   2. Close any terminal windows')
            console.log('   3. Manually delete: node_modules/.prisma')
            process.exit(1)
          }
        }
      }
    } catch (err) {
      console.log('⚠️  Error removing Prisma client directory:', err.message)
      process.exit(1)
    }
  } else {
    console.log('ℹ️  Prisma client directory not found (already clean)')
  }

  console.log('✨ Cleanup complete! You can now run: npm run db:generate')
}

main().catch((err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})

