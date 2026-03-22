import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Import service AFTER dotenv.config
import { googleSheetsService } from '../modules/analytics/sheets-service'

async function runTest() {
    console.log('--- Testing Google Sheets Integration ---')
    console.log('Checking GOOGLE_SERVICE_ACCOUNT_KEY...')

    const keyString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (!keyString) {
        console.error('❌ Error: GOOGLE_SERVICE_ACCOUNT_KEY is missing in .env')
        process.exit(1)
    }

    if (keyString.includes('...')) {
        console.warn('⚠️  Warning: GOOGLE_SERVICE_ACCOUNT_KEY appears to be incomplete (contains "...")')
    }

    const testTitle = `Terminal Test Report - ${new Date().toISOString()}`
    const testHeaders = ['Test Column 1', 'Test Column 2', 'Status']
    const testRows = [
        ['Data A1', 'Data B1', 'SUCCESS'],
        ['Data A2', 'Data B2', 'VERIFIED'],
    ]

    console.log(`Attempting to create spreadsheet: "${testTitle}"...`)

    try {
        const url = await googleSheetsService.createAndPopulateSheet(testTitle, testHeaders, testRows)
        console.log('✅ Success! Spreadsheet created.')
        console.log(`URL: ${url}`)
    } catch (error: any) {
        console.error('❌ Failed to create spreadsheet.')
        console.error(`Error Message: ${error.message}`)

        if (error.message.includes('JSON')) {
            console.log('\n💡 Tip: Your GOOGLE_SERVICE_ACCOUNT_KEY in .env is not valid JSON. Please paste the full content of the downloaded JSON key file.')
        } else if (error.message.includes('auth')) {
            console.log('\n💡 Tip: Authentication failed. This is expected if you haven\'t provided a valid Service Account key.')
        }
    }
}

runTest()
