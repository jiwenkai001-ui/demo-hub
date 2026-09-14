import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [account, setAccount] = useState('admin')
  const [password, setPassword] = useState('••••••••')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Demo：模拟登录跳转
    setTimeout(() => navigate('/dashboard'), 700)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Brand side */}
      <aside className="relative md:w-1/2 bg-navy-900 text-white overflow-hidden flex flex-col">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-navy-700/60 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />

        <div className="relative flex-1 flex flex-col p-8 md:p-12">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-gold-500 flex items-center justify-center text-navy-900 font-bold text-lg">
              财
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold">财税中台 · 客户运营与对账系统</div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-navy-300">
                Finance Operations
              </div>
            </div>
          </div>

          <div className="mt-auto max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-navy-800/80 px-3 py-1 text-xs text-navy-200">
              <ShieldCheck size={14} className="text-gold-400" />
              生产工作环境 · 请使用分配的账号
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
              把每一笔客户往来，
              <br />
              <span className="text-gold-400">变成可追踪的动作。</span>
            </h1>
            <p className="mt-4 text-sm text-navy-200 leading-relaxed">
              客户档案、合同收款、客户银行流水与风险提醒，在一个工作台里保持同一套业务口径。
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
              <Stat label="在管客户" value="6 家" />
              <Stat label="今日待办" value="7 项" />
              <Stat label="风险提醒" value="3 项" />
            </div>
          </div>

          <div className="mt-10 text-[11px] text-navy-400">
            © 2026 睿思科技 · 财税中台 Demo
          </div>
        </div>
      </aside>

      {/* Form side */}
      <section className="md:w-1/2 flex items-center justify-center bg-navy-50 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-navy-500">Welcome back</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink-900">登录财税中台</h2>
            <p className="mt-2 text-sm text-ink-500">
              使用你的工作账号继续处理今日客户事项。
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">账号</label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="请输入账号"
                className="ft-input"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="ft-input"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-navy-300 text-navy-700 focus:ring-navy-500"
                />
                记住登录状态
              </label>
              <a href="#" className="text-sm text-navy-600 hover:text-navy-800">
                忘记密码？
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="ft-btn-primary w-full py-2.5 disabled:opacity-70"
            >
              {loading ? '正在登录…' : '登录工作台'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-navy-100">
            <p className="text-xs text-ink-500">演示账号（已预填）</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              {[
                { name: '管理员', acc: 'admin' },
                { name: '财务顾问一', acc: 'fa1' },
                { name: '财务顾问二', acc: 'fa2' },
              ].map((u) => (
                <button
                  key={u.acc}
                  type="button"
                  onClick={() => {
                    setAccount(u.acc)
                    setPassword('••••••••')
                  }}
                  className="rounded-lg border border-navy-200 bg-white px-2 py-1.5 text-ink-700 hover:border-navy-400 hover:bg-navy-50"
                >
                  {u.name}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-ink-300">
              点击任意账号即可预填表单，点击「登录工作台」直接进入演示。
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-navy-800 bg-navy-800/40 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-navy-300">{label}</div>
      <div className="mt-0.5 text-lg font-semibold text-white">{value}</div>
    </div>
  )
}
