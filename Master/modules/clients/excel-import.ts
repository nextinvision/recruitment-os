/**
 * Maps Excel column headers (case-insensitive) to import row keys.
 * Only name and email are required; all other fields are optional.
 */
const HEADER_MAP: Record<string, string> = {
  name: 'name',
  email: 'email',
  'first name': 'firstName',
  firstname: 'firstName',
  'last name': 'lastName',
  lastname: 'lastName',
  phone: 'phone',
  address: 'address',
  industry: 'industry',
  notes: 'notes',
  'current job title': 'currentJobTitle',
  'job title': 'currentJobTitle',
  jobtitle: 'currentJobTitle',
  'current job': 'currentJobTitle',
  experience: 'experience',
  skills: 'skills',
  'service type': 'serviceType',
  servicetype: 'serviceType',
}

function normalizeHeader(h: string): string {
  const key = String(h ?? '').trim().toLowerCase()
  return HEADER_MAP[key] ?? key
}

export interface ParsedImportRow {
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  industry?: string
  currentJobTitle?: string
  experience?: string
  skills?: string
  notes?: string
  serviceType?: string
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
