import * as XLSX from 'xlsx'
import { dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export interface Question {
  id?: number
  题干: string
  选项A: string
  选项B: string
  选项C: string
  选项D: string
  参考答案: string
  分类?: string
  题型?: string
  注释?: string
  难度?: string
}

export interface ParseResult {
  success: boolean
  data?: Question[]
  error?: string
  filePath?: string
}

/**
 * Validate that essential columns exist in the parsed data
 */
function validateQuestion(row: any): Question | null {
  // Essential fields
  if (!row['题干'] || !row['参考答案']) {
    return null
  }

  // At least options A and B should exist
  if (!row['选项A'] || !row['选项B']) {
    return null
  }

  return {
    题干: String(row['题干']).trim(),
    选项A: String(row['选项A'] || '').trim(),
    选项B: String(row['选项B'] || '').trim(),
    选项C: String(row['选项C'] || '').trim(),
    选项D: String(row['选项D'] || '').trim(),
    参考答案: String(row['参考答案']).trim(),
    分类: row['分类'] ? String(row['分类']).trim() : undefined,
    题型: row['题型'] ? String(row['题型']).trim() : undefined,
    注释: row['注释'] ? String(row['注释']).trim() : undefined,
    难度: row['难度'] ? String(row['难度']).trim() : undefined,
  }
}

/**
 * Open file dialog and let user select an Excel file
 */
export async function selectExcelFile(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
}

/**
 * Read and parse an Excel file
 */
export function parseExcelFile(filePath: string): ParseResult {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: `File not found: ${filePath}`,
      }
    }

    // Read the file as buffer
    const buffer = fs.readFileSync(filePath)
    
    // Parse the buffer with XLSX.read
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
      cellText: false,
    })

    // Get the first sheet
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      return {
        success: false,
        error: 'No sheets found in the Excel file',
      }
    }

    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: '',
    })

    if (!rawData || rawData.length === 0) {
      return {
        success: false,
        error: 'No data found in the Excel file',
      }
    }

    // Validate and transform data
    const questions: Question[] = []
    const errors: string[] = []

    rawData.forEach((row: any, index: number) => {
      const question = validateQuestion(row)
      if (question) {
        questions.push(question)
      } else {
        errors.push(`Row ${index + 2}: Missing essential fields (题干 or 参考答案)`)
      }
    })

    if (questions.length === 0) {
      return {
        success: false,
        error: `No valid questions found. Errors:\n${errors.join('\n')}`,
      }
    }

    return {
      success: true,
      data: questions,
      filePath,
      error: errors.length > 0 ? `Skipped ${errors.length} invalid rows` : undefined,
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse Excel file: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Get a preview of the Excel file (first few rows)
 */
export function previewExcelFile(filePath: string, rowCount: number = 5): ParseResult {
  const result = parseExcelFile(filePath)
  
  if (result.success && result.data) {
    return {
      ...result,
      data: result.data.slice(0, rowCount),
    }
  }
  
  return result
}
