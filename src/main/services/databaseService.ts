import initSqlJs, { Database } from 'sql.js'
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import type { Question } from './excelService'

let db: Database | null = null
let SQL: any = null

const DB_PATH = path.join(app.getPath('userData'), 'quiz-app.db')

/**
 * Initialize the database
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Initialize sql.js
    SQL = await initSqlJs({
      locateFile: (file: string) => {
        if (app.isPackaged) {
          return path.join(process.resourcesPath, 'app.asar.unpacked/node_modules/sql.js/dist', file)
        }
        return path.join(__dirname, '../../sql.js/dist', file)
      },
    })

    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH)
      db = new SQL.Database(buffer)
    } else {
      db = new SQL.Database()
      createTables()
      saveDatabase()
    }

    console.log('Database initialized at:', DB_PATH)
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

/**
 * Create database tables
 */
function createTables(): void {
  if (!db) throw new Error('Database not initialized')

  // Questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      题干 TEXT NOT NULL,
      选项A TEXT NOT NULL,
      选项B TEXT NOT NULL,
      选项C TEXT,
      选项D TEXT,
      参考答案 TEXT NOT NULL,
      分类 TEXT,
      题型 TEXT,
      注释 TEXT,
      难度 TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // User progress table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      user_answer TEXT,
      is_correct INTEGER DEFAULT 0,
      attempt_count INTEGER DEFAULT 0,
      last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `)

  // Mistake notes table
  db.run(`
    CREATE TABLE IF NOT EXISTS mistake_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `)

  // Favorites table
  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `)

  // Mock exam results table
  db.run(`
    CREATE TABLE IF NOT EXISTS mock_exam_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      score REAL NOT NULL,
      duration INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Mock exam answers table
  db.run(`
    CREATE TABLE IF NOT EXISTS mock_exam_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      user_answer TEXT,
      is_correct INTEGER DEFAULT 0,
      FOREIGN KEY (exam_id) REFERENCES mock_exam_results(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `)

  console.log('Database tables created')
}

/**
 * Save database to file
 */
function saveDatabase(): void {
  if (!db) throw new Error('Database not initialized')

  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

/**
 * Import questions from Excel into database
 */
export function importQuestions(questions: Question[]): { success: boolean; count: number; error?: string } {
  if (!db) {
    return { success: false, count: 0, error: 'Database not initialized' }
  }

  try {
    // Clear existing questions
    db.run('DELETE FROM questions')

    // Insert new questions
    const stmt = db.prepare(`
      INSERT INTO questions (题干, 选项A, 选项B, 选项C, 选项D, 参考答案, 分类, 题型, 注释, 难度)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const q of questions) {
      stmt.run([
        q.题干,
        q.选项A,
        q.选项B,
        q.选项C || '',
        q.选项D || '',
        q.参考答案,
        q.分类 || null,
        q.题型 || null,
        q.注释 || null,
        q.难度 || null,
      ])
    }

    stmt.free()
    saveDatabase()

    return { success: true, count: questions.length }
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Get all questions
 */
export function getAllQuestions(): Question[] {
  if (!db) return []

  const stmt = db.prepare('SELECT * FROM questions')
  const results: Question[] = []

  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push(row as unknown as Question)
  }

  stmt.free()
  return results
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(category: string): Question[] {
  if (!db) return []

  const stmt = db.prepare('SELECT * FROM questions WHERE 分类 = ?')
  stmt.bind([category])

  const results: Question[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push(row as Question)
  }

  stmt.free()
  return results
}

/**
 * Get questions by type
 */
export function getQuestionsByType(type: string): Question[] {
  if (!db) return []

  const stmt = db.prepare('SELECT * FROM questions WHERE 题型 = ?')
  stmt.bind([type])

  const results: Question[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push(row as Question)
  }

  stmt.free()
  return results
}

/**
 * Get random questions
 */
export function getRandomQuestions(count: number): Question[] {
  if (!db) return []

  const stmt = db.prepare('SELECT * FROM questions ORDER BY RANDOM() LIMIT ?')
  stmt.bind([count])

  const results: Question[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push(row as Question)
  }

  stmt.free()
  return results
}

/**
 * Get mistake questions (questions answered incorrectly)
 */
export function getMistakeQuestions(): Question[] {
  if (!db) return []

  const stmt = db.prepare(`
    SELECT DISTINCT q.* FROM questions q
    INNER JOIN user_progress up ON q.id = up.question_id
    WHERE up.is_correct = 0
    ORDER BY up.last_attempt DESC
  `)

  const results: Question[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push(row as Question)
  }

  stmt.free()
  return results
}

/**
 * Get favorite questions
 */
export function getFavoriteQuestions(): Question[] {
  if (!db) return []

  const stmt = db.prepare(`
    SELECT q.* FROM questions q
    INNER JOIN favorites f ON q.id = f.question_id
    ORDER BY f.created_at DESC
  `)

  const results: Question[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push(row as Question)
  }

  stmt.free()
  return results
}

/**
 * Search questions by keyword
 */
export function searchQuestions(keyword: string): Question[] {
  if (!db) return []

  const pattern = `%${keyword}%`
  const stmt = db.prepare(`
    SELECT * FROM questions 
    WHERE 题干 LIKE ? OR 注释 LIKE ?
  `)
  stmt.bind([pattern, pattern])

  const results: Question[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push(row as Question)
  }

  stmt.free()
  return results
}

/**
 * Record user answer
 */
export function recordAnswer(
  questionId: number,
  userAnswer: string,
  isCorrect: boolean
): { success: boolean; error?: string } {
  if (!db) {
    return { success: false, error: 'Database not initialized' }
  }

  try {
    // Check if progress record exists
    const checkStmt = db.prepare('SELECT id, attempt_count FROM user_progress WHERE question_id = ?')
    checkStmt.bind([questionId])

    if (checkStmt.step()) {
      // Update existing record
      const row = checkStmt.getAsObject()
      const attemptCount = (row.attempt_count as number) + 1

      db.run(
        `UPDATE user_progress 
         SET user_answer = ?, is_correct = ?, attempt_count = ?, last_attempt = CURRENT_TIMESTAMP
         WHERE question_id = ?`,
        [userAnswer, isCorrect ? 1 : 0, attemptCount, questionId]
      )
    } else {
      // Insert new record
      db.run(
        `INSERT INTO user_progress (question_id, user_answer, is_correct, attempt_count)
         VALUES (?, ?, ?, 1)`,
        [questionId, userAnswer, isCorrect ? 1 : 0]
      )
    }

    checkStmt.free()
    saveDatabase()

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(questionId: number): { success: boolean; isFavorite: boolean; error?: string } {
  if (!db) {
    return { success: false, isFavorite: false, error: 'Database not initialized' }
  }

  try {
    const checkStmt = db.prepare('SELECT id FROM favorites WHERE question_id = ?')
    checkStmt.bind([questionId])

    const exists = checkStmt.step()
    checkStmt.free()

    if (exists) {
      // Remove from favorites
      db.run('DELETE FROM favorites WHERE question_id = ?', [questionId])
      saveDatabase()
      return { success: true, isFavorite: false }
    } else {
      // Add to favorites
      db.run('INSERT INTO favorites (question_id) VALUES (?)', [questionId])
      saveDatabase()
      return { success: true, isFavorite: true }
    }
  } catch (error) {
    return {
      success: false,
      isFavorite: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Check if question is favorite
 */
export function isFavorite(questionId: number): boolean {
  if (!db) return false

  const stmt = db.prepare('SELECT id FROM favorites WHERE question_id = ?')
  stmt.bind([questionId])

  const exists = stmt.step()
  stmt.free()

  return exists
}

/**
 * Save mistake note
 */
export function saveMistakeNote(questionId: number, note: string): { success: boolean; error?: string } {
  if (!db) {
    return { success: false, error: 'Database not initialized' }
  }

  try {
    const checkStmt = db.prepare('SELECT id FROM mistake_notes WHERE question_id = ?')
    checkStmt.bind([questionId])

    if (checkStmt.step()) {
      // Update existing note
      db.run(
        'UPDATE mistake_notes SET note = ?, updated_at = CURRENT_TIMESTAMP WHERE question_id = ?',
        [note, questionId]
      )
    } else {
      // Insert new note
      db.run('INSERT INTO mistake_notes (question_id, note) VALUES (?, ?)', [questionId, note])
    }

    checkStmt.free()
    saveDatabase()

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Get mistake note
 */
export function getMistakeNote(questionId: number): string | null {
  if (!db) return null

  const stmt = db.prepare('SELECT note FROM mistake_notes WHERE question_id = ?')
  stmt.bind([questionId])

  if (stmt.step()) {
    const row = stmt.getAsObject()
    stmt.free()
    return row.note as string
  }

  stmt.free()
  return null
}

/**
 * Get all categories
 */
export function getCategories(): { category: string; count: number }[] {
  if (!db) return []

  const stmt = db.prepare(`
    SELECT 分类 as category, COUNT(*) as count 
    FROM questions 
    WHERE 分类 IS NOT NULL AND 分类 != ""
    GROUP BY 分类
    ORDER BY 分类
  `)
  const results: { category: string; count: number }[] = []

  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push({ 
      category: row.category as string,
      count: row.count as number
    })
  }

  stmt.free()
  return results
}

/**
 * Get database statistics
 */
export function getStatistics(): {
  totalQuestions: number
  attemptedQuestions: number
  correctAnswers: number
  mistakeCount: number
  favoriteCount: number
} {
  if (!db) {
    return {
      totalQuestions: 0,
      attemptedQuestions: 0,
      correctAnswers: 0,
      mistakeCount: 0,
      favoriteCount: 0,
    }
  }

  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM questions')
  totalStmt.step()
  const totalQuestions = (totalStmt.getAsObject().count as number) || 0
  totalStmt.free()

  const attemptedStmt = db.prepare('SELECT COUNT(DISTINCT question_id) as count FROM user_progress')
  attemptedStmt.step()
  const attemptedQuestions = (attemptedStmt.getAsObject().count as number) || 0
  attemptedStmt.free()

  const correctStmt = db.prepare('SELECT COUNT(*) as count FROM user_progress WHERE is_correct = 1')
  correctStmt.step()
  const correctAnswers = (correctStmt.getAsObject().count as number) || 0
  correctStmt.free()

  const mistakeStmt = db.prepare('SELECT COUNT(DISTINCT question_id) as count FROM user_progress WHERE is_correct = 0')
  mistakeStmt.step()
  const mistakeCount = (mistakeStmt.getAsObject().count as number) || 0
  mistakeStmt.free()

  const favoriteStmt = db.prepare('SELECT COUNT(*) as count FROM favorites')
  favoriteStmt.step()
  const favoriteCount = (favoriteStmt.getAsObject().count as number) || 0
  favoriteStmt.free()

  return {
    totalQuestions,
    attemptedQuestions,
    correctAnswers,
    mistakeCount,
    favoriteCount,
  }
}

/**
 * Close database
 */
export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}
