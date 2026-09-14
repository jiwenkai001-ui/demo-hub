import { useMemo, useState } from 'react'
import { Download, Search, ScrollText, Filter, XCircle, CheckCircle2 } from 'lucide-react'
import { operationLogs } from '../data'
import { Card, PageHeader, Tag } from '../components/ui'

export default function OperationLogPage() {
  const [search, setSearch] = useState('')
  const [actor, setActor] = useState<string>('all')
  const [module, setModule] = useState<string>('all')
  const [result, setResult] = useState<string>('all')

  const actors = useMemo(() => Array.from(new Set(operationLogs.map((l) => l.actor))), [])
  const modules = useMemo(() => Array.from(new Set(operationLogs.map((l) => l.module))), [])

  const filtered = useMemo(() => {
    return operationLogs
      .filter((l) => {
        if (actor !== 'all' && l.actor !== actor) return false
        if (module !== 'all' && l.module !== module) return false
        if (result !== 'all' && l.result !== result) return false
        if (search && !l.action.includes(search) && !l.target.includes(search) && !l.module.includes(search)) return false
        return true
      })
      .sort((a, b) => (a.at < b.at ? 1 : -1))
  }, [search, actor, module, result])

  const success = operationLogs.filter((l) => l.result === '成功').length
  const failed = operationLogs.filter((l) => l.result === '失败').length

  return (
    <div>
      <PageHeader
        title="操作记录"
        subtitle="系统对关键操作进行审计，按操作人、模块、结果筛选，可下载归档。"
        extra={
          <button className="ft-btn-ghost">
            <Download size={14} /> 导出操作记录
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat icon={ScrollText} label="总记录数" value={`${operationLogs.length} 条`} />
        <Stat icon={CheckCircle2} label="成功" value={`${success} 条`} tone="text-ok-600" />
        <Stat icon={XCircle} label="失败" value={`${failed} 条`} tone="text-danger-600" />
        <Stat icon={Filter} label="筛选结果" value={`${filtered.length} 条`} tone="text-navy-800" />
      </div>

      <Card title="审计明细" bodyClass="!p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-navy-100 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索操作内容或对象"
              className="ft-input pl-9"
            />
          </div>
          <select
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-xs text-ink-700 focus:border-navy-500 focus:outline-none"
          >
            <option value="all">所有操作人</option>
            {actors.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-xs text-ink-700 focus:border-navy-500 focus:outline-none"
          >
            <option value="all">所有模块</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 text-xs">
            {[
              { v: 'all', l: '全部' },
              { v: '成功', l: '成功' },
              { v: '失败', l: '失败' },
            ].map((r) => (
              <button
                key={r.v}
                onClick={() => setResult(r.v)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  result === r.v ? 'bg-navy-800 text-white' : 'text-ink-500 hover:bg-navy-50'
                }`}
              >
                {r.l}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/40">
                <th className="ft-th">时间</th>
                <th className="ft-th">操作人</th>
                <th className="ft-th">模块</th>
                <th className="ft-th">操作</th>
                <th className="ft-th">对象</th>
                <th className="ft-th">IP</th>
                <th className="ft-th">结果</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="ft-row-hover border-b border-navy-50 last:border-0">
                  <td className="ft-td font-mono text-xs text-ink-700">{l.at}</td>
                  <td className="ft-td">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-navy-100 flex items-center justify-center text-[10px] font-semibold text-navy-700">
                        {l.actor.slice(0, 1)}
                      </div>
                      <span className="text-ink-900">{l.actor}</span>
                    </div>
                  </td>
                  <td className="ft-td"><Tag tone="blue">{l.module}</Tag></td>
                  <td className="ft-td text-ink-700">{l.action}</td>
                  <td className="ft-td text-ink-700 text-xs">{l.target}</td>
                  <td className="ft-td font-mono text-xs text-ink-500">{l.ip}</td>
                  <td className="ft-td">
                    {l.result === '成功' ? <Tag tone="green">成功</Tag> : <Tag tone="red">失败</Tag>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-ink-500">未找到符合条件的操作记录</div>
        )}
      </Card>
    </div>
  )
}

function Stat({ icon: Icon, label, value, tone = 'text-ink-900' }: { icon: any; label: string; value: string; tone?: string }) {
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
