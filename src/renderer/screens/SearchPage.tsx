import { useState } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
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
  分类?: string
  题型?: string
  注释?: string
  难度?: string
}

export function SearchPage() {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return

    setLoading(true)
    try {
      const data = await App.db.searchQuestions(keyword)
      setResults(data)
      setExpandedId(null)
    } catch (error) {
      console.error('Failed to search:', error)
      alert('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold tracking-tight">搜索题目</h2>
        <p className="text-muted-foreground">
          通过关键词在题目内容或注释中查找题目。
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="输入关键词..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !keyword.trim()}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          {loading ? '搜索中...' : '搜索'}
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {results.length === 0 && !loading && keyword && (
          <div className="text-center text-muted-foreground py-8">
            未找到匹配"{keyword}"的题目
          </div>
        )}

        {results.map((question) => (
          <div key={question.id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div 
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-start gap-4"
              onClick={() => toggleExpand(question.id)}
            >
              <div className="flex-1 space-y-2">
                <p className="font-medium">{question.题干}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {question.题型 && (
                    <span className="px-2 py-0.5 bg-muted rounded">{question.题型}</span>
                  )}
                  {question.分类 && (
                    <span className="px-2 py-0.5 bg-muted rounded">{question.分类}</span>
                  )}
                </div>
              </div>
              {expandedId === question.id ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {expandedId === question.id && (
              <div className="p-4 pt-0 border-t bg-muted/20">
                <div className="mt-4 space-y-2">
                  <div className="grid gap-2 text-sm">
                    {question.选项A && <div className="p-2 rounded border bg-background">A. {question.选项A}</div>}
                    {question.选项B && <div className="p-2 rounded border bg-background">B. {question.选项B}</div>}
                    {question.选项C && <div className="p-2 rounded border bg-background">C. {question.选项C}</div>}
                    {question.选项D && <div className="p-2 rounded border bg-background">D. {question.选项D}</div>}
                  </div>

                  <Alert className="mt-4 bg-green-50/50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                    <AlertTitle>正确答案：{question.参考答案}</AlertTitle>
                    {question.注释 && (
                      <AlertDescription className="mt-2 text-muted-foreground">
                        {question.注释}
                      </AlertDescription>
                    )}
                  </Alert>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
