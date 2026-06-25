import { Outlet } from 'react-router-dom'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="app-shell">
      <div className="screen">
        <Topbar />
        <div className="layout">
          <Sidebar />
          <main className="content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
