import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  FileText,
  ScrollText,
  Users,
  Wallet,
} from 'lucide-react'
import { customers, todos as initialTodos } from '../data'
import type { Todo, TodoStatus } from '../data'
import {
  Card,
  PriorityTag,
  StatusTag,
} from '../components/ui'

const kpis = [
  { label: '在管客户', value: '6', suffix: '家', hint: '当前账号可见客户', icon: Users, tone: 'navy' },
  { label: '待收代账费', value: '4', suffix: '家', hint: '包含临近到期事项', icon: Wallet, tone: 'amber' },
  { label: '开票预警', value: '2', suffix: '家', hint: '达到风险阈值自动标记', icon: AlertTriangle, tone: 'red' },
  { label: '待维护资料', value: '1', suffix: '家', hint: '需要补齐客户资料', icon: FileText, tone: 'blue' },
  { label: '今日待办', value: '7', suffix: '项', hint: '按优先级排序处理', icon: ClipboardList, tone: 'navy' },
] as const

const riskPie = [
  { name: '已超额', value: 1, color: '#d04343' },
  { name: '高风险', value: 1, color: '#e09a3a' },
  { name: '关注', value: 1, color: '#2f6db5' },
  { name: '正常', value: 3, color: '#3a8a5a' },
]

const categoryBars = [
  { name: '代账收费', value: 2 },
  { name: '客户备忘', value: 1 },
  { name: '开票风险', value: 1 },
  { name: '系统', value: 1 },
  { name: '资料维护', value: 1 },
  { name: '银行对账', value: 1 },
]

const ownerBars = [
  { name: '财务顾问一', value: 4 },
  { name: '财务顾问二', value: 2 },
]

export default function DashboardPage() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [expandedId, setExpandedId] = useState<string | null>(initialTodos[0]?.id ?? null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'reminded' | 'done'>('all')

  const filteredTodos = useMemo(() => {
    if (filter === 'all') return todos
    return todos.filter((t) => t.status === filter)
  }, [todos, filter])

  const pendingCount = todos.filter((t) => t.status === 'pending').length
  const remindedCount = todos.filter((t) => t.status === 'reminded').length
  const doneCount = todos.filter((t) => t.status === 'done').length

  function setStatus(id: string, status: TodoStatus) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-card bg-navy-900 text-white px-6 py-6 md:px-8 md:py-7 shadow-card relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-navy-700/60 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-navy-300">Daily Desk</div>
            <h1 className="mt-2 text-2xl font-semibold">今日财税工作台</h1>
            <p className="mt-1 text-sm text-navy-200">
              2026年9月14日星期一 · 先处理逾期与高风险事项，再完成今天的客户跟进。
            </p>
          </div>
          <div className="rounded-lg border border-navy-700 bg-navy-800/60 px-4 py-3 max-w-sm">
            <div className="text-xs text-navy-300">下个统一节点</div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-base font-semibold text-gold-400">三季度银行对账</span>
              <span className="text-xs text-navy-200">· 10月10日前</span>
            </div>
            <div className="mt-1 text-[11px] text-navy-300">
              截止 2026-10-10 · 当前未匹配 6 条
            </div>
            <Link
              to="/cash-flow"
              className="mt-2 inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-500"
            >
              前往对账 <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* KPI */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <button
              key={k.label}
              className="ft-card p-4 text-left hover:border-navy-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-500">{k.label}</span>
                <Icon size={16} className="text-navy-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-ink-900">{k.value}</span>
                <span className="text-xs text-ink-500">{k.suffix}</span>
              </div>
              <p className="mt-1 text-[11px] text-ink-500">{k.hint}</p>
            </button>
          )
        })}
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="客户风险等级分布" extra={<span className="ft-muted">6 在管客户</span>}>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {riskPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e7ecf5',
                    fontSize: 12,
                  }}
                  formatter={(value: number, name) => [`${value} 家（${((value / 6) * 100).toFixed(1)}%）`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {riskPie.map((r) => (
              <div key={r.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                <span className="text-ink-700">{r.name}</span>
                <span className="ml-auto text-ink-500">{r.value} 家</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="风险事项分类统计" extra={<span className="ft-muted">待收费 / 待催办 / 待维护</span>}>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBars} margin={{ top: 10, right: 8, bottom: 0, left: -16 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e7ecf5', fontSize: 12 }}
                  formatter={(value: number) => [`${value} 项`, '数量']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#1a2744" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-[11px] text-ink-500">
            本周共 7 项风险事项，其中代账收费 2 项、银行对账 1 项为紧急优先级。
          </p>
        </Card>

        <Card title="负责人客户负载" extra={<span className="ft-muted">当前账号</span>}>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ownerBars} margin={{ top: 10, right: 8, bottom: 0, left: -16 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e7ecf5', fontSize: 12 }}
                  formatter={(value: number) => [`${value} 家客户`, '负载']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#b8893a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-[11px] text-ink-500">
            财务顾问一负载 4 家（其中 2 家已超额/高风险），财务顾问二负载 2 家。
          </p>
        </Card>
      </section>

      {/* Today's priority todos */}
      <Card
        title="今日优先事项"
        extra={
          <div className="flex items-center gap-1 text-xs">
            <FilterBtn label={`全部 ${todos.length}`} active={filter === 'all'} onClick={() => setFilter('all')} />
            <FilterBtn label={`待处理 ${pendingCount}`} active={filter === 'pending'} onClick={() => setFilter('pending')} />
            <FilterBtn label={`已提醒 ${remindedCount}`} active={filter === 'reminded'} onClick={() => setFilter('reminded')} />
            <FilterBtn label={`已处理 ${doneCount}`} active={filter === 'done'} onClick={() => setFilter('done')} />
          </div>
        }
        bodyClass="!p-0"
      >
        <p className="px-5 pt-1 pb-3 text-xs text-ink-500">
          按到期日与优先级排序，点击客户名进入档案，点击行展开详情。
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/40">
                <th className="ft-th w-16">优先级</th>
                <th className="ft-th w-32">到期</th>
                <th className="ft-th w-36">客户</th>
                <th className="ft-th">事项</th>
                <th className="ft-th w-24">类别</th>
                <th className="ft-th w-28">负责人</th>
                <th className="ft-th w-24">状态</th>
                <th className="ft-th w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTodos.map((t) => {
                const expanded = expandedId === t.id
                const overdue = (t.overdueDays ?? 0) > 0
                return (
                  <Fragment key={t.id}>
                    <tr
                      className={`ft-row-hover cursor-pointer border-b border-navy-50 last:border-0 ${
                        expanded ? 'bg-navy-50/60' : ''
                      }`}
                      onClick={() => setExpandedId(expanded ? null : t.id)}
                    >
                      <td className="ft-td"><PriorityTag priority={t.priority} /></td>
                      <td className="ft-td">
                        <span className={overdue ? 'text-danger-600 font-medium' : 'text-ink-700'}>
                          {t.dueText}
                        </span>
                      </td>
                      <td className="ft-td">
                        {t.customerId ? (
                          <Link
                            to={`/customers/${t.customerId}`}
                            className="text-navy-700 hover:text-navy-900 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t.customerName}
                          </Link>
                        ) : (
                          <span className="text-ink-700">{t.customerName}</span>
                        )}
                      </td>
                      <td className="ft-td text-ink-700">{t.title}</td>
                      <td className="ft-td text-ink-700">{t.category}</td>
                      <td className="ft-td text-ink-700">{t.owner}</td>
                      <td className="ft-td"><StatusTag status={t.status} /></td>
                      <td className="ft-td">
                        <ChevronDown
                          size={14}
                          className={`text-ink-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-navy-50/40 border-b border-navy-100">
                        <td colSpan={8} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                              <p className="text-xs uppercase tracking-wide text-ink-500">事项详情</p>
                              <p className="mt-1 text-sm text-ink-700 leading-relaxed">{t.detail}</p>
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                                <CalendarClock size={14} />
                                <span>到期日 {t.dueDate}</span>
                                {t.overdueDays !== undefined && t.overdueDays > 0 && (
                                  <span className="text-danger-600">已逾期 {t.overdueDays} 天</span>
                                )}
                                {t.overdueDays !== undefined && t.overdueDays < 0 && (
                                  <span className="text-ok-600">还有 {-t.overdueDays} 天到期</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 md:items-end">
                              {t.status !== 'done' && (
                                <>
                                  <button
                                    className="ft-btn-primary text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setStatus(t.id, 'done')
                                    }}
                                  >
                                    标记已处理
                                  </button>
                                  <div className="flex gap-2">
                                    <button
                                      className="ft-btn-ghost text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setStatus(t.id, 'reminded')
                                      }}
                                    >
                                      标记已提醒
                                    </button>
                                    <button
                                      className="ft-btn-ghost text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setStatus(t.id, 'pending')
                                      }}
                                    >
                                      恢复待处理
                                    </button>
                                  </div>
                                </>
                              )}
                              {t.status === 'done' && (
                                <span className="ft-tag-green">该项已处理完毕</span>
                              )}
                              {t.customerId && (
                                <Link
                                  to={`/customers/${t.customerId}`}
                                  className="ft-btn-ghost text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  查看客户档案 <ArrowRight size={12} />
                                </Link>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick links */}
      <section>
        <h2 className="ft-h2 mb-3">快捷入口</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/customers', label: '客户档案', icon: Users, hint: '6 家在管客户' },
            { to: '/cash-flow', label: '账务流水', icon: Wallet, hint: '6 条未匹配流水' },
            { to: '/contracts', label: '合同往来', icon: FileText, hint: '9 份合同' },
            { to: '/logs', label: '操作记录', icon: ScrollText, hint: '最近 18 条' },
          ].map((q) => {
            const Icon = q.icon
            return (
              <Link
                key={q.to}
                to={q.to}
                className="ft-card p-4 hover:border-navy-300 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <ArrowRight size={14} className="text-ink-300 group-hover:text-navy-700 transition-colors" />
                </div>
                <div className="mt-3 text-sm font-semibold text-ink-900">{q.label}</div>
                <p className="text-[11px] text-ink-500">{q.hint}</p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Recent customers */}
      <Card title="在管客户一览" extra={<Link to="/customers" className="text-xs text-navy-600 hover:text-navy-800">查看全部 →</Link>}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {customers.map((c) => (
            <Link
              key={c.id}
              to={`/customers/${c.id}`}
              className="rounded-lg border border-navy-100 bg-white p-4 hover:border-navy-300 hover:bg-navy-50/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-900">{c.shortName}</span>
                <RiskDot level={c.risk} />
              </div>
              <p className="mt-1 text-[11px] text-ink-500">{c.industry} · {c.owner}</p>
              <p className="mt-2 text-xs text-ink-700 line-clamp-2">{c.memo}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}

function FilterBtn({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 transition-colors ${
        active ? 'bg-navy-800 text-white' : 'text-ink-500 hover:bg-navy-50'
      }`}
    >
      {label}
    </button>
  )
}

function RiskDot({ level }: { level: 'over' | 'high' | 'watch' | 'normal' }) {
  const map = {
    over: { label: '已超额', cls: 'bg-danger-500' },
    high: { label: '高风险', cls: 'bg-warn-500' },
    watch: { label: '关注', cls: 'bg-focus-500' },
    normal: { label: '正常', cls: 'bg-ok-500' },
  }
  const cfg = map[level]
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-500">
      <span className={`h-2 w-2 rounded-full ${cfg.cls}`} />
      {cfg.label}
    </span>
  )
}
