import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  Check,
  Download,
  Search,
  Upload,
  X,
} from 'lucide-react'
import { cashFlowEntries, customers } from '../data'
import type { CashFlowEntry } from '../data'
import { Card, Money, PageHeader, Tag } from '../components/ui'

export default function CashFlowPage() {
  const [entries, setEntries] = useState<CashFlowEntry[]>(cashFlowEntries)
  const [search, setSearch] = useState('')
  const [direction, setDirection] = useState<string>('all')
  const [matched, setMatched] = useState<string>('all')

  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        if (direction !== 'all' && e.inOut !== direction) return false
        if (matched !== 'all' && (matched === 'matched') !== e.matched) return false
        if (search && !e.customerName.includes(search) && !e.counterparty.includes(search) && !e.memo.includes(search)) return false
        return true
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [entries, search, direction, matched])

  const totalIn = entries.filter((e) => e.inOut === 'in').reduce((s, e) => s + e.amount, 0)
  const totalOut = entries.filter((e) => e.inOut === 'out').reduce((s, e) => s + e.amount, 0)
  const unmatchedCount = entries.filter((e) => !e.matched).length
  const matchedCount = entries.filter((e) => e.matched).length
  const progress = (matchedCount / entries.length) * 100

  function toggleMatch(id: string) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, matched: !e.matched } : e)))
  }

  return (
    <div>
      <PageHeader
        title="账务流水"
        subtitle="客户银行流水对账：按客户匹配应收/应付明细，统一季度对账节点。"
        extra={
          <div className="flex gap-2">
            <button className="ft-btn-ghost"><Download size={14} /> 导出</button>
            <button className="ft-btn-primary"><Upload size={14} /> 上传流水</button>
          </div>
        }
      />

      {/* Quarterly reconciliation banner */}
      <div className="rounded-card bg-navy-900 text-white p-5 mb-5 shadow-card relative overflow-hidden">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-navy-700 flex items-center justify-center">
              <CalendarClock size={18} className="text-gold-400" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-navy-300">下个统一节点</div>
              <div className="mt-0.5 text-base font-semibold text-gold-400">三季度银行对账</div>
              <div className="mt-1 text-xs text-navy-200">
                截止 2026-10-10 · 按客户流水完成本季度核对
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[11px] text-navy-300">总流水</div>
              <div className="text-lg font-semibold">{entries.length} 条</div>
            </div>
            <div>
              <div className="text-[11px] text-navy-300">已匹配</div>
              <div className="text-lg font-semibold text-ok-500">{matchedCount} 条</div>
            </div>
            <div>
              <div className="text-[11px] text-navy-300">未匹配</div>
              <div className="text-lg font-semibold text-warn-400">{unmatchedCount} 条</div>
            </div>
            <div className="w-40">
              <div className="flex items-center justify-between text-[11px] text-navy-300 mb-1">
                <span>对账进度</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                <div className="h-full bg-gold-400" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="流入合计" value={`¥${totalIn.toLocaleString()}`} tone="text-ok-600" />
        <Stat label="流出合计" value={`¥${totalOut.toLocaleString()}`} tone="text-danger-600" />
        <Stat label="净额" value={`¥${(totalIn - totalOut).toLocaleString()}`} tone="text-navy-800" />
        <Stat label="未匹配" value={`${unmatchedCount} 条`} tone="text-warn-600" />
      </div>

      <Card title="流水明细" bodyClass="!p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-navy-100 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索客户、对方账户或备注"
              className="ft-input pl-9"
            />
          </div>
          <div className="flex items-center gap-1 text-xs">
            {[
              { v: 'all', l: '全部方向' },
              { v: 'in', l: '入账' },
              { v: 'out', l: '出账' },
            ].map((m) => (
              <button
                key={m.v}
                onClick={() => setDirection(m.v)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  direction === m.v ? 'bg-navy-800 text-white' : 'text-ink-500 hover:bg-navy-50'
                }`}
              >
                {m.l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs">
            {[
              { v: 'all', l: '全部' },
              { v: 'matched', l: '已匹配' },
              { v: 'unmatched', l: '未匹配' },
            ].map((m) => (
              <button
                key={m.v}
                onClick={() => setMatched(m.v)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  matched === m.v ? 'bg-navy-800 text-white' : 'text-ink-500 hover:bg-navy-50'
                }`}
              >
                {m.l}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/40">
                <th className="ft-th">日期</th>
                <th className="ft-th">客户</th>
                <th className="ft-th">银行</th>
                <th className="ft-th">方向</th>
                <th className="ft-th">金额</th>
                <th className="ft-th">对方账户</th>
                <th className="ft-th">备注</th>
                <th className="ft-th">状态</th>
                <th className="ft-th w-24">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="ft-row-hover border-b border-navy-50 last:border-0">
                  <td className="ft-td font-mono text-xs text-ink-700">{e.date}</td>
                  <td className="ft-td">
                    <Link to={`/customers/${e.customerId}`} className="text-navy-700 hover:text-navy-900 hover:underline">
                      {e.customerName}
                    </Link>
                  </td>
                  <td className="ft-td text-ink-700 text-xs">{e.bank}</td>
                  <td className="ft-td">
                    {e.inOut === 'in' ? <Tag tone="green">入账</Tag> : <Tag tone="red">出账</Tag>}
                  </td>
                  <td className="ft-td">
                    <Money value={e.inOut === 'in' ? e.amount : -e.amount} sign />
                  </td>
                  <td className="ft-td text-ink-700 text-xs">{e.counterparty}</td>
                  <td className="ft-td text-ink-700 text-xs">{e.memo}</td>
                  <td className="ft-td">
                    {e.matched ? <Tag tone="green">已匹配</Tag> : <Tag tone="amber">未匹配</Tag>}
                  </td>
                  <td className="ft-td">
                    <button
                      onClick={() => toggleMatch(e.id)}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                        e.matched
                          ? 'text-ink-500 hover:bg-navy-50'
                          : 'text-ok-600 hover:bg-ok-50'
                      }`}
                    >
                      {e.matched ? <><X size={12} />取消</> : <><Check size={12} />匹配</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-ink-500">未找到符合条件的流水</div>
        )}
      </Card>

      <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
        <span>当前账号可见 6 家客户的银行流水数据</span>
        <Link to="/import" className="inline-flex items-center gap-1 text-navy-600 hover:text-navy-800">
          前往导入与备份 <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="ft-card p-4">
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${tone}`}>{value}</div>
    </div>
  )
}
