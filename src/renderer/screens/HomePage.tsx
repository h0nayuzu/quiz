import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet, BookOpen, Shuffle, AlertCircle, Star, Search, GraduationCap, Tag, Hash } from 'lucide-react'

const App = (window as any).App

export function HomePage() {
  const navigate = useNavigate()
  const [filePath, setFilePath] = useState<string>('')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showQuestionSelector, setShowQuestionSelector] = useState(false)
  const [startQuestionNumber, setStartQuestionNumber] = useState<string>('')

  useEffect(() => {
    loadSettings()
    loadStatistics()
    loadCategories()
  }, [])

  const loadSettings = async () => {
    try {
      const savedFilePath = await App.settings.getValue('lastFilePath')
      if (savedFilePath) {
        setFilePath(savedFilePath)
      }
      
      // Load last selected category
      const savedCategory = await App.settings.getValue('lastSelectedCategory')
      if (savedCategory) {
        setSelectedCategory(savedCategory)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const loadStatistics = async () => {
    try {
      const stats = await App.db.getStatistics()
      setStats(stats)
    } catch (error) {
      console.error('Failed to load statistics:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const cats = await App.db.getCategories()
      setCategories(cats)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const handleSelectFile = async () => {
    try {
      const result = await App.excel.selectFile()
      if (result.success && result.filePath) {
        setFilePath(result.filePath)
        await App.settings.setValue('lastFilePath', result.filePath)
        
        // Auto import on select
        await handleImportFile(result.filePath)
      }
    } catch (error) {
      console.error('Failed to select file:', error)
    }
  }

  const handleImportFile = async (path: string) => {
    if (!path) return

    setImporting(true)
    try {
      const parseResult = await App.excel.parseFile(path)
      if (parseResult.success && parseResult.data) {
        const importResult = await App.db.importQuestions(parseResult.data)
        if (importResult.success) {
          loadStatistics()
          loadCategories()
          alert(`成功导入 ${importResult.count} 道题目！`)
        } else {
          alert(`导入题目失败：${importResult.error}`)
        }
      } else {
        alert(`解析文件失败：${parseResult.error}`)
      }
    } catch (error) {
      console.error('Failed to import file:', error)
      alert('导入过程中发生错误')
    } finally {
      setImporting(false)
    }
  }

  const startPractice = (mode: string) => {
    if (!stats || stats.totalQuestions === 0) {
      alert('请先导入题库！')
      return
    }
    
    navigate(`/quiz/${mode}`)
  }

  const showJumpToQuestion = () => {
    if (!stats || stats.totalQuestions === 0) {
      alert('请先导入题库！')
      return
    }
    setShowQuestionSelector(true)
  }

  const startSequentialPractice = async () => {
    const questionNum = startQuestionNumber ? parseInt(startQuestionNumber) - 1 : 0
    
    if (questionNum < 0 || questionNum >= stats.totalQuestions) {
      alert(`请输入有效的题号（1-${stats.totalQuestions}）`)
      return
    }
    
    // 保存选择的起始位置
    await App.settings.saveSequentialProgress(questionNum)
    setShowQuestionSelector(false)
    setStartQuestionNumber('')
    navigate('/quiz/sequential')
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold tracking-tight">欢迎回来！</h2>
        <p className="text-muted-foreground">
          选择题库开始练习或继续上次的进度
        </p>
      </div>

      {/* File Selection Card */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold leading-none tracking-tight">题库</h3>
            {stats && (
              <span className="text-sm text-muted-foreground">
                总题数: {stats.totalQuestions}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {filePath || '未选择文件'}
            </div>
            <button
              onClick={handleSelectFile}
              disabled={importing}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              {importing ? '导入中...' : '选择文件'}
            </button>
          </div>
        </div>
      </div>

      {/* Question Number Selector Dialog */}
      {showQuestionSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 shadow-xl border">
            <h3 className="text-lg font-semibold mb-4">跳转到指定题目</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  输入题号（1-{stats?.totalQuestions || 0}）
                </label>
                <input
                  type="number"
                  min="1"
                  max={stats?.totalQuestions || 0}
                  value={startQuestionNumber}
                  onChange={(e) => setStartQuestionNumber(e.target.value)}
                  placeholder="输入题号"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={startSequentialPractice}
                  disabled={!startQuestionNumber}
                  className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
                >
                  开始练习
                </button>
                <button
                  onClick={() => {
                    setShowQuestionSelector(false)
                    setStartQuestionNumber('')
                  }}
                  className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Practice Modes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Sequential Practice */}
        <div className="group relative rounded-xl border hover:bg-muted/50 transition-all">
          <button
            onClick={() => startPractice('sequential')}
            className="flex flex-col gap-2 p-6 text-left w-full"
          >
            <div className="p-2 w-fit rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="font-semibold">顺序练习</h3>
            <p className="text-sm text-muted-foreground">
              按顺序逐题练习，适合首次学习
            </p>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              showJumpToQuestion()
            }}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
            title="跳转到指定题号"
          >
            <Hash className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Random Practice */}
        <button
          onClick={() => startPractice('random')}
          className="group relative flex flex-col gap-2 rounded-xl border p-6 hover:bg-muted/50 transition-all text-left"
        >
          <div className="p-2 w-fit rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400">
            <Shuffle className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">随机练习</h3>
          <p className="text-sm text-muted-foreground">
            随机顺序练习题目，测试知识掌握程度
          </p>
        </button>

        {/* Topic Practice */}
        <div className="group relative flex flex-col gap-2 rounded-xl border p-6 text-left">
          <div className="p-2 w-fit rounded-lg bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-400">
            <Tag className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">分类练习</h3>
          <p className="text-sm text-muted-foreground mb-2">
            专注于特定分类的题目
          </p>
          <select 
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={selectedCategory}
            onChange={async (e) => {
              const category = e.target.value
              setSelectedCategory(category)
              // Save selected category
              await App.settings.setValue('lastSelectedCategory', category)
            }}
          >
            <option value="">选择分类</option>
            {categories.map((cat) => (
              <option key={cat.category} value={cat.category}>
                {cat.category} ({cat.count}题)
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (selectedCategory) {
                navigate(`/quiz/topic?category=${encodeURIComponent(selectedCategory)}`)
              } else {
                alert('请先选择一个分类')
              }
            }}
            disabled={!selectedCategory}
            className="mt-2 w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3"
          >
            开始练习
          </button>
        </div>

        {/* Mistake Practice */}
        <button
          onClick={() => startPractice('mistake')}
          className="group relative flex flex-col gap-2 rounded-xl border p-6 hover:bg-muted/50 transition-all text-left"
        >
          <div className="p-2 w-fit rounded-lg bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">错题复习</h3>
          <p className="text-sm text-muted-foreground">
            复习之前答错的题目
          </p>
          {stats && stats.mistakeCount > 0 && (
            <span className="absolute top-6 right-6 text-xs font-medium text-red-600 dark:text-red-400">
              {stats.mistakeCount} 道题
            </span>
          )}
        </button>

        {/* Favorites Practice */}
        <button
          onClick={() => startPractice('favorites')}
          className="group relative flex flex-col gap-2 rounded-xl border p-6 hover:bg-muted/50 transition-all text-left"
        >
          <div className="p-2 w-fit rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
            <Star className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">收藏夹</h3>
          <p className="text-sm text-muted-foreground">
            练习标记为重要或困难的题目
          </p>
          {stats && stats.favoriteCount > 0 && (
            <span className="absolute top-6 right-6 text-xs font-medium text-amber-600 dark:text-amber-400">
              {stats.favoriteCount} 道题
            </span>
          )}
        </button>

        {/* Search */}
        <button
          onClick={() => navigate('/search')}
          className="group relative flex flex-col gap-2 rounded-xl border p-6 hover:bg-muted/50 transition-all text-left"
        >
          <div className="p-2 w-fit rounded-lg bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">搜索题目</h3>
          <p className="text-sm text-muted-foreground">
            通过关键词搜索题目内容或注释
          </p>
        </button>

        {/* Mock Exam */}
        <button
          onClick={() => navigate('/mock-exam')}
          className="group relative flex flex-col gap-2 rounded-xl border p-6 hover:bg-muted/50 transition-all text-left"
        >
          <div className="p-2 w-fit rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h3 className="font-semibold">模拟考试</h3>
          <p className="text-sm text-muted-foreground">
            模拟真实考试，50道随机题目，答题过程中不显示正确答案
          </p>
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-card p-6">
            <div className="text-sm font-medium text-muted-foreground">已练习</div>
            <div className="mt-2 text-2xl font-bold">{stats.attemptedQuestions}</div>
            <div className="text-xs text-muted-foreground">
              占总数 {Math.round((stats.attemptedQuestions / (stats.totalQuestions || 1)) * 100)}%
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <div className="text-sm font-medium text-muted-foreground">正确率</div>
            <div className="mt-2 text-2xl font-bold">
              {stats.attemptedQuestions > 0
                ? Math.round((stats.correctAnswers / stats.attemptedQuestions) * 100)
                : 0}%
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
