import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Play,
  Upload,
} from 'lucide-react'
import { backups, importTasks } from '../data'
import { Card, PageHeader, Tag } from '../components/ui'

type Tab = 'import' | 'backup'

export default function ImportBackupPage() {
  const [tab, setTab] = useState<Tab>('import')

  const total = importTasks.length
  const done = importTasks.filter((t) => t.status === '已完成').length
  const pending = importTasks.filter((t) => t.status === '待匹配').length
  const processing = importTasks.filter((t) => t.status === '进行中').length

  return (
    <div>
      <PageHeader
        title="导入与备份"
        subtitle="批量导入客户清单、合同台账、银行流水与开票明细，按需创建全量/手动备份。"
        extra={
          <div className="flex gap-2">
            <button className="ft-btn-ghost"><Download size={14} /> 下载模板</button>
            <button className="ft-btn-primary"><Upload size={14} /> 上传文件</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat icon={FileSpreadsheet} label="导入任务" value={`${total} 个`} />
        <Stat icon={CheckCircle2} label="已完成" value={`${done} 个`} tone="text-ok-600" />
        <Stat icon={AlertCircle} label="待匹配" value={`${pending} 个`} tone="text-warn-600" />
        <Stat icon={Play} label="进行中" value={`${processing} 个`} tone="text-navy-800" />
      </div>

      <div className="border-b border-navy-100 mb-5">
        <div className="flex items-center gap-1">
          {([
            { id: 'import', label: '导入任务' },
            { id: 'backup', label: '数据备份' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-t-md px-4 py-2 text-sm transition-colors ${
                tab === t.id
                  ? 'bg-white border border-navy-100 border-b-white -mb-px text-navy-800 font-semibold'
                  : 'text-ink-500 hover:text-navy-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'import' && (
        <Card title="导入历史" bodyClass="!p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50/40">
                  <th className="ft-th">文件名</th>
                  <th className="ft-th">来源</th>
                  <th className="ft-th">上传时间</th>
                  <th className="ft-th">上传人</th>
                  <th className="ft-th">总行数</th>
                  <th className="ft-th">已匹配</th>
                  <th className="ft-th">未匹配</th>
                  <th className="ft-th">进度</th>
                  <th className="ft-th">状态</th>
                </tr>
              </thead>
              <tbody>
                {importTasks.map((t) => {
                  const pct = t.totalRows > 0 ? (t.matchedRows / t.totalRows) * 100 : 0
                  return (
                    <tr key={t.id} className="ft-row-hover border-b border-navy-50 last:border-0">
                      <td className="ft-td">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-navy-500" />
                          <span className="text-ink-900 text-xs">{t.fileName}</span>
                        </div>
                        {t.notes && <div className="mt-0.5 text-[11px] text-ink-500">{t.notes}</div>}
                      </td>
                      <td className="ft-td"><Tag tone="blue">{t.source}</Tag></td>
                      <td className="ft-td font-mono text-xs text-ink-700">{t.uploadedAt}</td>
                      <td className="ft-td text-ink-700">{t.uploadedBy}</td>
                      <td className="ft-td text-ink-700 font-mono">{t.totalRows}</td>
                      <td className="ft-td text-ok-600 font-mono">{t.matchedRows}</td>
                      <td className="ft-td text-warn-600 font-mono">{t.unmatchedRows}</td>
                      <td className="ft-td w-32">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-navy-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${pct === 100 ? 'bg-ok-500' : pct > 0 ? 'bg-navy-700' : 'bg-warn-500'}`}
                              style={{ width: `${pct || 5}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-ink-500">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="ft-td">
                        {t.status === '已完成' && <Tag tone="green">{t.status}</Tag>}
                        {t.status === '进行中' && <Tag tone="blue">{t.status}</Tag>}
                        {t.status === '待匹配' && <Tag tone="amber">{t.status}</Tag>}
                        {t.status === '失败' && <Tag tone="red">{t.status}</Tag>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'backup' && (
        <div className="space-y-4">
          <Card title="创建备份">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button className="rounded-lg border border-navy-200 bg-white p-4 text-left hover:border-navy-400 hover:bg-navy-50/40">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-navy-700" />
                  <span className="text-sm font-semibold text-ink-900">立即创建全量备份</span>
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  覆盖客户档案、合同、往来账、流水、提醒与操作记录，约 4 MB。
                </p>
              </button>
              <button className="rounded-lg border border-navy-200 bg-white p-4 text-left hover:border-navy-400 hover:bg-navy-50/40">
                <div className="flex items-center gap-2">
                  <HardDrive size={18} className="text-navy-700" />
                  <span className="text-sm font-semibold text-ink-900">创建手动快照</span>
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  在执行客户清单或合同台账调整前手动创建快照以便回滚。
                </p>
              </button>
            </div>
          </Card>

          <Card title="备份历史" bodyClass="!p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="border-b border-navy-100 bg-navy-50/40">
                    <th className="ft-th">备份名称</th>
                    <th className="ft-th">创建时间</th>
                    <th className="ft-th">创建人</th>
                    <th className="ft-th">大小</th>
                    <th className="ft-th">类型</th>
                    <th className="ft-th">范围</th>
                    <th className="ft-th w-24">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((b) => (
                    <tr key={b.id} className="ft-row-hover border-b border-navy-50 last:border-0">
                      <td className="ft-td">
                        <div className="flex items-center gap-2">
                          <Database size={14} className="text-navy-500" />
                          <span className="text-ink-900 text-xs">{b.name}</span>
                        </div>
                      </td>
                      <td className="ft-td font-mono text-xs text-ink-700">{b.at}</td>
                      <td className="ft-td text-ink-700">{b.by}</td>
                      <td className="ft-td text-ink-700 font-mono">{b.size}</td>
                      <td className="ft-td">
                        {b.type === '自动' ? <Tag tone="blue">自动</Tag> : <Tag tone="amber">手动</Tag>}
                      </td>
                      <td className="ft-td text-ink-700 text-xs">{b.scope}</td>
                      <td className="ft-td">
                        <button className="ft-btn-ghost text-xs">
                          <Download size={12} /> 下载
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
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
