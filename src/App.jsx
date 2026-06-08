import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Projects from './pages/Projects'
import RuleDesign from './pages/RuleDesign'
import CardBuilder from './pages/CardBuilder'
import CardEditor from './pages/CardEditor'
import OrderPreview from './pages/OrderPreview'
import ExportPage from './pages/ExportPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/rules" element={<RuleDesign />} />
        <Route path="/cards" element={<CardBuilder />} />
        <Route path="/cards/edit" element={<CardEditor />} />
        <Route path="/order" element={<OrderPreview />} />
        <Route path="/export" element={<ExportPage />} />
      </Routes>
    </BrowserRouter>
  )
}
