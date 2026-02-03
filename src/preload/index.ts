import { contextBridge, ipcRenderer } from 'electron'

const API = {
  sayHelloFromBridge: () => console.log('\nHello from bridgeAPI! 👋\n\n'),
  username: 'User', // 暂时硬编码以排除 process.env 的干扰
  
  // Excel file operations
  excel: {
    selectFile: () => ipcRenderer.invoke('excel:select-file'),
    parseFile: (filePath: string) => ipcRenderer.invoke('excel:parse-file', filePath),
    previewFile: (filePath: string, rowCount?: number) => 
      ipcRenderer.invoke('excel:preview-file', filePath, rowCount),
  },
  
  // Database operations
  db: {
    importQuestions: (questions: any[]) => ipcRenderer.invoke('db:import-questions', questions),
    getAllQuestions: () => ipcRenderer.invoke('db:get-all-questions'),
    getQuestionsByCategory: (category: string) => ipcRenderer.invoke('db:get-questions-by-category', category),
    getQuestionsByType: (type: string) => ipcRenderer.invoke('db:get-questions-by-type', type),
    getRandomQuestions: (count: number) => ipcRenderer.invoke('db:get-random-questions', count),
    getMistakeQuestions: () => ipcRenderer.invoke('db:get-mistake-questions'),
    getFavoriteQuestions: () => ipcRenderer.invoke('db:get-favorite-questions'),
    searchQuestions: (keyword: string) => ipcRenderer.invoke('db:search-questions', keyword),
    recordAnswer: (questionId: number, userAnswer: string, isCorrect: boolean) => 
      ipcRenderer.invoke('db:record-answer', questionId, userAnswer, isCorrect),
    toggleFavorite: (questionId: number) => ipcRenderer.invoke('db:toggle-favorite', questionId),
    isFavorite: (questionId: number) => ipcRenderer.invoke('db:is-favorite', questionId),
    saveMistakeNote: (questionId: number, note: string) => 
      ipcRenderer.invoke('db:save-mistake-note', questionId, note),
    getMistakeNote: (questionId: number) => ipcRenderer.invoke('db:get-mistake-note', questionId),
    getCategories: () => ipcRenderer.invoke('db:get-categories'),
    getStatistics: () => ipcRenderer.invoke('db:get-statistics'),
  },

  // Settings operations
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (settings: any) => ipcRenderer.invoke('settings:update', settings),
    getValue: (key: string) => ipcRenderer.invoke('settings:get-value', key),
    setValue: (key: string, value: any) => ipcRenderer.invoke('settings:set-value', key, value),
    getTheme: () => ipcRenderer.invoke('settings:get-theme'),
    setTheme: (theme: string) => ipcRenderer.invoke('settings:set-theme', theme),
    saveSequentialProgress: (index: number) => ipcRenderer.invoke('settings:save-sequential-progress', index),
    getSequentialProgress: () => ipcRenderer.invoke('settings:get-sequential-progress'),
    saveCategoryProgress: (category: string, index: number) => 
      ipcRenderer.invoke('settings:save-category-progress', category, index),
    getCategoryProgress: (category: string) => ipcRenderer.invoke('settings:get-category-progress', category),
    saveAiExplanation: (questionId: string, explanation: string) => 
      ipcRenderer.invoke('settings:save-ai-explanation', questionId, explanation),
    getAiExplanation: (questionId: string) => ipcRenderer.invoke('settings:get-ai-explanation', questionId),
  },

  // AI operations
  ai: {
    getExplanation: (question: string, answer: string, useStream = false) => 
      ipcRenderer.invoke('ai:get-explanation', question, answer, useStream),
    onExplanationChunk: (callback: (chunk: string) => void) => {
      ipcRenderer.on('ai:explanation-chunk', (_event, chunk: string) => {
        callback(chunk)
      })
    },
    removeExplanationChunkListener: () => {
      ipcRenderer.removeAllListeners('ai:explanation-chunk')
    },
  },
}

contextBridge.exposeInMainWorld('App', API)
