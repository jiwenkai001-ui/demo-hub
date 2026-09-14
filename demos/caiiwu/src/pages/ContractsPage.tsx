import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileText, Plus, Search } from 'lucide-react'
import { contracts, customers } from '../data'
import { Card, Money, PageHeader, Tag } from '../components/ui'

export default function ContractsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (status !== 'all' && c.status !== status) return false
      if (search && !c.customerName.includes(search) && !c.no.includes(search)) return false
      return true
    })
  }, [search, status])

  const totalSigned = contracts.reduce((s, c) => s + c.amount, 0)
  const totalReceived = contracts.reduce((s, c) => s + c.received, 0)
  const totalReceivable = totalSigned - totalReceived
  const activeCount = contracts.filter((c) => c.status === '进行中').length

  return (
    <div>
      <PageHeader
        title="合同往来"
        subtitle="6 家在管客户共 9 份合同，跟踪签约金额、收款进度与续签节点。"
        extra={
          <div className="flex gap-2">
            <button className="ft-btn-ghost"><Download size={14} /> 导出台账</button>
            <button className="ft-btn-primary"><Plus size={14} /> 新建合同</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="合同总数" value={`${contracts.length} 份`} hint={`其中 ${activeCount} 份进行中`} />
        <Stat label="签约总额" value={`¥${totalSigned.toLocaleString()}`} hint="累计签约金额" />
        <Stat label="累计已收" value={`¥${totalReceived.toLocaleString()}`} hint={`占比 ${((totalReceived / totalSigned) * 100).toFixed(1)}%`} tone="text-ok-600" />
        <Stat label="待收余额" value={`¥${totalReceivable.toLocaleString()}`} hint="待收款合计" tone="text-warn-600" />
      </div>

      <Card bodyClass="!p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-navy-100 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索合同编号或客户名称"
              className="ft-input pl-9"
            />
          </div>
          <div className="flex items-center gap-1 text-xs">
            {['all', '进行中', '待续签', '已结束'].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  status === s ? 'bg-navy-800 text-white' : 'text-ink-500 hover:bg-navy-50'
                }`}
              >
                {s === 'all' ? '全部' : s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/40">
                <th className="ft-th">合同编号</th>
                <th className="ft-th">客户</th>
                <th className="ft-th">类型</th>
                <th className="ft-th">签约金额</th>
                <th className="ft-th">已收</th>
                <th className="ft-th">收款进度</th>
                <th className="ft-th">付款周期</th>
                <th className="ft-th">下次收款</th>
                <th className="ft-th">合同期限</th>
                <th className="ft-th">状态</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const pct = (c.received / c.amount) * 100
                const customer = customers.find((x) => x.id === c.customerId)
                return (
                  <tr key={c.id} className="ft-row-hover border-b border-navy-50 last:border-0">
                    <td className="ft-td font-mono text-xs text-ink-500">
                      <FileText size={12} className="inline mr-1 text-navy-500" />
                      {c.no}
                    </td>
                    <td className="ft-td">
                      <Link to={`/customers/${c.customerId}`} className="font-medium text-navy-700 hover:text-navy-900 hover:underline">
                        {c.customerName}
                      </Link>
                      {customer && (
                        <div className="text-[11px] text-ink-500">{customer.owner}</div>
                      )}
                    </td>
                    <td className="ft-td text-ink-700">{c.type}</td>
                    <td className="ft-td"><Money value={c.amount} /></td>
                    <td className="ft-td"><Money value={c.received} /></td>
                    <td className="ft-td w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-navy-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${pct === 100 ? 'bg-ok-500' : 'bg-navy-700'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-ink-500">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="ft-td text-ink-700 text-xs">{c.paymentCycle}</td>
                    <td className="ft-td text-ink-700 text-xs">{c.nextReceiveAt}</td>
                    <td className="ft-td text-ink-700 text-xs">{c.startAt} ~ {c.endAt}</td>
                    <td className="ft-td">
                      {c.status === '进行中' && <Tag tone="blue">{c.status}</Tag>}
                      {c.status === '待续签' && <Tag tone="amber">{c.status}</Tag>}
                      {c.status === '已结束' && <Tag tone="gray">{c.status}</Tag>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-ink-500">未找到符合条件的合同</div>
        )}
      </Card>
    </div>
  )
}

function Stat({ label, value, hint, tone = 'text-ink-900' }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="ft-card p-4">
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${tone}`}>{value}</div>
      {hint && <div className="text-[11px] text-ink-500">{hint}</div>}
    </div>
  )
}
