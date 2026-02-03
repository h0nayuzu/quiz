import { Outlet, Link, useLocation } from 'react-router-dom'
import { BookOpen, Settings, BarChart, Home, Sun, Moon, Eye } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export function Layout() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'
  }

  const getThemeDisplay = () => {
    switch (theme) {
      case 'light':
        return { icon: Sun, text: '日间模式' }
      case 'dark':
        return { icon: Moon, text: '夜间模式' }
      case 'eye-care':
        return { icon: Eye, text: '护眼模式' }
    }
  }

  const { icon: ThemeIcon, text: themeText } = getThemeDisplay()

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-4 flex flex-col">
        <div className="mb-8 px-4 py-2">
          <h1 className="text-xl font-bold tracking-tight text-primary">刷题应用</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <Link
            to="/"
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${isActive('/')}`}
          >
            <Home className="h-4 w-4" />
            主页
          </Link>
          <Link
            to="/result"
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${isActive('/result')}`}
          >
            <BarChart className="h-4 w-4" />
            统计
          </Link>
          <Link
            to="/settings"
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${isActive('/settings')}`}
          >
            <Settings className="h-4 w-4" />
            设置
          </Link>
        </nav>

        <div className="mt-auto space-y-4">
          <div className="px-4 py-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">主题切换</div>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              title="点击切换主题"
            >
              <ThemeIcon className="h-4 w-4" />
              {themeText}
            </button>
          </div>
          <div className="px-4 py-2 text-xs text-muted-foreground">
            v1.0.0
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 max-w-5xl h-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
