export type RiskLevel = 'over' | 'high' | 'watch' | 'normal'

export type Owner = '财务顾问一' | '财务顾问二' | '管理员'

export type TodoCategory =
  | '代账收费'
  | '客户备忘'
  | '开票风险'
  | '系统'
  | '资料维护'
  | '银行对账'
  | '数据导入'

export type TodoStatus = 'pending' | 'reminded' | 'done'

export type Priority = 'urgent' | 'high' | 'normal'

export interface Customer {
  id: string
  name: string
  shortName: string
  owner: Owner
  risk: RiskLevel
  industry: string
  contact: string
  phone: string
  email: string
  address: string
  taxId: string
  bank: string
  bankAccount: string
  contractStart: string
  contractEnd: string
  monthlyFee: number
  balance: number
  hasInvoiceGap: boolean
  status: 'active' | 'paused'
  createdAt: string
  tags: string[]
  memo: string
  materials: { name: string; status: 'ok' | 'missing' | 'expired' }[]
}

export interface Todo {
  id: string
  customerId?: string
  customerName?: string
  owner: Owner
  category: TodoCategory
  priority: Priority
  dueText: string
  dueDate: string
  overdueDays?: number
  title: string
  detail: string
  status: TodoStatus
}

export interface Contract {
  id: string
  customerId: string
  customerName: string
  type: '代账服务' | '税务申报' | '工商代办' | '审计协助'
  no: string
  amount: number
  signedAt: string
  startAt: string
  endAt: string
  paymentCycle: '月付' | '季付' | '年付'
  received: number
  nextReceiveAt: string
  status: '进行中' | '待续签' | '已结束'
}

export interface LedgerEntry {
  id: string
  customerId: string
  customerName: string
  date: string
  type: '应收' | '实收' | '应付' | '实付'
  category: '代账费' | '工本费' | '税务罚金' | '其他'
  amount: number
  method: '银行转账' | '微信' | '现金' | '冲抵'
  memo: string
  matched: boolean
}

export interface CashFlowEntry {
  id: string
  customerId: string
  customerName: string
  date: string
  bank: string
  inOut: 'in' | 'out'
  amount: number
  counterparty: string
  matched: boolean
  memo: string
}

export interface Reminder {
  id: string
  customerId?: string
  customerName?: string
  level: 'urgent' | 'high' | 'normal'
  type: '收款' | '开票' | '资料' | '对账' | '合同'
  title: string
  detail: string
  dueAt: string
  owner: Owner
  status: 'open' | 'snoozed' | 'done'
}

export interface ImportTask {
  id: string
  fileName: string
  source: '银行流水' | '客户清单' | '合同台账' | '开票明细' | '资料模板'
  uploadedAt: string
  uploadedBy: Owner
  totalRows: number
  matchedRows: number
  unmatchedRows: number
  status: '进行中' | '已完成' | '待匹配' | '失败'
  notes?: string
}

export interface OperationLog {
  id: string
  actor: Owner
  module: string
  action: string
  target: string
  at: string
  ip: string
  result: '成功' | '失败'
}

export interface BusinessRule {
  id: string
  name: string
  description: string
  enabled: boolean
  scope: string
}
