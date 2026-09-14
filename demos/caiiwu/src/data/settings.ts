import type { BusinessRule } from './types'

export const accounts = [
  {
    id: 'U-001',
    name: '管理员',
    role: '系统管理员',
    email: 'admin@sxruishitech.com',
    phone: '138 0000 0001',
    lastLogin: '2026-09-14 08:30',
    status: 'active',
  },
  {
    id: 'U-002',
    name: '财务顾问一',
    role: '财务顾问',
    email: 'fa1@sxruishitech.com',
    phone: '138 0000 0002',
    lastLogin: '2026-09-14 09:02',
    status: 'active',
  },
  {
    id: 'U-003',
    name: '财务顾问二',
    role: '财务顾问',
    email: 'fa2@sxruishitech.com',
    phone: '138 0000 0003',
    lastLogin: '2026-09-13 17:55',
    status: 'active',
  },
]

export const businessRules: BusinessRule[] = [
  {
    id: 'BR-001',
    name: '代账费逾期自动转提醒',
    description: '代账费到期超过 5 天未到账时，自动生成紧急提醒并通知负责人。',
    enabled: true,
    scope: '所有在管客户',
  },
  {
    id: 'BR-002',
    name: '银行流水未匹配自动提醒',
    description: '上传银行流水后，超过 3 天未匹配的流水自动转入提醒中心。',
    enabled: true,
    scope: '所有在管客户',
  },
  {
    id: 'BR-003',
    name: '客户资料过期预警',
    description: '客户档案中的合同、许可证等资料到期前 30 天自动提醒补齐。',
    enabled: true,
    scope: '所有在管客户',
  },
  {
    id: 'BR-004',
    name: '开票风险阈值',
    description: '当月销项发票金额超过客户月均销货回款 120% 时，自动标记为开票风险。',
    enabled: true,
    scope: '一般纳税人客户',
  },
  {
    id: 'BR-005',
    name: '季度银行对账统一节点',
    description: '每季度第 10 日为对账截止日，所有未匹配流水自动转入提醒。',
    enabled: true,
    scope: '所有在管客户',
  },
  {
    id: 'BR-006',
    name: '高风险客户复核',
    description: '客户风险等级被调整为"已超额"或"高风险"时，自动通知管理员复核。',
    enabled: true,
    scope: '所有在管客户',
  },
  {
    id: 'BR-007',
    name: '操作记录自动归档',
    description: '操作记录超过 6 个月自动归档至冷存储，可在导出与备份中下载。',
    enabled: false,
    scope: '所有账号',
  },
  {
    id: 'BR-008',
    name: '数据导入字段映射模板',
    description: '所有数据导入前需先在"导入与备份"中维护字段映射模板，未维护则拦截导入。',
    enabled: true,
    scope: '所有账号',
  },
]
