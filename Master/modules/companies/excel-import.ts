/**
 * Maps Excel column headers (case-insensitive) to company import row keys.
 * Only **Company name** (mapped to `name`) is required; all other fields are optional.
 * Template columns: Contact Name, Company Name, Designation, Location, Phone Number,
 * Email ID, Outreach Status, LinkedIn profile link, Comments.
 */
const HEADER_MAP: Record<string, string> = {
    // Company name (required)
    name: 'name',
    company: 'name',
    'company name': 'name',
    industry: 'industry',
    website: 'website',
    url: 'website',
    location: 'location',
    'company size': 'size',
    size: 'size',
    description: 'description',
    desc: 'description',
    'linkedin url': 'linkedinUrl',
    linkedin: 'linkedinUrl',
    linkedinurl: 'linkedinUrl',
    // Contact / outreach template
    'contact name': 'contactName',
    contactname: 'contactName',
    contact: 'contactName',
    designation: 'designation',
    'phone number': 'phoneNumber',
    phone: 'phoneNumber',
    mobile: 'phoneNumber',
    'email id': 'emailId',
    email: 'emailId',
    'outreach status': 'outreachStatus',
    outreach: 'outreachStatus',
    status: 'outreachStatus',
    'linkedin profile link': 'linkedInProfileLink',
    'linkedin profile': 'linkedInProfileLink',
    comments: 'comments',
    comment: 'comments',
    notes: 'comments',
}

function normalizeHeader(h: string): string {
    const key = String(h ?? '').trim().toLowerCase()
    return HEADER_MAP[key] ?? key
}

export interface ParsedImportRow {
    name?: string
    contactName?: string
    designation?: string
    location?: string
    phoneNumber?: string
    emailId?: string
    outreachStatus?: string
    linkedInProfileLink?: string
    comments?: string
    industry?: string
    website?: string
    size?: string
    description?: string
    linkedinUrl?: string
}

/**
 * Build a row object from header array and cell values.
 * Skips empty rows (all cells empty).
 */
function rowToObject(headers: string[], cells: unknown[]): ParsedImportRow | null {
    const obj: Record<string, string> = {}
    let hasAny = false
    for (let i = 0; i < headers.length; i++) {
        const val = cells[i]
        const str = val == null ? '' : String(val).trim()
        if (str) hasAny = true
        if (headers[i]) obj[headers[i]] = str
    }
    if (!hasAny) return null
    return obj as unknown as ParsedImportRow
}

/**
 * Map raw Excel rows (first row = headers) to import row objects.
 * Call from UI after parsing file with xlsx: sheet_to_json(sheet, { header: 1 }).
 */
export function mapExcelRowsToImportRows(excelRows: unknown[][]): ParsedImportRow[] {
    if (excelRows.length < 2) return []
    const headerRow = excelRows[0] as unknown[]
    const headers = headerRow.map((h) => normalizeHeader(String(h ?? '')))
    const result: ParsedImportRow[] = []
    for (let r = 1; r < excelRows.length; r++) {
        const row = rowToObject(headers, excelRows[r] as unknown[])
        if (row) result.push(row)
    }
    return result
}
