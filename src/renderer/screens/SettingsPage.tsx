import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'

const App = (window as any).App

interface Settings {
  lastFilePath: string
  theme: 'light' | 'dark' | 'system'
  aiConfig: {
    baseUrl: string
    apiKey: string
    model: string
  }
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const savedSettings = await App.settings.get()
      setSettings(savedSettings)
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      await App.settings.update(settings)
      alert('设置保存成功！')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('设置保存失败')
    } finally {
      setSaving(false)
    }
  }

  const updateAiConfig = (key: keyof Settings['aiConfig'], value: string) => {
    if (!settings) return
    setSettings({
      ...settings,
      aiConfig: {
        ...settings.aiConfig,
        [key]: value,
      },
    })
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center">加载设置中...</div>
  }

  if (!settings) {
    return <div className="flex h-full items-center justify-center">加载设置失败。</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold tracking-tight">设置</h2>
        <p className="text-muted-foreground">
          配置应用偏好和 AI 集成。
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-6">
        <h3 className="font-semibold text-lg">AI 配置</h3>
        <p className="text-sm text-muted-foreground">
          配置用于题目解释的 AI 提供商。兼容 OpenAI 和其他兼容 API（如智谱）。
        </p>

        <div className="grid gap-4 max-w-xl">
          <div className="grid gap-2">
            <label className="text-sm font-medium">基础 URL</label>
            <input
              type="text"
              value={settings.aiConfig.baseUrl || 'http://127.0.0.1:8045/v1'}
              onChange={(e) => updateAiConfig('baseUrl', e.target.value)}
              placeholder="http://127.0.0.1:8045/v1"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              API 端点 URL。默认为本地 Gemini 服务。
            </p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">API 密钥</label>
            <input
              type="password"
              value={settings.aiConfig.apiKey || 'sk-b4d2fda36ce5455f80071026fed7469a'}
              onChange={(e) => updateAiConfig('apiKey', e.target.value)}
              placeholder="sk-b4d2fda36ce5455f80071026fed7469a"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">模型</label>
            <input
              type="text"
              value={settings.aiConfig.model || 'gemini-3-flash'}
              onChange={(e) => updateAiConfig('model', e.target.value)}
              placeholder="gemini-3-flash"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-6">
        <h3 className="font-semibold text-lg">关于</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Electron 刷题应用 v1.0.0</p>
          <p>一个强大的题库练习和掌握工具。</p>
        </div>
      </div>
    </div>
  )
}
