import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Star, MessageSquare, Sparkles } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from 'renderer/components/ui/alert'
import ReactMarkdown from 'react-markdown'

const App = (window as any).App

interface Question {
  id: number
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

export function QuizPage() {
  const { mode } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const [showAnswerDirectly, setShowAnswerDirectly] = useState(false)

  useEffect(() => {
    loadQuestions()
    // 顺序练习和分类练习直接显示答案
    setShowAnswerDirectly(mode === 'sequential' || mode === 'topic')
  }, [mode, searchParams])

  useEffect(() => {
    if (questions.length > 0) {
      checkFavorite()
      loadNote()
      loadAiExplanation()
      // 如果是直接显示答案模式,自动显示结果
      if (showAnswerDirectly) {
        setShowResult(true)
        setSelectedAnswer(null) // 不预选答案
      }
      
      // 保存进度
      saveProgress()
    }
  }, [currentIndex, questions, showAnswerDirectly])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      let loadedQuestions: Question[] = []
      let savedIndex = 0
      
      switch (mode) {
        case 'sequential':
          loadedQuestions = await App.db.getAllQuestions()
          // 加载上次进度
          const sequentialProgress = await App.settings.getSequentialProgress()
          // 正确解析进度值 - 从对象中提取 lastQuestionIndex
          savedIndex = typeof sequentialProgress === 'object' && sequentialProgress !== null 
            ? (sequentialProgress as any).lastQuestionIndex ?? 0
            : (typeof sequentialProgress === 'number' ? sequentialProgress : 0)
          break
        case 'random':
          loadedQuestions = await App.db.getRandomQuestions(50) // Default to 50 for random session
          break
        case 'topic':
          const category = searchParams.get('category')
          if (category) {
            loadedQuestions = await App.db.getQuestionsByCategory(category)
            // 加载该分类的进度
            const categoryProgress = await App.settings.getCategoryProgress(category)
            // 正确解析进度值 - 从对象中提取 lastQuestionIndex
            savedIndex = typeof categoryProgress === 'object' && categoryProgress !== null 
              ? (categoryProgress as any).lastQuestionIndex ?? 0
              : (typeof categoryProgress === 'number' ? categoryProgress : 0)
          }
          break
        case 'mistake':
          loadedQuestions = await App.db.getMistakeQuestions()
          break
        case 'favorites':
          loadedQuestions = await App.db.getFavoriteQuestions()
          break
        default:
          loadedQuestions = await App.db.getAllQuestions()
      }

      if (loadedQuestions.length === 0) {
        alert('该模式下未找到题目。')
        navigate('/')
        return
      }

      setQuestions(loadedQuestions)
      // 设置到保存的进度位置
      if (savedIndex < loadedQuestions.length) {
        setCurrentIndex(savedIndex)
      }
    } catch (error) {
      console.error('Failed to load questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkFavorite = async () => {
    if (!questions[currentIndex]) return
    try {
      const result = await App.db.isFavorite(questions[currentIndex].id)
      setIsFavorite(result)
    } catch (error) {
      console.error('Failed to check favorite:', error)
    }
  }

  const loadNote = async () => {
    if (!questions[currentIndex]) return
    try {
      const savedNote = await App.db.getMistakeNote(questions[currentIndex].id)
      setNote(savedNote || '')
    } catch (error) {
      console.error('Failed to load note:', error)
    }
  }

  const loadAiExplanation = async () => {
    if (!questions[currentIndex]) return
    try {
      const questionId = questions[currentIndex].id.toString()
      const savedExplanation = await App.settings.getAiExplanation(questionId)
      if (savedExplanation) {
        setAiExplanation(savedExplanation)
      } else {
        setAiExplanation(null)
      }
    } catch (error) {
      console.error('Failed to load AI explanation:', error)
    }
  }

  const saveProgress = async () => {
    if (!questions[currentIndex]) return
    try {
      if (mode === 'sequential') {
        await App.settings.saveSequentialProgress(currentIndex)
      } else if (mode === 'topic') {
        const category = searchParams.get('category')
        if (category) {
          await App.settings.saveCategoryProgress(category, currentIndex)
        }
      }
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  const handleAnswer = async (answer: string) => {
    if (showResult) return // Prevent changing answer after submission

    setSelectedAnswer(answer)
    setShowResult(true)

    const isCorrect = answer === questions[currentIndex].参考答案
    
    // Record attempt
    try {
      await App.db.recordAnswer(questions[currentIndex].id, answer, isCorrect)
    } catch (error) {
      console.error('Failed to record answer:', error)
    }
  }

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowResult(showAnswerDirectly) // 直接显示答案模式保持显示
      setShowNote(false)
    } else if (mode === 'topic') {
      // 分类练习刷完了，自动进入下一个分类
      try {
        const categories = await App.db.getCategories()
        const currentCategory = searchParams.get('category')
        const currentCategoryIndex = categories.findIndex((cat: any) => cat.category === currentCategory)
        
        if (currentCategoryIndex >= 0 && currentCategoryIndex < categories.length - 1) {
          const nextCategory = categories[currentCategoryIndex + 1].category
          // 重置下个分类的进度为0
          await App.settings.saveCategoryProgress(nextCategory, 0)
          // 更新全局选中的分类记忆
          await App.settings.setValue('lastSelectedCategory', nextCategory)
          navigate(`/quiz/topic?category=${encodeURIComponent(nextCategory)}`)
        } else {
          // 已是最后一个分类，返回首页
          navigate('/')
        }
      } catch (error) {
        console.error('Failed to load next category:', error)
        alert('加载下一个分类失败')
      }
    }
  }

  const handlePrev = async () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setSelectedAnswer(null)
      setShowResult(showAnswerDirectly) // 直接显示答案模式保持显示
      setShowNote(false)
    } else if (mode === 'topic' && currentIndex === 0) {
      // 分类练习第一题往前，自动进入上一个分类
      try {
        const categories = await App.db.getCategories()
        const currentCategory = searchParams.get('category')
        const currentCategoryIndex = categories.findIndex((cat: any) => cat.category === currentCategory)
        
        if (currentCategoryIndex > 0) {
          const prevCategory = categories[currentCategoryIndex - 1].category
          // 获取上一个分类的题目数量
          const prevCategoryQuestions = await App.db.getQuestionsByCategory(prevCategory)
          // 设置进度为该分类的最后一题
          await App.settings.saveCategoryProgress(prevCategory, prevCategoryQuestions.length - 1)
          // 更新全局选中的分类记忆
          await App.settings.setValue('lastSelectedCategory', prevCategory)
          navigate(`/quiz/topic?category=${encodeURIComponent(prevCategory)}`)
        }
        // 已是第一个分类，不做任何操作
      } catch (error) {
        console.error('Failed to load previous category:', error)
        alert('加载上一个分类失败')
      }
    }
  }

  const toggleFavorite = async () => {
    if (!questions[currentIndex]) return
    try {
      const result = await App.db.toggleFavorite(questions[currentIndex].id)
      if (result.success) {
        setIsFavorite(result.isFavorite)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const saveNote = async () => {
    if (!questions[currentIndex]) return
    try {
      await App.db.saveMistakeNote(questions[currentIndex].id, note)
      alert('笔记已保存！')
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }

  const requestAiExplanation = async () => {
    if (!currentQuestion) return
    
    const questionId = currentQuestion.id.toString()
    const existingExplanation = await App.settings.getAiExplanation(questionId)
    
    // 如果已有保存的解释，询问用户是否替换
    if (existingExplanation && aiExplanation) {
      const shouldReplace = confirm('该题目已有 AI 解释。\n\n是否使用新的解释替换旧内容？\n\n确定 = 替换，取消 = 保留旧内容')
      if (!shouldReplace) {
        return
      }
    }
    
    setLoadingAi(true)
    setAiExplanation('') // 清空之前的内容
    
    try {
      let fullExplanation = ''
      
      // 设置流式监听器
      App.ai.onExplanationChunk((chunk: string) => {
        fullExplanation += chunk
        setAiExplanation(fullExplanation)
      })

      // 请求AI解释（使用流式输出）
      const result = await App.ai.getExplanation(
        currentQuestion.题干,
        currentQuestion.参考答案,
        true // 启用流式输出
      )
      
      if (!result.success) {
        alert(`获取解释失败：${result.error}`)
      } else {
        // 保存 AI 解释
        await App.settings.saveAiExplanation(questionId, fullExplanation)
      }
    } catch (error) {
      console.error('Failed to get AI explanation:', error)
      alert('连接 AI 服务失败')
    } finally {
      setLoadingAi(false)
    }
  }

  // 组件卸载时清理监听器
  useEffect(() => {
    return () => {
      App.ai.removeExplanationChunkListener()
    }
  }, [])

  if (loading) {
    return <div className="flex h-full items-center justify-center">加载题目中...</div>
  }

  if (questions.length === 0) {
    return <div className="flex h-full items-center justify-center">暂无题目。</div>
  }

  const currentQuestion = questions[currentIndex]
  const options = [
    { key: 'A', value: currentQuestion.选项A },
    { key: 'B', value: currentQuestion.选项B },
    { key: 'C', value: currentQuestion.选项C },
    { key: 'D', value: currentQuestion.选项D },
  ].filter(opt => opt.value) // Filter out empty options

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-muted rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-muted-foreground">
            题目 {currentIndex + 1} / {questions.length}
          </span>
          <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
            {mode?.toUpperCase()} 模式
          </span>
          
          {/* Jump to Question */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">跳转到:</span>
            <input
              type="number"
              min="1"
              max={questions.length}
              placeholder="#"
              className="w-16 px-2 py-1 text-xs border rounded bg-background text-center"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = parseInt((e.target as HTMLInputElement).value)
                  if (value >= 1 && value <= questions.length) {
                    setCurrentIndex(value - 1)
                    setSelectedAnswer(null)
                    setShowResult(showAnswerDirectly)
                    setShowNote(false)
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }
              }}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNote(!showNote)}
            className={`p-2 rounded-full hover:bg-muted ${showNote ? 'bg-muted' : ''}`}
            title="笔记"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            onClick={toggleFavorite}
            className={`p-2 rounded-full hover:bg-muted ${isFavorite ? 'text-amber-500' : 'text-muted-foreground'}`}
            title="切换收藏"
          >
            <Star className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 rounded-xl border bg-card p-6 shadow-sm overflow-y-auto">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium leading-relaxed">
              {currentQuestion.题干}
            </h3>
            <div className="flex gap-2 text-xs text-muted-foreground">
              {currentQuestion.题型 && (
                <span className="px-2 py-0.5 bg-muted rounded">{currentQuestion.题型}</span>
              )}
              {currentQuestion.分类 && (
                <span className="px-2 py-0.5 bg-muted rounded">{currentQuestion.分类}</span>
              )}
              {currentQuestion.难度 && (
                <span className="px-2 py-0.5 bg-muted rounded">{currentQuestion.难度}</span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {options.map((option) => (
              <button
                key={option.key}
                onClick={() => !showAnswerDirectly && handleAnswer(option.key)}
                disabled={showResult && !showAnswerDirectly}
                className={`w-full flex items-center p-4 rounded-lg border text-left transition-all
                  ${selectedAnswer === option.key 
                    ? showResult 
                      ? option.key === currentQuestion.参考答案
                        ? 'bg-green-50 border-green-500 text-green-900 dark:bg-green-500/20 dark:border-green-400 dark:text-green-100'
                        : 'bg-red-50 border-red-500 text-red-900 dark:bg-red-500/20 dark:border-red-400 dark:text-red-100'
                      : 'bg-primary/10 border-primary'
                    : showResult && option.key === currentQuestion.参考答案
                      ? 'bg-green-50 border-green-500 text-green-900 dark:bg-green-500/20 dark:border-green-400 dark:text-green-100'
                      : showAnswerDirectly
                        ? 'bg-background'
                        : 'hover:bg-muted'
                  }
                  ${showAnswerDirectly ? 'cursor-default' : ''}
                `}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium mr-4
                  ${selectedAnswer === option.key || (showResult && option.key === currentQuestion.参考答案)
                    ? 'border-transparent bg-background/50'
                    : 'bg-muted'
                  }
                `}>
                  {option.key}
                </span>
                <span className="flex-1">{option.value}</span>
                
                {showResult && option.key === currentQuestion.参考答案 && (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
                )}
                {showResult && selectedAnswer === option.key && selectedAnswer !== currentQuestion.参考答案 && (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
                )}
              </button>
            ))}
          </div>

          {showResult && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
              {!showAnswerDirectly && (
                <Alert className={selectedAnswer === currentQuestion.参考答案 
                  ? 'border-green-500 bg-green-50 text-green-900 dark:border-green-400 dark:bg-green-500/20 dark:text-green-100' 
                  : 'border-red-500 bg-red-50 text-red-900 dark:border-red-400 dark:bg-red-500/20 dark:text-red-100'}>
                  <AlertTitle className="dark:text-inherit">
                    {selectedAnswer === currentQuestion.参考答案 ? '回答正确！' : '回答错误'}
                  </AlertTitle>
                  <AlertDescription className="dark:text-inherit">
                    正确答案是 <strong>{currentQuestion.参考答案}</strong>。
                  </AlertDescription>
                </Alert>
              )}
              
              {showAnswerDirectly && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-500 text-green-900 dark:bg-green-500/20 dark:border-green-400 dark:text-green-100">
                  <span className="font-semibold">
                    正确答案：{currentQuestion.参考答案}
                  </span>
                </div>
              )}
              
              {currentQuestion.注释 && (
                <div className="p-4 rounded-lg bg-muted/50 text-sm">
                  <span className="font-semibold block mb-2">解析：</span>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>
                      {currentQuestion.注释}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={requestAiExplanation}
                  disabled={loadingAi}
                  className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {loadingAi ? '询问 AI 中...' : aiExplanation ? '重新生成 AI 解释' : '请 AI 解释'}
                </button>
              </div>

              {aiExplanation && (
                <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 text-sm animate-in fade-in">
                  <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-semibold">
                    <Sparkles className="h-4 w-4" />
                    AI 解析 {loadingAi && <span className="text-xs font-normal">(生成中...)</span>}
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>
                      {aiExplanation}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {showNote && (
            <div className="mt-6 p-4 rounded-lg border bg-card space-y-2">
              <label className="text-sm font-medium">我的笔记</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full min-h-[100px] p-2 rounded-md border bg-background text-sm resize-y"
                placeholder="在此添加你的笔记..."
              />
              <div className="flex justify-end">
                <button
                  onClick={saveNote}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  保存笔记
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0 && mode !== 'topic'}
          className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
        >
          <ArrowLeft className="h-4 w-4" />
          {mode === 'topic' && currentIndex === 0 ? '上一分类' : '上一题'}
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1 && mode !== 'topic'}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
        >
          {mode === 'topic' && currentIndex === questions.length - 1 ? '下一分类' : '下一题'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
