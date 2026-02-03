import { HashRouter, Routes, Route } from 'react-router-dom'

import { HomePage } from './screens/HomePage'
import { QuizPage } from './screens/QuizPage'
import { ResultPage } from './screens/ResultPage'
import { SettingsPage } from './screens/SettingsPage'
import { SearchPage } from './screens/SearchPage'
import { MockExamPage } from './screens/MockExamPage'
import { Layout } from './components/Layout'

export function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/quiz/:mode" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/mock-exam" element={<MockExamPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
