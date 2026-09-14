import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Plus, Search } from 'lucide-react'
import { customers, ledgerEntries } from '../data'
import { Card, Money, PageHeader, Tag } from '../components/ui'

export default function CurrentAccountPage() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState<string>('all')
  const [matched, setMatched] = useState<string>('all')

  const filtered = useMemo(() => {
    return ledgerEntries
      .filter((l) => {
        if (type !== 'all' && l.type !== type) return false
        if (matched !== 'all' && (matched === 'matched') !== l.matched) return false
        if (search && !l.customerName.includes(search) && !l.memo.includes(search)) return false
        return true
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [search, type, matched])

  const totalReceivable = ledgerEntries
    .filter((l) => l.type === '应收' && !l.matched)
    .reduce((s, l) => s + l.amount, 0)
  const totalReceived = ledgerEntries
    .filter((l) => l.type === '实收')
    .reduce((s, l) => s + l.amount, 0)
  const totalPayable = ledgerEntries
    .filter((l) => l.type === '应付')
    .reduce((s, l) => s + l.amount, 0)
  const unmatched = ledgerEntries.filter((l) => !l.matched).length

  // 按客户聚合
  const byCustomer = useMemo(() => {
    const map = new Map<string, { name: string; receivable: number; received: number; payable: number; unmatched: number }>()
    ledgerEntries.forEach((l) => {
      const cur = map.get(l.customerId) ?? { name: l.customerName, receivable: 0, received: 0, payable: 0, unmatched: 0 }
      if (l.type === '应收') cur.receivable += l.amount
      if (l.type === '实收') cur.received += l.amount
      if (l.type === '应付') cur.payable += l.amount
      if (!l.matched) cur.unmatched += 1
      map.set(l.customerId, cur)
    })
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }))
  }, [])

  return (
    <div>
      <PageHeader
        title="经营往来账"
        subtitle="代账费、工本费、税务罚金等应收应付明细，按客户汇总并跟踪匹配状态。"
        extra={
          <div className="flex gap-2">
            <button className="ft-btn-ghost"><Download size={14} /> 导出往来账</button>
            <button className="ft-btn-primary"><Plus size={14} /> 登记往来</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="应收待收" value={`¥${totalReceivable.toLocaleString()}`} tone="text-warn-600" />
        <Stat label="累计已收" value={`¥${totalReceived.toLocaleString()}`} tone="text-ok-600" />
        <Stat label="应付待付" value={`¥${totalPayable.toLocaleString()}`} tone="text-danger-600" />
        <Stat label="未匹配条目" value={`${unmatched} 条`} tone="text-navy-800" />
      </div>

      <Card title="按客户汇总" className="mb-5" bodyClass="!p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/40">
                <th className="ft-th">客户</th>
                <th className="ft-th">应收累计</th>
                <th className="ft-th">实收累计</th>
                <th className="ft-th">应付累计</th>
                <th className="ft-th">净额</th>
                <th className="ft-th">未匹配</th>
              </tr>
            </thead>
            <tbody>
              {byCustomer.map((c) => {
                const net = c.received - c.receivable - c.payable
                return (
                  <tr key={c.id} className="ft-row-hover border-b border-navy-50 last:border-0">
                    <td className="ft-td">
                      <Link to={`/customers/${c.id}`} className="font-medium text-navy-700 hover:text-navy-900 hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="ft-td"><Money value={c.receivable} /></td>
                    <td className="ft-td text-ok-600"><Money value={c.received} /></td>
                    <td className="ft-td text-danger-600"><Money value={c.payable} /></td>
                    <td className={`ft-td ${net >= 0 ? 'text-ok-600' : 'text-warn-600'}`}>
                      <Money value={net} sign />
                    </td>
                    <td className="ft-td">
                      {c.unmatched > 0 ? <Tag tone="amber">{c.unmatched} 条</Tag> : <Tag tone="green">已匹配</Tag>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="往来明细" bodyClass="!p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-navy-100 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索客户名称或备注"
              className="ft-input pl-9"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-xs text-ink-700 focus:border-navy-500 focus:outline-none"
          >
            <option value="all">全部类型</option>
            <option value="应收">应收</option>
            <option value="实收">实收</option>
            <option value="应付">应付</option>
            <option value="实付">实付</option>
          </select>
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
                <th className="ft-th">类型</th>
                <th className="ft-th">科目</th>
                <th className="ft-th">金额</th>
                <th className="ft-th">方式</th>
                <th className="ft-th">备注</th>
                <th className="ft-th">状态</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="ft-row-hover border-b border-navy-50 last:border-0">
                  <td className="ft-td font-mono text-xs text-ink-700">{l.date}</td>
                  <td className="ft-td">
                    <Link to={`/customers/${l.customerId}`} className="text-navy-700 hover:text-navy-900 hover:underline">
                      {l.customerName}
                    </Link>
                  </td>
                  <td className="ft-td">
                    {l.type === '应收' && <Tag tone="amber">应收</Tag>}
                    {l.type === '实收' && <Tag tone="green">实收</Tag>}
                    {l.type === '应付' && <Tag tone="red">应付</Tag>}
                    {l.type === '实付' && <Tag tone="gray">实付</Tag>}
                  </td>
                  <td className="ft-td text-ink-700">{l.category}</td>
                  <td className="ft-td">
                    <Money value={l.type === '应收' || l.type === '实收' ? l.amount : -l.amount} />
                  </td>
                  <td className="ft-td text-ink-700 text-xs">{l.method}</td>
                  <td className="ft-td text-ink-700">{l.memo}</td>
                  <td className="ft-td">
                    {l.matched ? <Tag tone="green">已匹配</Tag> : <Tag tone="amber">待匹配</Tag>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-ink-500">未找到符合条件的往来明细</div>
        )}
      </Card>
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
