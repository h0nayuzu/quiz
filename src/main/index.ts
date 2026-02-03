import { app, ipcMain } from 'electron'

app.disableHardwareAcceleration()

import { makeAppWithSingleInstanceLock } from '../lib/electron-app/factories/app/instance'
import { makeAppSetup } from '../lib/electron-app/factories/app/setup'
import { loadReactDevtools } from '../lib/electron-app/utils'
import { ENVIRONMENT } from '../shared/constants'
import { MainWindow } from './windows/main'
import { waitFor } from '../shared/utils'
import { webServerService } from './services/webServer'
import { selectExcelFile, parseExcelFile, previewExcelFile } from './services/excelService'
import {
  initializeDatabase,
  importQuestions,
  getAllQuestions,
  getQuestionsByCategory,
  getQuestionsByType,
  getRandomQuestions,
  getMistakeQuestions,
  getFavoriteQuestions,
  searchQuestions,
  recordAnswer,
  toggleFavorite,
  isFavorite,
  saveMistakeNote,
  getMistakeNote,
  getCategories,
  getStatistics,
  closeDatabase,
} from './services/databaseService'
import {
  initializeSettings,
  getSettings,
  updateSettings,
  getSetting,
  setSetting,
} from './services/settingsService'
import { getAiExplanation } from './services/aiService'

// Register IPC handlers
function registerIpcHandlers() {
  // Excel file operations
  ipcMain.handle('excel:select-file', async () => {
    try {
      const filePath = await selectExcelFile()
      return { success: true, filePath }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

  ipcMain.handle('excel:parse-file', async (_event, filePath: string) => {
    try {
      return parseExcelFile(filePath)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

  ipcMain.handle('excel:preview-file', async (_event, filePath: string, rowCount?: number) => {
    try {
      return previewExcelFile(filePath, rowCount)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

  // Database operations
  ipcMain.handle('db:import-questions', async (_event, questions) => {
    return importQuestions(questions)
  })

  ipcMain.handle('db:get-all-questions', async () => {
    return getAllQuestions()
  })

  ipcMain.handle('db:get-questions-by-category', async (_event, category: string) => {
    return getQuestionsByCategory(category)
  })

  ipcMain.handle('db:get-questions-by-type', async (_event, type: string) => {
    return getQuestionsByType(type)
  })

  ipcMain.handle('db:get-random-questions', async (_event, count: number) => {
    return getRandomQuestions(count)
  })

  ipcMain.handle('db:get-mistake-questions', async () => {
    return getMistakeQuestions()
  })

  ipcMain.handle('db:get-favorite-questions', async () => {
    return getFavoriteQuestions()
  })

  ipcMain.handle('db:search-questions', async (_event, keyword: string) => {
    return searchQuestions(keyword)
  })

  ipcMain.handle('db:record-answer', async (_event, questionId: number, userAnswer: string, isCorrect: boolean) => {
    return recordAnswer(questionId, userAnswer, isCorrect)
  })

  ipcMain.handle('db:toggle-favorite', async (_event, questionId: number) => {
    return toggleFavorite(questionId)
  })

  ipcMain.handle('db:is-favorite', async (_event, questionId: number) => {
    return isFavorite(questionId)
  })

  ipcMain.handle('db:save-mistake-note', async (_event, questionId: number, note: string) => {
    return saveMistakeNote(questionId, note)
  })

  ipcMain.handle('db:get-mistake-note', async (_event, questionId: number) => {
    return getMistakeNote(questionId)
  })

  ipcMain.handle('db:get-categories', async () => {
    return getCategories()
  })

  ipcMain.handle('db:get-statistics', async () => {
    return getStatistics()
  })

  // Settings operations
  ipcMain.handle('settings:get', async () => {
    return getSettings()
  })

  ipcMain.handle('settings:update', async (_event, settings) => {
    return updateSettings(settings)
  })

  ipcMain.handle('settings:get-value', async (_event, key) => {
    return getSetting(key)
  })

  ipcMain.handle('settings:set-value', async (_event, key, value) => {
    setSetting(key, value)
    return { success: true }
  })

  ipcMain.handle('settings:get-theme', async () => {
    return getSetting('theme') || 'light'
  })

  ipcMain.handle('settings:set-theme', async (_event, theme) => {
    setSetting('theme', theme)
    return { success: true }
  })

  // Progress tracking
  ipcMain.handle('settings:save-sequential-progress', async (_event, index: number) => {
    setSetting('sequentialProgress', { lastQuestionIndex: index })
    return { success: true }
  })

  ipcMain.handle('settings:get-sequential-progress', async () => {
    return getSetting('sequentialProgress')
  })

  ipcMain.handle('settings:save-category-progress', async (_event, category: string, index: number) => {
    const categoryProgress = getSetting('categoryProgress') || {}
    categoryProgress[category] = index
    setSetting('categoryProgress', categoryProgress)
    return { success: true }
  })

  ipcMain.handle('settings:get-category-progress', async (_event, category: string) => {
    const categoryProgress = getSetting('categoryProgress') || {}
    return categoryProgress[category] || 0
  })

  // AI explanation caching
  ipcMain.handle('settings:save-ai-explanation', async (_event, questionId: string, explanation: string) => {
    const aiExplanations = getSetting('aiExplanations') || {}
    aiExplanations[questionId] = explanation
    setSetting('aiExplanations', aiExplanations)
    return { success: true }
  })

  ipcMain.handle('settings:get-ai-explanation', async (_event, questionId: string) => {
    const aiExplanations = getSetting('aiExplanations') || {}
    return aiExplanations[questionId] || null
  })

  // AI operations - stream support
  ipcMain.handle('ai:get-explanation', async (event, question, answer, useStream = false) => {
    if (useStream) {
      // For streaming, we'll send chunks via event
      return getAiExplanation(question, answer, (chunk) => {
        event.sender.send('ai:explanation-chunk', chunk)
      })
    } else {
      return getAiExplanation(question, answer)
    }
  })
}

makeAppWithSingleInstanceLock(async () => {
  await app.whenReady()
  
  // Initialize database and settings
  await initializeDatabase()
  initializeSettings()
  
  // Register IPC handlers
  registerIpcHandlers()
  
  // Start web server for mobile/web access
  try {
    const port = await webServerService.start()
    console.log(`Web server started on port ${port}`)
    console.log(`Access from mobile devices at: http://<your-local-ip>:${port}`)
  } catch (error) {
    console.error('Failed to start web server:', error)
  }
  
  const window = await makeAppSetup(MainWindow)

  if (ENVIRONMENT.IS_DEV) {
    // await loadReactDevtools()
    /* This trick is necessary to get the new
      React Developer Tools working at app initial load.
      Otherwise, it only works on manual reload.
    */
    window.webContents.once('devtools-opened', async () => {
      await waitFor(1000)
      window.webContents.reload()
    })
  }
})

// Clean up on app quit
app.on('before-quit', () => {
  webServerService.stop()
  closeDatabase()
})
