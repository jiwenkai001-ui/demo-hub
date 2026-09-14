import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CircleSlash,
  Clock,
  FileText,
  Mail,
  MapPin,
  Phone,
  Wallet,
} from 'lucide-react'
import {
  cashFlowEntries,
  contracts,
  customers,
  ledgerEntries,
  reminders,
  todos,
  findCustomer,
} from '../data'
import {
  Card,
  Money,
  PageHeader,
  PriorityTag,
  RiskBadge,
  StatusTag,
  Tag,
} from '../components/ui'

type Tab = 'overview' | 'ledger' | 'cashflow' | 'contracts' | 'reminders' | 'todos'

export default function CustomerDetailPage() {
  const { id = '' } = useParams()
  const customer = findCustomer(id)
  const [tab, setTab] = useState<Tab>('overview')

  if (!customer) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-ink-500">未找到客户档案</p>
        <Link to="/customers" className="mt-3 inline-block text-sm text-navy-600 hover:underline">
          ← 返回客户档案
        </Link>
      </div>
    )
  }

  const customerContracts = contracts.filter((c) => c.customerId === customer.id)
  const customerLedger = ledgerEntries.filter((l) => l.customerId === customer.id)
  const customerFlow = cashFlowEntries.filter((f) => f.customerId === customer.id)
  const customerReminders = reminders.filter((r) => r.customerId === customer.id)
  const customerTodos = todos.filter((t) => t.customerId === customer.id)

  const receivedTotal = customerLedger
    .filter((l) => l.type === '实收')
    .reduce((sum, l) => sum + l.amount, 0)
  const payableTotal = customerLedger
    .filter((l) => l.type === '应收' && !l.matched)
    .reduce((sum, l) => sum + l.amount, 0)
  const unmatchedFlow = customerFlow.filter((f) => !f.matched).length

  return (
    <div>
      <button
        onClick={() => history.back()}
        className="mb-3 inline-flex items-center gap-1 text-xs text-ink-500 hover:text-navy-700"
      >
        <ArrowLeft size={14} /> 返回客户档案
      </button>

      <PageHeader
        title={customer.name}
        subtitle={`${customer.shortName} · ${customer.industry} · 负责人 ${customer.owner}`}
        extra={
          <div className="flex items-center gap-2">
            <RiskBadge level={customer.risk} />
            <Tag tone="blue">{customer.status === 'active' ? '在管中' : '已暂停'}</Tag>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <SummaryCard
          icon={Wallet}
          label="本月代账费"
          value={`¥${customer.monthlyFee.toLocaleString()}`}
          tone="text-navy-800"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="累计已收"
          value={`¥${receivedTotal.toLocaleString()}`}
          tone="text-ok-600"
        />
        <SummaryCard
          icon={Clock}
          label="待收余额"
          value={`¥${payableTotal.toLocaleString()}`}
          tone="text-warn-600"
        />
        <SummaryCard
          icon={CircleSlash}
          label="未匹配流水"
          value={`${unmatchedFlow} 条`}
          tone={unmatchedFlow > 0 ? 'text-danger-600' : 'text-ink-700'}
        />
      </div>

      {/* Memo */}
      <Card title="客户备忘" className="mb-5">
        <p className="text-sm text-ink-700 leading-relaxed">{customer.memo}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {customer.tags.map((t) => (
            <Tag key={t} tone="gray">{t}</Tag>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-navy-100 mb-5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'overview' as Tab, label: '基础档案' },
            { id: 'materials' as any, label: '资料清单' },
            { id: 'ledger' as Tab, label: `往来账 (${customerLedger.length})` },
            { id: 'cashflow' as Tab, label: `流水 (${customerFlow.length})` },
            { id: 'contracts' as Tab, label: `合同 (${customerContracts.length})` },
            { id: 'reminders' as Tab, label: `提醒 (${customerReminders.length})` },
            { id: 'todos' as Tab, label: `待办 (${customerTodos.length})` },
          ].map((t) => {
            const isActive = (t.id === 'materials' ? 'overview' : t.id) === tab || (t.id === 'materials' && tab === 'overview')
            return (
              <button
                key={t.id as string}
                onClick={() => setTab(t.id === 'materials' ? 'overview' : (t.id as Tab))}
                className={`whitespace-nowrap rounded-t-md px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-white border border-navy-100 border-b-white -mb-px text-navy-800 font-semibold'
                    : 'text-ink-500 hover:text-navy-700'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="企业基本信息">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm">
              <Field icon={Building2} label="客户编号" value={customer.id} />
              <Field icon={Building2} label="企业全称" value={customer.name} />
              <Field icon={Building2} label="简称" value={customer.shortName} />
              <Field icon={Building2} label="所属行业" value={customer.industry} />
              <Field icon={Building2} label="统一社会信用代码" value={customer.taxId} mono />
              <Field icon={MapPin} label="注册地址" value={customer.address} />
              <Field icon={Building2} label="开户银行" value={customer.bank} />
              <Field icon={Building2} label="银行账号" value={customer.bankAccount} mono />
              <Field icon={Clock} label="建档日期" value={customer.createdAt} />
              <Field icon={Clock} label="合同期限" value={`${customer.contractStart} ~ ${customer.contractEnd}`} />
              <Field icon={Wallet} label="月度代账费" value={`¥${customer.monthlyFee.toLocaleString()}`} />
              <Field icon={Wallet} label="当前余额" value={customer.balance === 0 ? '持平' : customer.balance > 0 ? `余额 ¥${customer.balance.toLocaleString()}` : `欠款 ¥${(-customer.balance).toLocaleString()}`} />
            </dl>
          </Card>

          <Card title="联系人信息">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm">
              <Field icon={Building2} label="联系人" value={customer.contact} />
              <Field icon={Phone} label="联系电话" value={customer.phone} mono />
              <Field icon={Mail} label="联系邮箱" value={customer.email} mono />
              <Field icon={Building2} label="是否欠票" value={customer.hasInvoiceGap ? '是，需补充进项发票台账' : '否'} />
              <Field icon={Building2} label="状态" value={customer.status === 'active' ? '在管中' : '已暂停'} />
              <Field icon={Clock} label="最近更新" value="2026-09-14" />
            </dl>

            <div className="mt-5 border-t border-navy-100 pt-4">
              <h3 className="ft-h2 mb-3">资料清单</h3>
              <ul className="space-y-2 text-sm">
                {customer.materials.map((m) => (
                  <li key={m.name} className="flex items-center justify-between">
                    <span className="text-ink-700">{m.name}</span>
                    {m.status === 'ok' && <Tag tone="green">齐全</Tag>}
                    {m.status === 'missing' && <Tag tone="red">缺失</Tag>}
                    {m.status === 'expired' && <Tag tone="amber">已过期</Tag>}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      )}

      {tab === 'ledger' && (
        <Card title={`${customer.shortName} 往来账`} bodyClass="!p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50/40">
                  <th className="ft-th">日期</th>
                  <th className="ft-th">类型</th>
                  <th className="ft-th">科目</th>
                  <th className="ft-th">金额</th>
                  <th className="ft-th">方式</th>
                  <th className="ft-th">备注</th>
                  <th className="ft-th">状态</th>
                </tr>
              </thead>
              <tbody>
                {customerLedger.map((l) => (
                  <tr key={l.id} className="ft-row-hover border-b border-navy-50 last:border-0">
                    <td className="ft-td text-ink-700 font-mono text-xs">{l.date}</td>
                    <td className="ft-td">
                      {l.type === '应收' && <Tag tone="amber">应收</Tag>}
                      {l.type === '实收' && <Tag tone="green">实收</Tag>}
                      {l.type === '应付' && <Tag tone="red">应付</Tag>}
                      {l.type === '实付' && <Tag tone="gray">实付</Tag>}
                    </td>
                    <td className="ft-td text-ink-700">{l.category}</td>
                    <td className="ft-td">
                      <Money value={l.type === '实收' || l.type === '应收' ? l.amount : -l.amount} />
                    </td>
                    <td className="ft-td text-ink-700">{l.method}</td>
                    <td className="ft-td text-ink-700">{l.memo}</td>
                    <td className="ft-td">
                      {l.matched ? <Tag tone="green">已匹配</Tag> : <Tag tone="amber">待匹配</Tag>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'cashflow' && (
        <Card title={`${customer.shortName} 银行流水`} bodyClass="!p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50/40">
                  <th className="ft-th">日期</th>
                  <th className="ft-th">银行</th>
                  <th className="ft-th">方向</th>
                  <th className="ft-th">金额</th>
                  <th className="ft-th">对方账户</th>
                  <th className="ft-th">备注</th>
                  <th className="ft-th">状态</th>
                </tr>
              </thead>
              <tbody>
                {customerFlow.map((f) => (
                  <tr key={f.id} className="ft-row-hover border-b border-navy-50 last:border-0">
                    <td className="ft-td text-ink-700 font-mono text-xs">{f.date}</td>
                    <td className="ft-td text-ink-700">{f.bank}</td>
                    <td className="ft-td">
                      {f.inOut === 'in' ? <Tag tone="green">入账</Tag> : <Tag tone="red">出账</Tag>}
                    </td>
                    <td className="ft-td">
                      <Money value={f.inOut === 'in' ? f.amount : -f.amount} sign />
                    </td>
                    <td className="ft-td text-ink-700">{f.counterparty}</td>
                    <td className="ft-td text-ink-700">{f.memo}</td>
                    <td className="ft-td">
                      {f.matched ? <Tag tone="green">已匹配</Tag> : <Tag tone="amber">未匹配</Tag>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'contracts' && (
        <Card title={`${customer.shortName} 合同`} bodyClass="!p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50/40">
                  <th className="ft-th">合同编号</th>
                  <th className="ft-th">类型</th>
                  <th className="ft-th">金额</th>
                  <th className="ft-th">周期</th>
                  <th className="ft-th">已收</th>
                  <th className="ft-th">下次收款</th>
                  <th className="ft-th">状态</th>
                </tr>
              </thead>
              <tbody>
                {customerContracts.map((c) => (
                  <tr key={c.id} className="ft-row-hover border-b border-navy-50 last:border-0">
                    <td className="ft-td font-mono text-xs text-ink-500">{c.no}</td>
                    <td className="ft-td text-ink-700">{c.type}</td>
                    <td className="ft-td"><Money value={c.amount} /></td>
                    <td className="ft-td text-ink-700 text-xs">{c.startAt} ~ {c.endAt}</td>
                    <td className="ft-td">
                      <Money value={c.received} />
                      <span className="ml-1 text-[11px] text-ink-500">/ {c.paymentCycle}</span>
                    </td>
                    <td className="ft-td text-ink-700 text-xs">{c.nextReceiveAt}</td>
                    <td className="ft-td">
                      {c.status === '进行中' && <Tag tone="blue">{c.status}</Tag>}
                      {c.status === '待续签' && <Tag tone="amber">{c.status}</Tag>}
                      {c.status === '已结束' && <Tag tone="gray">{c.status}</Tag>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'reminders' && (
        <Card title={`${customer.shortName} 提醒`} bodyClass="!p-0">
          <ul className="divide-y divide-navy-50">
            {customerReminders.length === 0 && (
              <li className="py-10 text-center text-sm text-ink-500">暂无提醒</li>
            )}
            {customerReminders.map((r) => (
              <li key={r.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {r.level === 'urgent' && <Tag tone="red">紧急</Tag>}
                    {r.level === 'high' && <Tag tone="amber">高</Tag>}
                    {r.level === 'normal' && <Tag tone="gray">普通</Tag>}
                    <span className="text-sm font-medium text-ink-900">{r.title}</span>
                  </div>
                  <span className="text-xs text-ink-500">到期 {r.dueAt}</span>
                </div>
                <p className="mt-1 text-xs text-ink-700">{r.detail}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-500">
                  <span>类型：{r.type}</span>
                  <span>负责人：{r.owner}</span>
                  <span>
                    状态：
                    {r.status === 'open' && '待处理'}
                    {r.status === 'snoozed' && '已推迟'}
                    {r.status === 'done' && '已完成'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'todos' && (
        <Card title={`${customer.shortName} 待办`} bodyClass="!p-0">
          <ul className="divide-y divide-navy-50">
            {customerTodos.length === 0 && (
              <li className="py-10 text-center text-sm text-ink-500">暂无待办</li>
            )}
            {customerTodos.map((t) => (
              <li key={t.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PriorityTag priority={t.priority} />
                    <span className="text-sm font-medium text-ink-900">{t.title}</span>
                  </div>
                  <StatusTag status={t.status} />
                </div>
                <p className="mt-1 text-xs text-ink-700">{t.detail}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-500">
                  <span>类别：{t.category}</span>
                  <span>到期：{t.dueDate}</span>
                  <span>负责人：{t.owner}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="ft-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-500">{label}</span>
        <Icon size={16} className="text-navy-500" />
      </div>
      <div className={`mt-2 text-xl font-semibold ${tone}`}>{value}</div>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: any
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="mt-0.5 text-navy-500" />
      <div>
        <dt className="text-[11px] text-ink-500">{label}</dt>
        <dd className={`text-sm text-ink-900 ${mono ? 'font-mono' : ''}`}>{value}</dd>
      </div>
    </div>
  )
}
