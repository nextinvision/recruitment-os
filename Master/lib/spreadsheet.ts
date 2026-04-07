type XlsxModule = {
  read: (data: ArrayBuffer, options: { type: 'array' }) => {
    SheetNames?: string[]
    Sheets?: Record<string, unknown>
  }
  utils: {
    sheet_to_json: (
      sheet: unknown,
      options: { header: 1; defval: string; blankrows: boolean }
    ) => unknown
  }
}

function toXlsxModule(mod: unknown): XlsxModule {
  const candidate = mod as { default?: unknown }
  const resolved = (candidate?.default ?? mod) as Partial<XlsxModule>
  if (
    !resolved ||
    typeof resolved.read !== 'function' ||
    !resolved.utils ||
    typeof resolved.utils.sheet_to_json !== 'function'
  ) {
    throw new Error('Spreadsheet parser failed to load. Please refresh and try again.')
  }
  return resolved as XlsxModule
}

export async function readSpreadsheetRows(file: File): Promise<unknown[][]> {
  const xlsxImport = await import('xlsx')
  const XLSX = toXlsxModule(xlsxImport)

  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const firstSheetName = workbook.SheetNames?.[0]
  const sheet = firstSheetName ? workbook.Sheets?.[firstSheetName] : undefined

  if (!sheet) {
    throw new Error('No readable sheet found in file')
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  })

  if (!Array.isArray(rows)) {
    throw new Error('Invalid spreadsheet data format')
  }

  return rows as unknown[][]
}
