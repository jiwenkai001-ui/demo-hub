import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, Clock, Pause, Play } from 'lucide-react'
import { reminders as initialReminders } from '../data'
import type { Reminder } from '../data'
import { Card, PageHeader, Tag } from '../components/ui'

type StatusFilter = 'all' | 'open' | 'snoozed' | 'done'

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [level, setLevel] = useState<string>('all')

  const filtered = useMemo(() => {
    return reminders
      .filter((r) => {
        if (filter !== 'all' && r.status !== filter) return false
        if (level !== 'all' && r.level !== level) return false
        return true
      })
      .sort((a, b) => (a.dueAt < b.dueAt ? -1 : 1))
  }, [reminders, filter, level])

  const open = reminders.filter((r) => r.status === 'open').length
  const snoozed = reminders.filter((r) => r.status === 'snoozed').length
  const done = reminders.filter((r) => r.status === 'done').length
  const urgent = reminders.filter((r) => r.level === 'urgent' && r.status === 'open').length

  function setStatus(id: string, status: Reminder['status']) {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  return (
    <div>
      <PageHeader
        title="提醒中心"
        subtitle="系统按业务规则自动生成提醒，支持标记处理、推迟或转入客户档案跟进。"
        extra={
          <div className="text-xs text-ink-500">
            今日提醒 {reminders.length} 条 · 待处理 {open} 条
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="紧急待处理" value={`${urgent} 条`} tone="text-danger-600" icon={Bell} />
        <Stat label="待处理" value={`${open} 条`} tone="text-warn-600" icon={Clock} />
        <Stat label="已推迟" value={`${snoozed} 条`} tone="text-navy-800" icon={Pause} />
        <Stat label="已完成" value={`${done} 条`} tone="text-ok-600" icon={Check} />
      </div>

      <Card bodyClass="!p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-navy-100 p-4">
          <div className="flex items-center gap-1 text-xs">
            {([
              { v: 'all', l: `全部 ${reminders.length}` },
              { v: 'open', l: `待处理 ${open}` },
              { v: 'snoozed', l: `已推迟 ${snoozed}` },
              { v: 'done', l: `已完成 ${done}` },
            ] as const).map((f) => (
              <button
                key={f.v}
                onClick={() => setFilter(f.v)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  filter === f.v ? 'bg-navy-800 text-white' : 'text-ink-500 hover:bg-navy-50'
                }`}
              >
                {f.l}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs">
            {(['all', 'urgent', 'high', 'normal'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  level === l ? 'bg-navy-700 text-white' : 'text-ink-500 hover:bg-navy-50'
                }`}
              >
                {l === 'all' ? '全部级别' : l === 'urgent' ? '紧急' : l === 'high' ? '高' : '普通'}
              </button>
            ))}
          </div>
        </div>

        <ul className="divide-y divide-navy-50">
          {filtered.length === 0 && (
            <li className="py-12 text-center text-sm text-ink-500">暂无提醒</li>
          )}
          {filtered.map((r) => (
            <li key={r.id} className="p-4 hover:bg-navy-50/40">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-0.5 h-2 w-2 rounded-full ${
                    r.level === 'urgent' ? 'bg-danger-500' :
                    r.level === 'high' ? 'bg-warn-500' : 'bg-navy-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.level === 'urgent' && <Tag tone="red">紧急</Tag>}
                      {r.level === 'high' && <Tag tone="amber">高</Tag>}
                      {r.level === 'normal' && <Tag tone="gray">普通</Tag>}
                      <Tag tone="blue">{r.type}</Tag>
                      <span className="text-sm font-medium text-ink-900">{r.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-700">{r.detail}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-ink-500">
                      {r.customerName && (
                        <Link to={r.customerId ? `/customers/${r.customerId}` : '/customers'} className="text-navy-600 hover:underline">
                          {r.customerName}
                        </Link>
                      )}
                      <span>·</span>
                      <span>到期 {r.dueAt}</span>
                      <span>·</span>
                      <span>负责人 {r.owner}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.status === 'open' && (
                    <>
                      <button
                        onClick={() => setStatus(r.id, 'done')}
                        className="ft-btn-ghost text-xs text-ok-600 hover:bg-ok-50"
                      >
                        <Check size={12} /> 标记已处理
                      </button>
                      <button
                        onClick={() => setStatus(r.id, 'snoozed')}
                        className="ft-btn-ghost text-xs"
                      >
                        <Pause size={12} /> 推迟
                      </button>
                    </>
                  )}
                  {r.status === 'snoozed' && (
                    <>
                      <button
                        onClick={() => setStatus(r.id, 'open')}
                        className="ft-btn-ghost text-xs"
                      >
                        <Play size={12} /> 恢复
                      </button>
                      <button
                        onClick={() => setStatus(r.id, 'done')}
                        className="ft-btn-ghost text-xs text-ok-600 hover:bg-ok-50"
                      >
                        <Check size={12} /> 标记已处理
                      </button>
                    </>
                  )}
                  {r.status === 'done' && (
                    <Tag tone="green">已完成</Tag>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function Stat({ label, value, tone, icon: Icon }: { label: string; value: string; tone: string; icon: any }) {
  return (
    <div className="ft-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-500">{label}</span>
        <Icon size={16} className="text-navy-500" />
      </div>
      <div className={`mt-1 text-xl font-semibold ${tone}`}>{value}</div>
    </div>
  )
}
