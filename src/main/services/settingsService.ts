import Store from 'electron-store'
import type { Theme } from '@/shared/types'

interface Settings {
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

const schema = {
  lastFilePath: {
    type: 'string',
    default: '',
  },
  theme: {
    type: 'string',
    enum: ['light', 'dark', 'eye-care'],
    default: 'light',
  },
  showAnswerDirectly: {
    type: 'boolean',
    default: false,
  },
  aiConfig: {
    type: 'object',
    properties: {
      baseUrl: { type: 'string', default: 'http://127.0.0.1:8045/v1' },
      apiKey: { type: 'string', default: 'sk-b4d2fda36ce5455f80071026fed7469a' },
      model: { type: 'string', default: 'gemini-3-flash' },
    },
    default: {
      baseUrl: 'http://127.0.0.1:8045/v1',
      apiKey: 'sk-b4d2fda36ce5455f80071026fed7469a',
      model: 'gemini-3-flash',
    },
  },
  sequentialProgress: {
    type: 'object',
    properties: {
      lastQuestionIndex: { type: 'number', default: 0 },
    },
    default: {
      lastQuestionIndex: 0,
    },
  },
  categoryProgress: {
    type: 'object',
    default: {},
  },
  aiExplanations: {
    type: 'object',
    default: {},
  },
} as const

let store: Store<Settings> | null = null

export function initializeSettings() {
  store = new Store<Settings>({ schema })
}

export function getSettings(): Settings {
  if (!store) initializeSettings()
  return store!.store
}

export function updateSettings(settings: Partial<Settings>): Settings {
  if (!store) initializeSettings()
  store!.set(settings as any)
  return store!.store
}

export function getSetting<K extends keyof Settings>(key: K): Settings[K] {
  if (!store) initializeSettings()
  return store!.get(key)
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  if (!store) initializeSettings()
  store!.set(key, value)
}
