import { useState, useEffect } from 'react'
import { BarChart, PieChart, Activity, CheckCircle, XCircle, Star, AlertCircle } from 'lucide-react'

const App = (window as any).App

export function ResultPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const stats = await App.db.getStatistics()
      setStats(stats)
    } catch (error) {
      console.error('Failed to load statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center">加载统计数据中...</div>
  }

  if (!stats) {
    return <div className="flex h-full items-center justify-center">暂无统计数据。</div>
  }

  const correctRate = stats.attemptedQuestions > 0
    ? Math.round((stats.correctAnswers / stats.attemptedQuestions) * 100)
    : 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold tracking-tight">学习进度</h2>
        <p className="text-muted-foreground">
          跟踪你的学习历程，找出需要改进的领域。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">总题数</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{stats.totalQuestions}</div>
        </div>
        
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-muted-foreground">正确答案</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{stats.correctAnswers}</div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-muted-foreground">错题</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{stats.mistakeCount}</div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-muted-foreground">收藏</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{stats.favoriteCount}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">成绩概览</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>完成率</span>
                <span>{Math.round((stats.attemptedQuestions / (stats.totalQuestions || 1)) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${(stats.attemptedQuestions / (stats.totalQuestions || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>正确率</span>
                <span>{correctRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div 
                  className={`h-full ${correctRate >= 80 ? 'bg-green-500' : correctRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${correctRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">学习建议</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              <span>定期复习错题以巩固学习。</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              <span>使用"收藏"功能标记难题以便日后复习。</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              <span>尝试"随机模式"测试你的记忆能力。</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
