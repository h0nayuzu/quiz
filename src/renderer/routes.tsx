import { HashRouter, Route, Routes } from 'react-router-dom'
import { MainScreen } from './screens/main'

export function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<MainScreen />} path="/" />
      </Routes>
    </HashRouter>
  )
}
