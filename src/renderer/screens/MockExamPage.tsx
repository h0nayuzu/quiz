import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from 'renderer/components/ui/alert'

const App = (window as any).App

interface Question {
  id: number
  题干: string
  选项A: string
  选项B: string
  选项C: string
  选项D: string
  参考答案: string
}

export function MockExamPage() {
  const navigate = useNavigate()
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      // Load 50 random questions for mock exam
      const loadedQuestions = await App.db.getRandomQuestions(50)
      
      if (loadedQuestions.length === 0) {
        alert('没有可用于模拟考试的题目。')
        navigate('/')
        return
      }

      setQuestions(loadedQuestions)
    } catch (error) {
      console.error('Failed to load questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (answer: string) => {
    if (submitted) return
    setAnswers({
      ...answers,
      [questions[currentIndex].id]: answer
    })
  }

  const handleSubmit = () => {
    if (!confirm('确定要提交考试吗？')) return

    let correctCount = 0
    questions.forEach(q => {
      if (answers[q.id] === q.参考答案) {
        correctCount++
      }
      
      // Record answer in database
      App.db.recordAnswer(q.id, answers[q.id] || '', answers[q.id] === q.参考答案)
    })

    const finalScore = Math.round((correctCount / questions.length) * 100)
    setScore(finalScore)
    setSubmitted(true)
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center">准备考试中...</div>
  }

  const currentQuestion = questions[currentIndex]
  const options = [
    { key: 'A', value: currentQuestion.选项A },
    { key: 'B', value: currentQuestion.选项B },
    { key: 'C', value: currentQuestion.选项C },
    { key: 'D', value: currentQuestion.选项D },
  ].filter(opt => opt.value)

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
            第 {currentIndex + 1} 题，共 {questions.length} 题
          </span>
          <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
            模拟考试
          </span>
        </div>
        
        {submitted && (
          <div className="text-lg font-bold">
            得分: {score}%
          </div>
        )}
      </div>

      {/* Question Card */}
      <div className="flex-1 rounded-xl border bg-card p-6 shadow-sm overflow-y-auto">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium leading-relaxed">
              {currentQuestion.题干}
            </h3>
          </div>

          <div className="space-y-3">
            {options.map((option) => (
              <button
                key={option.key}
                onClick={() => handleAnswer(option.key)}
                disabled={submitted}
                className={`w-full flex items-center p-4 rounded-lg border text-left transition-all
                  ${answers[currentQuestion.id] === option.key 
                    ? submitted 
                      ? option.key === currentQuestion.参考答案
                        ? 'bg-green-100 border-green-500 dark:bg-green-900/30'
                        : 'bg-red-100 border-red-500 dark:bg-red-900/30'
                      : 'bg-primary/10 border-primary'
                    : submitted && option.key === currentQuestion.参考答案
                      ? 'bg-green-100 border-green-500 dark:bg-green-900/30'
                      : 'hover:bg-muted'
                  }
                `}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium mr-4
                  ${answers[currentQuestion.id] === option.key || (submitted && option.key === currentQuestion.参考答案)
                    ? 'border-transparent bg-background/50'
                    : 'bg-muted'
                  }
                `}>
                  {option.key}
                </span>
                <span className="flex-1">{option.value}</span>
                
                {submitted && option.key === currentQuestion.参考答案 && (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
                {submitted && answers[currentQuestion.id] === option.key && answers[currentQuestion.id] !== currentQuestion.参考答案 && (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </button>
            ))}
          </div>

          {submitted && (
            <div className="mt-6">
              <Alert className={answers[currentQuestion.id] === currentQuestion.参考答案 ? 'border-green-500/50 bg-green-50/50' : 'border-red-500/50 bg-red-50/50'}>
                <AlertTitle>
                  {answers[currentQuestion.id] === currentQuestion.参考答案 ? '回答正确！' : '回答错误'}
                </AlertTitle>
                <AlertDescription>
                  正确答案是 <strong>{currentQuestion.参考答案}</strong>。
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
        >
          <ArrowLeft className="h-4 w-4" />
          上一题
        </button>

        {!submitted && currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            提交考试
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            disabled={currentIndex === questions.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            下一题
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
