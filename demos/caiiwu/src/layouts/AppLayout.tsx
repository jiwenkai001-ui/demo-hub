import { useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarClock,
  ClipboardList,
  DatabaseBackup,
  FileText,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  Settings,
  Users,
  Wallet,
  X,
  Menu,
} from 'lucide-react'

const nav = [
  { to: '/dashboard', label: '今日工作台', icon: LayoutDashboard, hint: 'DAILY DESK' },
  { to: '/customers', label: '客户档案', icon: Users, hint: 'CUSTOMERS' },
  { to: '/contracts', label: '合同往来', icon: FileText, hint: 'CONTRACTS' },
  { to: '/current-account', label: '经营往来账', icon: Wallet, hint: 'LEDGER' },
  { to: '/cash-flow', label: '账务流水', icon: ListChecks, hint: 'CASH FLOW' },
  { to: '/reminders', label: '提醒中心', icon: Bell, hint: 'REMINDERS' },
  { to: '/import', label: '导入与备份', icon: DatabaseBackup, hint: 'IMPORT' },
  { to: '/logs', label: '操作记录', icon: ScrollText, hint: 'AUDIT LOG' },
  { to: '/settings', label: '系统设置', icon: Settings, hint: 'SETTINGS' },
]

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const today = useMemo(() => new Date('2026-09-14T08:30:00'), [])
  const dateText = `2026年9月14日 星期一`

  const activeIndex = nav.findIndex((n) => location.pathname.startsWith(n.to))
  const isCustomerDetail = location.pathname.startsWith('/customers/')

  function logout() {
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-navy-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-navy-900 text-navy-100 transition-transform md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-navy-800">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gold-500 flex items-center justify-center text-navy-900 font-bold">
              财
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">财税中台</div>
              <div className="text-[10px] uppercase tracking-wider text-navy-300">
                Finance Operations
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-navy-300 hover:text-white"
            aria-label="关闭菜单"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-0.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          <p className="px-3 pb-2 text-[10px] uppercase tracking-wider text-navy-400">导航</p>
          {nav.map((item, idx) => {
            const Icon = item.icon
            const active = activeIndex === idx || (item.to === '/customers' && isCustomerDetail)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-navy-800 text-white'
                    : 'text-navy-200 hover:bg-navy-800/60 hover:text-white'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={16} className={active ? 'text-gold-400' : ''} />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <p className="px-3 pt-5 pb-2 text-[10px] uppercase tracking-wider text-navy-400">
            系统
          </p>
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-navy-200 hover:bg-navy-800/60 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <Settings size={16} />
            <span>账号与业务规则</span>
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-navy-800 p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-navy-700 flex items-center justify-center text-sm font-semibold text-white">
              管
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium text-white">管理员</div>
              <div className="text-[11px] text-navy-300">系统管理员</div>
            </div>
            <button
              onClick={logout}
              className="ml-auto text-[11px] text-navy-300 hover:text-gold-400"
            >
              退出
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-navy-100 bg-white/95 px-4 backdrop-blur md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-navy-700"
            aria-label="打开菜单"
          >
            <Menu size={20} />
          </button>
          <div className="hidden md:flex items-center gap-2 text-xs text-ink-500">
            <CalendarClock size={14} />
            <span>{dateText}</span>
            <span className="text-navy-300">·</span>
            <span>先处理逾期与高风险事项，再完成今天的客户跟进。</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/reminders"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-navy-700 hover:bg-navy-50"
              aria-label="查看站内提醒"
            >
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500" />
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-navy-50"
            >
              <div className="h-7 w-7 rounded-full bg-navy-800 flex items-center justify-center text-xs font-semibold text-white">
                管
              </div>
              <span className="hidden md:inline text-sm text-ink-700">管理员</span>
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
