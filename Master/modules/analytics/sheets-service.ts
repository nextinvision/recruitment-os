import { google } from 'googleapis'

/**
 * Service for interacting with Google Sheets API
 */
export class GoogleSheetsService {
    private auth: any

    constructor() {
        this.initialize()
    }

    private initialize() {
        if (this.auth) return

        let keyString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
        if (!keyString) {
            return
        }

        try {
            // Root-level fix: Clean up the key string (handle wrapping quotes from .env)
            keyString = keyString.trim()
            if ((keyString.startsWith("'") && keyString.endsWith("'")) ||
                (keyString.startsWith('"') && keyString.endsWith('"'))) {
                keyString = keyString.substring(1, keyString.length - 1).trim()
            }

            // Check for common truncation error (copy-paste with "...")
            if (keyString.includes('...')) {
                console.warn('GOOGLE_SERVICE_ACCOUNT_KEY appears to be truncated (contains "...").')
                return
            }

            let key: any

            // Try parsing as JSON first
            if (keyString.startsWith('{')) {
                key = JSON.parse(keyString)
            }
            // Support Base64 encoding as a robust alternative
            else {
                try {
                    const decoded = Buffer.from(keyString, 'base64').toString('utf8')
                    if (decoded.startsWith('{')) {
                        key = JSON.parse(decoded)
                    }
                } catch (e) {
                    // Not base64 or invalid JSON inside base64
                }
            }

            if (key && key.client_email && key.private_key) {
                this.auth = new google.auth.JWT({
                    email: key.client_email,
                    key: key.private_key,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file']
                })
                console.log('✅ Google Sheets Service initialized successfully.')
            } else {
                console.warn('GOOGLE_SERVICE_ACCOUNT_KEY is not a valid Google Service Account JSON.')
            }
        } catch (error: any) {
            console.error('Failed to initialize Google Sheets Service:', error.message)
        }
    }

    /**
     * Create a new spreadsheet and populate it with data
     * @param title Title of the spreadsheet
     * @param headers Array of column headers
     * @param rows Array of data rows
     * @returns URL of the created spreadsheet
     */
    async createAndPopulateSheet(title: string, headers: string[], rows: any[][]): Promise<string> {
        this.initialize() // Lazy initialization
        if (!this.auth) {
            throw new Error('Google Sheets Service not initialized. Check your GOOGLE_SERVICE_ACCOUNT_KEY.')
        }

        const sheets = google.sheets({ version: 'v4', auth: this.auth })
        const drive = google.drive({ version: 'v3', auth: this.auth })

        try {
            // 1. Create the spreadsheet
            const spreadsheet = await sheets.spreadsheets.create({
                requestBody: {
                    properties: {
                        title: title,
                    },
                },
            })

            const spreadsheetId = spreadsheet.data.spreadsheetId
            if (!spreadsheetId) {
                throw new Error('Failed to create spreadsheet: No ID returned')
            }

            // 2. Prepare the data (headers + rows)
            const values = [headers, ...rows]

            // 3. Write data to the sheet
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Sheet1!A1',
                valueInputOption: 'RAW',
                requestBody: {
                    values,
                },
            })

            // 4. Set permissions to make it accessible (optional but helpful if user didn't share folder)
            // By default, only the service account can see it. 
            // We could share it with the GOOGLE_SERVICE_ACCOUNT_EMAIL or a specific user email if provided.
            // For now, we return the link. The user needs to make sure the Service Account can create files in the right place.

            return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
        } catch (error) {
            console.error('Error in Google Sheets operation:', error)
            throw error
        }
    }
}

export const googleSheetsService = new GoogleSheetsService()
