/// <reference types="vite/client" />

interface Window {
  App: {
    sayHelloFromBridge: () => void
    username: string
    
    excel: {
      selectFile: () => Promise<any>
      parseFile: (filePath: string) => Promise<any>
      previewFile: (filePath: string, rowCount?: number) => Promise<any>
    }
    
    db: {
      importQuestions: (questions: any[]) => Promise<any>
      getAllQuestions: () => Promise<any[]>
      getQuestionsByCategory: (category: string) => Promise<any[]>
      getQuestionsByType: (type: string) => Promise<any[]>
      getRandomQuestions: (count: number) => Promise<any[]>
      getMistakeQuestions: () => Promise<any[]>
      getFavoriteQuestions: () => Promise<any[]>
      searchQuestions: (keyword: string) => Promise<any[]>
      recordAnswer: (questionId: number, userAnswer: string, isCorrect: boolean) => Promise<any>
      toggleFavorite: (questionId: number) => Promise<any>
      isFavorite: (questionId: number) => Promise<boolean>
      saveMistakeNote: (questionId: number, note: string) => Promise<any>
      getMistakeNote: (questionId: number) => Promise<any>
      getCategories: () => Promise<string[]>
      getStatistics: () => Promise<any>
    }
    
    settings: {
      get: () => Promise<any>
      update: (settings: any) => Promise<any>
      getValue: (key: string) => Promise<any>
      setValue: (key: string, value: any) => Promise<any>
      getTheme: () => Promise<string>
      setTheme: (theme: string) => Promise<any>
    }
    
    ai: {
      getExplanation: (question: string, answer: string, useStream?: boolean) => Promise<any>
      onExplanationChunk: (callback: (chunk: string) => void) => void
      removeExplanationChunkListener: () => void
    }
  }
}
