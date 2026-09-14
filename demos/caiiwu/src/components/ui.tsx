import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function PageHeader({
  title,
  subtitle,
  extra,
}: {
  title: string
  subtitle?: string
  extra?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-5">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {extra && <div className="flex items-center gap-2">{extra}</div>}
    </div>
  )
}

export function Card({
  title,
  extra,
  children,
  className = '',
  bodyClass = '',
}: {
  title?: ReactNode
  extra?: ReactNode
  children: ReactNode
  className?: string
  bodyClass?: string
}) {
  return (
    <section className={`ft-card ${className}`}>
      {(title || extra) && (
        <header className="flex items-center justify-between border-b border-navy-100 px-5 py-3">
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          {extra}
        </header>
      )}
      <div className={`p-5 ${bodyClass}`}>{children}</div>
    </section>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="h-10 w-10 rounded-full bg-navy-50 text-navy-500 flex items-center justify-center text-xl">
        ·
      </div>
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {hint && <p className="text-xs text-ink-500">{hint}</p>}
    </div>
  )
}

export function Tag({
  tone,
  children,
}: {
  tone: 'red' | 'amber' | 'blue' | 'green' | 'gray'
  children: ReactNode
}) {
  const map = {
    red: 'ft-tag-red',
    amber: 'ft-tag-amber',
    blue: 'ft-tag-blue',
    green: 'ft-tag-green',
    gray: 'ft-tag-gray',
  }
  return <span className={map[tone]}>{children}</span>
}

export function RiskBadge({ level }: { level: 'over' | 'high' | 'watch' | 'normal' }) {
  const map = {
    over: { label: '已超额', tone: 'red' as const },
    high: { label: '高风险', tone: 'amber' as const },
    watch: { label: '关注', tone: 'blue' as const },
    normal: { label: '正常', tone: 'green' as const },
  }
  const cfg = map[level]
  return <Tag tone={cfg.tone}>{cfg.label}</Tag>
}

export function PriorityTag({ priority }: { priority: 'urgent' | 'high' | 'normal' }) {
  const map = {
    urgent: { label: '紧急', tone: 'red' as const },
    high: { label: '高', tone: 'amber' as const },
    normal: { label: '普通', tone: 'gray' as const },
  }
  const cfg = map[priority]
  return <Tag tone={cfg.tone}>{cfg.label}</Tag>
}

export function StatusTag({ status }: { status: 'pending' | 'reminded' | 'done' }) {
  const map = {
    pending: { label: '待处理', tone: 'gray' as const },
    reminded: { label: '已提醒', tone: 'amber' as const },
    done: { label: '已处理', tone: 'green' as const },
  }
  const cfg = map[status]
  return <Tag tone={cfg.tone}>{cfg.label}</Tag>
}

export function Table({ columns, rows }: { columns: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr className="border-b border-navy-100">
            {columns.map((col, idx) => (
              <th key={idx} className="ft-th">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="ft-row-hover border-b border-navy-50 last:border-0">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="ft-td">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Money({ value, sign }: { value: number; sign?: boolean }) {
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const prefix = value < 0 ? '-' : sign ? '+' : ''
  return <span className="font-mono">{`${prefix}${formatted}`}</span>
}

export function LinkButton({
  to,
  children,
  variant = 'ghost',
}: {
  to: string
  children: ReactNode
  variant?: 'primary' | 'ghost'
}) {
  const cls = variant === 'primary' ? 'ft-btn-primary' : 'ft-btn-ghost'
  return (
    <Link to={to} className={cls}>
      {children}
    </Link>
  )
}

export function KBD({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-navy-200 bg-navy-50 px-1.5 py-0.5 font-mono text-[10px] text-ink-700">
      {children}
    </kbd>
  )
}
