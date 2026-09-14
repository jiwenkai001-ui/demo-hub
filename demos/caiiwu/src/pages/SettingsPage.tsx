import { useState } from 'react'
import { Check, Shield, SlidersHorizontal, User, Users } from 'lucide-react'
import { accounts, businessRules as initialRules } from '../data'
import type { BusinessRule } from '../data'
import { Card, PageHeader, Tag } from '../components/ui'

type Tab = 'account' | 'rules'

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('rules')
  const [rules, setRules] = useState<BusinessRule[]>(initialRules)

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  }

  const enabledCount = rules.filter((r) => r.enabled).length

  return (
    <div>
      <PageHeader
        title="系统设置"
        subtitle="维护团队成员账号与业务规则，控制提醒触发、风险阈值与归档策略。"
      />

      <div className="border-b border-navy-100 mb-5">
        <div className="flex items-center gap-1">
          {([
            { id: 'rules', label: '业务规则', icon: SlidersHorizontal },
            { id: 'account', label: '账号管理', icon: Users },
          ] as const).map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap rounded-t-md px-4 py-2 text-sm transition-colors flex items-center gap-1.5 ${
                  tab === t.id
                    ? 'bg-white border border-navy-100 border-b-white -mb-px text-navy-800 font-semibold'
                    : 'text-ink-500 hover:text-navy-700'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="规则总数" value={`${rules.length} 条`} />
            <Stat label="已启用" value={`${enabledCount} 条`} tone="text-ok-600" />
            <Stat label="已禁用" value={`${rules.length - enabledCount} 条`} tone="text-ink-500" />
            <Stat label="作用域" value="客户/账号" tone="text-navy-800" />
          </div>

          <Card title="业务规则列表" bodyClass="!p-0">
            <ul className="divide-y divide-navy-50">
              {rules.map((r) => (
                <li key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-ink-900">{r.name}</span>
                        <Tag tone="gray">{r.scope}</Tag>
                        {r.enabled ? <Tag tone="green">已启用</Tag> : <Tag tone="gray">已禁用</Tag>}
                      </div>
                      <p className="mt-1 text-xs text-ink-700 leading-relaxed">{r.description}</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={r.enabled}
                        onChange={() => toggleRule(r.id)}
                      />
                      <div className="relative w-10 h-5 bg-navy-200 rounded-full peer-checked:bg-navy-700 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5"></div>
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'account' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat label="团队账号" value={`${accounts.length} 个`} />
            <Stat label="在线账号" value={`${accounts.filter(a => a.status === 'active').length} 个`} tone="text-ok-600" />
            <Stat label="角色类型" value="2 种" tone="text-navy-800" />
          </div>

          <Card title="账号列表" bodyClass="!p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="border-b border-navy-100 bg-navy-50/40">
                    <th className="ft-th">账号</th>
                    <th className="ft-th">角色</th>
                    <th className="ft-th">邮箱</th>
                    <th className="ft-th">联系电话</th>
                    <th className="ft-th">最近登录</th>
                    <th className="ft-th">状态</th>
                    <th className="ft-th w-24">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id} className="ft-row-hover border-b border-navy-50 last:border-0">
                      <td className="ft-td">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
                            a.role === '系统管理员' ? 'bg-navy-800' : 'bg-navy-500'
                          }`}>
                            {a.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-ink-900">{a.name}</div>
                            <div className="text-[11px] text-ink-500 font-mono">{a.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="ft-td">
                        {a.role === '系统管理员' ? (
                          <Tag tone="amber"><Shield size={10} /> 管理员</Tag>
                        ) : (
                          <Tag tone="blue"><User size={10} /> 财务顾问</Tag>
                        )}
                      </td>
                      <td className="ft-td font-mono text-xs text-ink-700">{a.email}</td>
                      <td className="ft-td font-mono text-xs text-ink-700">{a.phone}</td>
                      <td className="ft-td font-mono text-xs text-ink-700">{a.lastLogin}</td>
                      <td className="ft-td">
                        {a.status === 'active' ? <Tag tone="green">在线</Tag> : <Tag tone="gray">离线</Tag>}
                      </td>
                      <td className="ft-td">
                        <button className="ft-btn-ghost text-xs">编辑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="角色权限">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <RoleCard
                name="系统管理员"
                desc="可访问全部 9 个模块，可维护账号与业务规则，可创建手动备份与导出操作记录。"
                perms={['全部 9 模块读写', '账号管理', '业务规则', '手动备份', '操作记录导出']}
              />
              <RoleCard
                name="财务顾问"
                desc="仅可见分配到的客户档案与对应合同、往来账、流水与提醒，无系统设置权限。"
                perms={['分配内客户档案', '合同/往来/流水', '提醒标记', '上传流水', '无系统设置']}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, tone = 'text-ink-900' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="ft-card p-4">
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${tone}`}>{value}</div>
    </div>
  )
}

function RoleCard({ name, desc, perms }: { name: string; desc: string; perms: string[] }) {
  return (
    <div className="rounded-lg border border-navy-100 bg-white p-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-ink-900">{name}</h3>
      </div>
      <p className="mt-1 text-xs text-ink-700">{desc}</p>
      <ul className="mt-3 space-y-1.5">
        {perms.map((p) => (
          <li key={p} className="flex items-center gap-1.5 text-xs text-ink-700">
            <Check size={12} className="text-ok-600" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  )
}
