import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { CatalogPage } from './pages/CatalogPage'
import { WorkbenchPage } from './pages/WorkbenchPage'
import { WizardPage } from './pages/WizardPage'

const navCls = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'}`

function App() {
  return (
    <HashRouter>
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <NavLink to="/" className="mr-4 text-lg font-black tracking-tight">
            🚲 Will&nbsp;It&nbsp;Fit?
          </NavLink>
          <NavLink to="/" end className={navCls}>
            Garage
          </NavLink>
          <NavLink to="/catalog" className={navCls}>
            Catalog
          </NavLink>
          <NavLink to="/wizard/driver" className={navCls}>
            Driver wizard
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/bike/:id" element={<WorkbenchPage />} />
          <Route path="/wizard/driver" element={<WizardPage />} />
        </Routes>
      </main>
    </HashRouter>
  )
}

export default App
