"use strict";
const electron = require("electron");
const API = {
  sayHelloFromBridge: () => console.log("\nHello from bridgeAPI! 👋\n\n"),
  username: "User",
  // 暂时硬编码以排除 process.env 的干扰
  // Excel file operations
  excel: {
    selectFile: () => electron.ipcRenderer.invoke("excel:select-file"),
    parseFile: (filePath) => electron.ipcRenderer.invoke("excel:parse-file", filePath),
    previewFile: (filePath, rowCount) => electron.ipcRenderer.invoke("excel:preview-file", filePath, rowCount)
  },
  // Database operations
  db: {
    importQuestions: (questions) => electron.ipcRenderer.invoke("db:import-questions", questions),
    getAllQuestions: () => electron.ipcRenderer.invoke("db:get-all-questions"),
    getQuestionsByCategory: (category) => electron.ipcRenderer.invoke("db:get-questions-by-category", category),
    getQuestionsByType: (type) => electron.ipcRenderer.invoke("db:get-questions-by-type", type),
    getRandomQuestions: (count) => electron.ipcRenderer.invoke("db:get-random-questions", count),
    getMistakeQuestions: () => electron.ipcRenderer.invoke("db:get-mistake-questions"),
    getFavoriteQuestions: () => electron.ipcRenderer.invoke("db:get-favorite-questions"),
    searchQuestions: (keyword) => electron.ipcRenderer.invoke("db:search-questions", keyword),
    recordAnswer: (questionId, userAnswer, isCorrect) => electron.ipcRenderer.invoke("db:record-answer", questionId, userAnswer, isCorrect),
    toggleFavorite: (questionId) => electron.ipcRenderer.invoke("db:toggle-favorite", questionId),
    isFavorite: (questionId) => electron.ipcRenderer.invoke("db:is-favorite", questionId),
    saveMistakeNote: (questionId, note) => electron.ipcRenderer.invoke("db:save-mistake-note", questionId, note),
    getMistakeNote: (questionId) => electron.ipcRenderer.invoke("db:get-mistake-note", questionId),
    getCategories: () => electron.ipcRenderer.invoke("db:get-categories"),
    getStatistics: () => electron.ipcRenderer.invoke("db:get-statistics")
  },
  // Settings operations
  settings: {
    get: () => electron.ipcRenderer.invoke("settings:get"),
    update: (settings) => electron.ipcRenderer.invoke("settings:update", settings),
    getValue: (key) => electron.ipcRenderer.invoke("settings:get-value", key),
    setValue: (key, value) => electron.ipcRenderer.invoke("settings:set-value", key, value),
    getTheme: () => electron.ipcRenderer.invoke("settings:get-theme"),
    setTheme: (theme) => electron.ipcRenderer.invoke("settings:set-theme", theme),
    saveSequentialProgress: (index) => electron.ipcRenderer.invoke("settings:save-sequential-progress", index),
    getSequentialProgress: () => electron.ipcRenderer.invoke("settings:get-sequential-progress"),
    saveCategoryProgress: (category, index) => electron.ipcRenderer.invoke("settings:save-category-progress", category, index),
    getCategoryProgress: (category) => electron.ipcRenderer.invoke("settings:get-category-progress", category),
    saveAiExplanation: (questionId, explanation) => electron.ipcRenderer.invoke("settings:save-ai-explanation", questionId, explanation),
    getAiExplanation: (questionId) => electron.ipcRenderer.invoke("settings:get-ai-explanation", questionId)
  },
  // AI operations
  ai: {
    getExplanation: (question, answer, useStream = false) => electron.ipcRenderer.invoke("ai:get-explanation", question, answer, useStream),
    onExplanationChunk: (callback) => {
      electron.ipcRenderer.on("ai:explanation-chunk", (_event, chunk) => {
        callback(chunk);
      });
    },
    removeExplanationChunkListener: () => {
      electron.ipcRenderer.removeAllListeners("ai:explanation-chunk");
    }
  }
};
electron.contextBridge.exposeInMainWorld("App", API);
