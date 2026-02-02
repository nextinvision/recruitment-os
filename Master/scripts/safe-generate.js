/**
 * Safely generate Prisma client by cleaning up first
 * This prevents DLL lock issues on Windows
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🧹 Cleaning Prisma client before generation...')

// Run the clean script first
try {
  require('./clean-prisma.js')
} catch (err) {
  console.log('⚠️  Clean script failed, continuing anyway...')
}

console.log('\n📦 Generating Prisma client...')

try {
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: process.cwd()
  })
  console.log('\n✅ Prisma client generated successfully!')
} catch (err) {
  console.error('\n❌ Failed to generate Prisma client')
  console.error('   Try running: npm run db:clean')
  process.exit(1)
}

