import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'

import type { registerRoute } from 'lib/electron-router-dom'

export type BrowserWindowOrNull = Electron.BrowserWindow | null

type Route = Parameters<typeof registerRoute>[0]

export interface WindowProps extends Electron.BrowserWindowConstructorOptions {
  id: Route['id']
  query?: Route['query']
}

export interface WindowCreationByIPC {
  channel: string
  window(): BrowserWindowOrNull
  callback(window: BrowserWindow, event: IpcMainInvokeEvent): void
}

// 题目类型
export interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  category?: string
  difficulty?: string
  tags?: string[]
}

// 主题类型
export type Theme = 'light' | 'dark' | 'eye-care'

// 设置类型
export interface AppSettings {
  theme: Theme
  showAnswerDirectly: boolean // 顺序/分类练习是否直接显示答案
  apiKey?: string
  apiEndpoint?: string
  model?: string
}

// 考试结果类型
export interface ExamResult {
  id?: number
  total_questions: number
  correct_answers: number
  score: number
  duration?: number
  created_at?: string
}

// Settings type for web server
export interface Settings {
  lastFilePath: string
  theme: Theme
  showAnswerDirectly: boolean
  aiConfig: {
    baseUrl: string
    apiKey: string
    model: string
  }
  sequentialProgress: {
    lastQuestionIndex: number
  }
  categoryProgress: {
    [category: string]: number
  }
  aiExplanations: {
    [questionId: string]: string
  }
}
