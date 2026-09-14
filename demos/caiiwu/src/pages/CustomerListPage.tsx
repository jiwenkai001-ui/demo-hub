import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react'
import { customers } from '../data'
import { Card, PageHeader, RiskBadge } from '../components/ui'

const riskFilters = [
  { value: 'all', label: '全部' },
  { value: 'over', label: '已超额' },
  { value: 'high', label: '高风险' },
  { value: 'watch', label: '关注' },
  { value: 'normal', label: '正常' },
] as const

export default function CustomerListPage() {
  const [risk, setRisk] = useState<string>('all')
  const [owner, setOwner] = useState<string>('all')
  const [search, setSearch] = useState('')

  const owners = useMemo(() => Array.from(new Set(customers.map((c) => c.owner))), [])

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (risk !== 'all' && c.risk !== risk) return false
      if (owner !== 'all' && c.owner !== owner) return false
      if (search && !c.name.includes(search) && !c.shortName.includes(search)) return false
      return true
    })
  }, [risk, owner, search])

  const countByRisk = {
    over: customers.filter((c) => c.risk === 'over').length,
    high: customers.filter((c) => c.risk === 'high').length,
    watch: customers.filter((c) => c.risk === 'watch').length,
    normal: customers.filter((c) => c.risk === 'normal').length,
  }

  return (
    <div>
      <PageHeader
        title="客户档案"
        subtitle="在管 6 家客户的基础档案、风险等级与负责人负载一览。"
        extra={
          <button className="ft-btn-primary">
            <SlidersHorizontal size={14} /> 新建客户档案
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="已超额" value={countByRisk.over} tone="text-danger-600" />
        <StatCard label="高风险" value={countByRisk.high} tone="text-warn-600" />
        <StatCard label="关注" value={countByRisk.watch} tone="text-focus-500" />
        <StatCard label="正常" value={countByRisk.normal} tone="text-ok-600" />
      </div>

      <Card bodyClass="!p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-navy-100 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索客户名称或简称"
              className="ft-input pl-9"
            />
          </div>
          <div className="flex items-center gap-1 text-xs">
            {riskFilters.map((r) => (
              <button
                key={r.value}
                onClick={() => setRisk(r.value)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  risk === r.value ? 'bg-navy-800 text-white' : 'text-ink-500 hover:bg-navy-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-xs text-ink-700 focus:border-navy-500 focus:outline-none"
          >
            <option value="all">所有负责人</option>
            {owners.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/40">
                <th className="ft-th">客户编号</th>
                <th className="ft-th">客户名称</th>
                <th className="ft-th">行业</th>
                <th className="ft-th">负责人</th>
                <th className="ft-th">月费</th>
                <th className="ft-th">合同期限</th>
                <th className="ft-th">风险</th>
                <th className="ft-th w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="ft-row-hover border-b border-navy-50 last:border-0">
                  <td className="ft-td font-mono text-xs text-ink-500">{c.id}</td>
                  <td className="ft-td">
                    <Link to={`/customers/${c.id}`} className="font-medium text-navy-700 hover:text-navy-900 hover:underline">
                      {c.name}
                    </Link>
                    <div className="text-[11px] text-ink-500">{c.shortName}</div>
                  </td>
                  <td className="ft-td text-ink-700">{c.industry}</td>
                  <td className="ft-td text-ink-700">{c.owner}</td>
                  <td className="ft-td text-ink-700 font-mono">¥{c.monthlyFee.toLocaleString()}</td>
                  <td className="ft-td text-ink-700 text-xs">{c.contractStart} ~ {c.contractEnd}</td>
                  <td className="ft-td"><RiskBadge level={c.risk} /></td>
                  <td className="ft-td">
                    <Link to={`/customers/${c.id}`} className="text-navy-600 hover:text-navy-800">
                      <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-ink-500">未找到符合条件的客户档案</div>
        )}
      </Card>
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="ft-card p-4">
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</div>
      <div className="text-[11px] text-ink-500">家客户</div>
    </div>
  )
}
