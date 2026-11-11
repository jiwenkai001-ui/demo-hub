/* OA: browser-local approvals, workforce scheduling and hospital collaboration. */
(function (D) {
  'use strict';
  const {add,q,q1,val,run,get,insert,update,fail,now,date,money,int}=D;
  const TYPES=['请假','报销','采购','调班','加班'];
  const APPROVAL_STATUSES=['待审批','已通过','已驳回','已撤回'];
  const TASK_STATUSES=['待开始','进行中','已完成'];
  const PRIORITIES=['高','中','低'];
  const SHIFTS=['早班','晚班','夜班','休息','请假'];
  const ASELECT=`SELECT a.*,s.name AS applicant_name,s.dept FROM oa_approvals a JOIN staff s ON s.id=a.applicant_id`;
  const TSELECT=`SELECT t.*,s.name AS assignee_name,s.dept FROM oa_tasks t JOIN staff s ON s.id=t.assignee_id`;
  const SSELECT=`SELECT x.*,s.name AS staff_name,s.dept,s.role FROM oa_schedule x JOIN staff s ON s.id=x.staff_id`;
  function text(v,label,max=3000) {
    if(typeof v!=='string'||!v.trim())fail(label+'不能为空');
    if(v.trim().length>max)fail(label+'不能超过'+max+'字');
    return v.trim();
  }
  function choice(v,values,label) {if(!values.includes(v))fail(label+'无效');return v;}
  function day(v,label='日期') {
    if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))fail(label+'格式无效');
    const d=new Date(v+'T12:00:00');
    if(!Number.isFinite(d.getTime())||date(d)!==v)fail(label+'无效');return v;
  }
  function datetime(v,label) {
    if(typeof v!=='string')fail(label+'不能为空');
    v=v.replace('T',' ').slice(0,19);
    if(!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(v))fail(label+'格式无效');
    day(v.slice(0,10),label);if(Number(v.slice(11,13))>23||Number(v.slice(14,16))>59||Number(v.slice(17,19)||0)>59)fail(label+'无效');
    return v.length===16?v+':00':v;
  }
  function amount(v) {if(!Number.isFinite(Number(v))||Number(v)<=0||Number(v)>10000000)fail('金额须大于0且不超过1000万元');return money(v);}
  function staff(id) {const s=get('staff',int(id),'员工');if(s.status!=='在职')fail('请选择在职员工');return s;}
  function offset(d,n) {const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return date(x);}
  function monday(d) {const x=new Date(d+'T12:00:00');return offset(d,-((x.getDay()+6)%7));}
  function no(prefix,table,column) {return D.next(prefix,table,column);}
  function history(id,action,comment,operator='admin · 店长') {insert('oa_approval_history',{approval_id:id,action,operator:D.roleActor?D.roleActor():operator,comment,created_at:now()});}
  function leaveConflicts(a) {return a.type==='请假'?q("SELECT id,appt_no,scheduled_at,status FROM appointments WHERE doctor_id=? AND status IN('待到店','已到店','诊疗中') AND substr(scheduled_at,1,10)>=? AND substr(scheduled_at,1,10)<=? ORDER BY scheduled_at",[a.applicant_id,a.start_at.slice(0,10),a.end_at.slice(0,10)]):[];}
  function approval(id) {const a=q1(ASELECT+' WHERE a.id=?',[id])||fail('审批单不存在');a.history=q('SELECT * FROM oa_approval_history WHERE approval_id=? ORDER BY id',[id]);a.conflicts=a.status==='待审批'?leaveConflicts(a):[];if(D.expenseOASummary)a.expense=D.expenseOASummary(id);return a;}
  function task(id) {return q1(TSELECT+' WHERE t.id=?',[id])||fail('任务不存在');}
  function notice(id) {return q1('SELECT a.*,COALESCE(r.is_read,0) AS is_read,COALESCE(r.is_read,0) AS read_count FROM oa_announcements a LEFT JOIN oa_announcement_reads r ON r.announcement_id=a.id WHERE a.id=?',[id])||fail('公告不存在');}
  function days(start,end) {const out=[];for(let d=start;d<=end;d=offset(d,1)){out.push(d);if(out.length>31)fail('单次申请时间跨度不能超过31天');}return out;}
  function setShift(staffId,d,shift,note='') {
    run('INSERT INTO oa_schedule(staff_id,date,shift,note,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(staff_id,date) DO UPDATE SET shift=excluded.shift,note=excluded.note,updated_at=excluded.updated_at',[staffId,d,shift,note,now()]);
    return q1(SSELECT+' WHERE x.staff_id=? AND x.date=?',[staffId,d]);
  }
  function doctorAvailability(doctorId,at,overrideShift) {
    if(!int(doctorId))return {available:true,reason:'',shift:'待分配'};
    const d=String(at).slice(0,10),time=String(at).slice(11,16),minutes=Number(time.slice(0,2))*60+Number(time.slice(3,5));
    const leave=q1("SELECT id FROM oa_approvals WHERE applicant_id=? AND type='请假' AND status='已通过' AND substr(start_at,1,10)<=? AND substr(end_at,1,10)>=?",[int(doctorId),d,d]);
    if(leave)return {available:false,reason:'该医生当天已通过请假，请选择其他医生或日期',shift:'请假'};
    const schedule=q1('SELECT shift FROM oa_schedule WHERE staff_id=? AND date=?',[int(doctorId),d]),shift=overrideShift===undefined?(schedule?schedule.shift:'未排班'):overrideShift;
    const previous=q1("SELECT shift FROM oa_schedule WHERE staff_id=? AND date=?",[int(doctorId),offset(d,-1)]);
    let available=false;
    if(shift==='请假')return {available:false,reason:'该医生当天请假，请选择其他医生或日期',shift};
    if(previous&&previous.shift==='夜班'&&minutes<8*60)available=true;
    else if(shift==='早班')available=minutes>=8*60+30&&minutes<17*60+30;
    else if(shift==='晚班')available=minutes>=13*60&&minutes<22*60;
    else if(shift==='夜班')available=minutes>=20*60;
    else if(shift==='未排班')available=minutes>=9*60&&minutes<19*60;
    return {available,shift,reason:available?'':shift==='休息'?'该医生当天休息，请选择其他医生或日期':'该时段不在医生出诊班次内，请重新选择'};
  }
  D.doctorAvailability=doctorAvailability;

  D.oaInit=function () {
    if(q1("SELECT name FROM sqlite_master WHERE type='table' AND name='oa_meta'")&&val("SELECT value FROM oa_meta WHERE key='seed_v1'"))return false;
    const schema=`CREATE TABLE IF NOT EXISTS oa_meta(key TEXT PRIMARY KEY,value TEXT);
      CREATE TABLE IF NOT EXISTS oa_approvals(id INTEGER PRIMARY KEY AUTOINCREMENT,approval_no TEXT UNIQUE NOT NULL,type TEXT NOT NULL,title TEXT NOT NULL,applicant_id INTEGER NOT NULL REFERENCES staff(id),amount REAL DEFAULT 0,start_at TEXT DEFAULT '',end_at TEXT DEFAULT '',reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT '待审批',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS oa_approval_history(id INTEGER PRIMARY KEY AUTOINCREMENT,approval_id INTEGER NOT NULL REFERENCES oa_approvals(id),action TEXT NOT NULL,operator TEXT NOT NULL,comment TEXT DEFAULT '',created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS oa_tasks(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,assignee_id INTEGER NOT NULL REFERENCES staff(id),priority TEXT NOT NULL,due_date TEXT NOT NULL,status TEXT NOT NULL,description TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,completed_at TEXT);
      CREATE TABLE IF NOT EXISTS oa_schedule(id INTEGER PRIMARY KEY AUTOINCREMENT,staff_id INTEGER NOT NULL REFERENCES staff(id),date TEXT NOT NULL,shift TEXT NOT NULL,note TEXT DEFAULT '',updated_at TEXT NOT NULL,UNIQUE(staff_id,date));
      CREATE TABLE IF NOT EXISTS oa_attendance(id INTEGER PRIMARY KEY AUTOINCREMENT,staff_id INTEGER NOT NULL REFERENCES staff(id),date TEXT NOT NULL,check_in TEXT DEFAULT '',check_out TEXT DEFAULT '',status TEXT NOT NULL,note TEXT DEFAULT '',updated_at TEXT NOT NULL,UNIQUE(staff_id,date));
      CREATE TABLE IF NOT EXISTS oa_announcements(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,category TEXT NOT NULL,content TEXT NOT NULL,pinned INTEGER DEFAULT 0,author TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS oa_announcement_reads(announcement_id INTEGER PRIMARY KEY REFERENCES oa_announcements(id),is_read INTEGER NOT NULL DEFAULT 1,read_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS oa_documents(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,category TEXT NOT NULL,version TEXT NOT NULL,content TEXT NOT NULL,author TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(title,version));
      CREATE INDEX IF NOT EXISTS idx_oa_approval_status ON oa_approvals(status);
      CREATE INDEX IF NOT EXISTS idx_oa_schedule_date ON oa_schedule(date);
      CREATE INDEX IF NOT EXISTS idx_oa_task_due ON oa_tasks(due_date);`;
    schema.split(';').filter(s=>s.trim()).forEach(s=>run(s));
    if(val("SELECT value FROM oa_meta WHERE key='seed_v1'"))return false;
    const people=q("SELECT * FROM staff WHERE status='在职' ORDER BY id");if(!people.length)return false;
    const today=date(),week=monday(today),who=i=>people[i%people.length],stamp=now();
    const approvalSeeds=[
      ['请假','护理人员家庭事务事假',8,0,2,2,'家中有事申请事假1天，已与住院部完成交接，晚间输液由当班护士接替。','待审批'],
      ['报销','急诊氧气瓶充装费用报销',5,480,0,0,'夜间急诊补充医用氧气两瓶，附有供应商电子收据；费用归属急诊科日常耗材。','待审批'],
      ['采购','购置住院输液泵2台',8,6800,1,1,'住院笼位使用率上升，现有输液泵不足。建议采购支持微量输液及阻塞报警的设备2台。','待审批'],
      ['调班','周末门诊值班调整申请',4,0,4,4,'因参加继续教育申请调整周末早班，已与内科同事口头协调，具体班次由排班负责人确认。','待审批'],
      ['加班','术后重症动物夜间监护',1,0,0,0,'腹腔手术术后首夜需密切观察生命体征，申请延长工作时间2小时，完成监护记录后交接。','待审批'],
      ['采购','检验室质控品月度补充',6,2380,1,1,'血细胞分析仪与生化仪质控品余量不足一个月，申请按现有供应商采购标准品各两盒。','待审批'],
      ['报销','兽医继续教育课程费用',0,960,-2,-2,'参加犬猫慢性肾病病例研讨线上课程，申请报销课程费用，结业证明已在科室资料柜归档。','待审批'],
      ['请假','影像科年休假申请',7,0,7,8,'申请年休假2天，拟由影像科医师代为完成常规DR拍摄与资料归档。','待审批'],
      ['采购','隔离病房消毒耗材补充',3,1260,1,1,'补充过硫酸氢钾复合盐消毒剂、一次性隔离衣及鞋套，按传染病隔离流程使用。','待审批'],
      ['报销','上月固定设备保养费用',7,680,-5,-5,'DR设备例行保养与探测器清洁，服务方已完成检查并提供保养报告。','已通过'],
      ['采购','住院护理垫与注射器补货',8,1580,-4,-4,'补足住院区一周使用量，按进销存采购与批次管理流程登记验收。','已通过'],
      ['请假','皮肤科医师调休',3,0,-3,-3,'使用上月急诊支援调休额度，已提前告知预约客户并完成复诊安排。','已通过'],
      ['加班','月底库存盘点加班',9,0,-2,-2,'店长与护士长共同完成药房、疫苗冷链和高值耗材盘点，核对异常差异。','已通过'],
      ['请假','检验师外出培训',6,0,-1,-1,'参加动物医院检验质量控制培训，交班前已完成当日质控和设备状态确认。','已通过'],
      ['采购','休息区咖啡机采购',9,3200,-6,-6,'改善员工休息环境，拟新增全自动咖啡机一台。','已驳回'],
      ['报销','个人通勤费用',4,85,-4,-4,'申请报销个人往返通勤打车费用。','已驳回'],
      ['调班','临时值班互换申请',5,0,3,3,'原计划与同事互换晚班，个人安排已取消，因此撤回申请。','已撤回'],
      ['采购','牙科洁牙机工作尖备件',1,860,-1,-1,'常规洁牙工作尖磨损，采购同型号备件4支，并按设备维护记录进行登记。','待审批']
    ];
    approvalSeeds.forEach((a,i)=>{
      const sid=who(a[2]).id,created=offset(today,-Math.floor(i/3)-1)+' 09:20:00';
      const start=offset(today,a[4])+(a[0]==='加班'?' 18:00:00':' 08:30:00');
      const end=offset(today,a[5])+(a[0]==='加班'?' 20:00:00':' 17:30:00');
      const id=insert('oa_approvals',{approval_no:'OA'+today.replace(/-/g,'')+String(i+1).padStart(4,'0'),type:a[0],title:a[1],applicant_id:sid,amount:a[3],start_at:['请假','调班','加班'].includes(a[0])?start:'',end_at:['请假','调班','加班'].includes(a[0])?end:'',reason:a[6],status:a[7],created_at:created,updated_at:created});
      insert('oa_approval_history',{approval_id:id,action:'提交',operator:who(a[2]).name,comment:a[6],created_at:created});
      if(a[7]!=='待审批')insert('oa_approval_history',{approval_id:id,action:a[7]==='已通过'?'通过':a[7]==='已驳回'?'驳回':'撤回',operator:a[7]==='已撤回'?who(a[2]).name:'admin · 店长',comment:a[7]==='已驳回'?(a[0]==='采购'?'本月预算优先用于医疗设备与耗材，暂缓非必要采购。':'不符合现行报销范围，请参阅费用报销管理制度。'):a[7]==='已通过'?'已核对申请内容，同意按医院流程执行。':'个人安排取消，申请撤回。',created_at:offset(today,-Math.floor(i/4))+' 15:10:00'});
    });
    const taskSeeds=[
      ['完成住院部晨间护理交接',8,'高',0,'进行中','核对所有住院动物身份、输液通路、进食排泄与疼痛评分；异常情况立即通知主治医师。'],
      ['核查疫苗冷链温度记录',4,'高',0,'待开始','检查近7天冷藏温度，确认2–8℃管理要求；超温批次先隔离并联系厂家评估。'],
      ['检验室双水平质控复核',6,'高',0,'进行中','复核血常规、生化双水平质控结果，超限时停止发放报告并记录处理措施。'],
      ['回访昨日绝育术后病例',8,'中',0,'待开始','按CRM回访名单联系客户，询问伤口、精神食欲、排便及服药情况，回填异常记录。'],
      ['整理影像科教学病例',7,'中',2,'进行中','整理3例腹部超声教学案例，脱敏客户信息，补齐影像所见、诊断意见和复查建议。'],
      ['月度药品批次效期巡检',9,'高',1,'待开始','核对药房与住院区批次，登记90天内到期品，先到期先出并提交处理建议。'],
      ['更新急诊抢救车清单',5,'高',-1,'进行中','核对气管插管、喉镜、复苏囊、急救药物与氧气压力，补足缺项后由第二人复核。'],
      ['外科手术器械包检查',1,'中',1,'待开始','核对器械完整性、灭菌指示卡和包装有效期，破损包装重新处理。'],
      ['皮肤病复诊宣教资料修订',3,'低',4,'进行中','完善外用药、药浴、伊丽莎白圈与环境清洁说明，复核客户常见问题。'],
      ['新员工院感流程培训',0,'中',3,'待开始','安排手卫生、医疗废弃物分类、传染病分诊和针刺伤处理培训，完成签名记录。'],
      ['公示本周排班并核对交接',9,'中',-1,'已完成','核对各科室门诊与急诊覆盖，发布本周排班，确认调班申请已落地。'],
      ['住院动物身份标识巡检',8,'中',-1,'已完成','核查笼位标签、病历编号与腕带信息一致，双人确认药物及输液标签。'],
      ['完成上月发票归档',9,'低',2,'待开始','按报销单号整理发票与验收记录，核对金额、费用归属和审批状态。'],
      ['设备维护记录归档',7,'低',-2,'已完成','归档DR、超声、生化仪维护记录，检查下次保养计划。']
    ];
    taskSeeds.forEach(t=>insert('oa_tasks',{title:t[0],assignee_id:who(t[1]).id,priority:t[2],due_date:offset(today,t[3]),status:t[4],description:t[5],created_at:offset(today,-3)+' 09:00:00',updated_at:stamp,completed_at:t[4]==='已完成'?offset(today,-1)+' 16:30:00':null}));
    people.forEach((s,i)=>{for(let n=-7;n<14;n++){const d=offset(week,n),dow=new Date(d+'T12:00:00').getDay();setShift(s.id,d,(dow===(i%7))?'休息':(s.role==='店长'?'早班':i===5&&n%3===0?'夜班':(i+n+14)%3===0?'晚班':'早班'));}});
    q("SELECT * FROM oa_approvals WHERE status='已通过' AND type='请假'").forEach(a=>days(a.start_at.slice(0,10),a.end_at.slice(0,10)).forEach(d=>setShift(a.applicant_id,d,'请假','已通过请假 · '+a.approval_no)));
    for(let n=-2;n<=0;n++)people.forEach((s,i)=>{
      const d=offset(today,n),sch=q1('SELECT * FROM oa_schedule WHERE staff_id=? AND date=?',[s.id,d]);
      if(!sch||['休息','请假'].includes(sch.shift)||n===0&&i>=6)return;
      const checkin=sch.shift==='晚班'?'12:54':sch.shift==='夜班'?'19:52':i===2?'08:43':'08:22';
      insert('oa_attendance',{staff_id:s.id,date:d,check_in:checkin,check_out:n<0?(sch.shift==='晚班'?'22:03':sch.shift==='夜班'?'08:05':'17:36'):'',status:i===2&&sch.shift==='早班'?'迟到':n<0?'正常':'在岗',note:i===2&&sch.shift==='早班'?'交通延误，已向主管说明':'',updated_at:stamp});
    });
    const announcements=[
      ['本周医疗质量与安全工作提醒','医疗质量',1,'各科室负责人请于本周五下班前完成医疗质量自查。\n\n重点核查：病历及时完成率、处方签名、异常检验结果复核与危急值通知、手术安全核查、住院护理交接。\n\n自查发现问题请建立整改任务，明确责任人及完成时间；周例会上复盘落实情况。'],
      ['冬季呼吸道传染病分诊与消毒安排','院感通知',1,'出现咳嗽、喷嚏、发热或疑似传染病的动物，前台应提前告知医护并安排隔离候诊。\n\n接诊前后执行手卫生，诊台与笼位按规定接触时间消毒；不同病原的用具分别标记，严禁交叉使用。\n\n隔离耗材由护理部每日清点，不足时通过OA申请并交进销存采购。'],
      ['本周临床病例讨论会','培训学习',0,'时间：本周四18:00–19:00；地点：二楼会议室。\n\n主题：犬猫慢性肾病的分期管理与营养支持。主讲：内科医师；检验与影像科补充典型检查结果。\n\n请参会人员提前阅读资料中心《临床病例讨论与培训制度》，准备脱敏病例资料。'],
      ['药品与高值耗材月度盘点安排','行政通知',0,'本月盘点由药房负责人牵头，店长与护理人员共同参加。\n\n盘点包括库存数量、批次、效期、冷链记录及异常差异。盘点期间取药须先登记，紧急用药由双人核对。\n\n盘点结果提交OA任务后，库存调整仍需在进销存模块登记操作原因。'],
      ['客户隐私与病例资料使用规范','制度发布',0,'客户姓名、电话、就诊记录和影像资料属于医院业务资料，仅用于诊疗服务及授权业务。\n\n教学、宣传或病例分享须先脱敏并取得必要授权，禁止通过个人社交账号传播完整客户信息。\n\n离岗时锁屏，纸质资料入柜，严禁共用个人账号。'],
      ['住院探视与出院交接提醒','护理通知',0,'住院探视统一安排在14:00–17:00，病情不稳定或隔离住院由主治医师评估。\n\n出院前由医护共同核对药品、剂量、复查时间和注意事项，向客户演示必要护理步骤。\n\n收费台确认账单结清后办理出院，并在CRM建立术后或出院回访任务。'],
      ['OA协同办公使用说明','系统通知',0,'审批中心用于请假、调班、加班、报销和采购申请；待审批申请可通过、驳回或撤回，操作留痕可在详情查看。\n\n请假通过后自动在排班中标记；调班通过后由负责人核对并调整排班。采购审批通过后，需在进销存模块创建采购单、收货并维护库存。\n\n任务状态、考勤登记、公告已读和制度资料均在当前浏览器保存；此演示不接入实际工资、支付或考勤设备。']
    ];
    announcements.forEach((a,i)=>{const created=offset(today,-i)+' 09:00:00';insert('oa_announcements',{title:a[0],category:a[1],pinned:a[2],content:a[3],author:i===1?'护理部':'admin · 店长',created_at:created,updated_at:created});});
    const documents=[
      ['员工请假与调班管理制度','行政制度','2.1','一、适用范围\n适用于医院在职医师、医技、护理、前台和行政人员。\n\n二、请假申请\n请假需填写起止时间、事由及工作交接安排，原则上提前提交；紧急情况先通知主管并及时补单。\n\n三、审批与排班\n店长核实诊疗覆盖后审批。通过的请假自动标记为请假；调班申请通过后由负责人在排班页落实班次，不得造成急诊无人值守。\n\n四、工作交接\n交接住院动物、预约、待报告检查和重点客户事项；确认接替人员已了解风险及待办。'],
      ['费用报销管理办法','财务制度','1.3','一、报销范围\n限与医院经营、医疗服务及批准培训有关的合理支出，个人消费与普通通勤费用不予报销。\n\n二、申请要求\n填写用途、金额、费用归属和事由，原始票据按审批单号线下归档，确保票据真实有效且不重复报销。\n\n三、审批与支付\n店长核对事项后审批，财务复核票据与预算并执行实际支付；OA审批通过仅代表流程完成，不代表款项已经支付。\n\n四、归档\n审批记录、合同、发票和验收记录按月归档。'],
      ['医疗设备与耗材采购流程','采购管理','2.0','一、需求提出\n科室提交品名、规格、数量、预估金额与用途，核查现有库存后发起OA采购申请。\n\n二、比价与审批\n核实供应商资质、售后服务、预算和交货期限；高值设备完成必要的价格比较。\n\n三、采购执行\n审批通过后在进销存创建采购单，录入供应商、批次与效期。OA记录不会自动增加库存。\n\n四、验收\n收货时核对数量、包装、批次、效期与冷链要求，不合格品隔离处理。设备验收后登记档案与维护计划。'],
      ['住院护理与交接班规范','护理规范','3.0','一、身份核查\n笼位、病历与医嘱信息一致，给药及操作前核对动物身份与药物信息。\n\n二、监护记录\n记录精神、体温、心率、呼吸、疼痛、进食、排泄、液体输入输出及异常反应，频次遵医嘱。\n\n三、交接内容\n口头与书面交接并行，包括病情风险、治疗计划、未完成检查、特殊护理及客户沟通事项。\n\n四、异常处置\n发现呼吸困难、持续出血、意识异常等情况立即通知医师并按院内急救流程处理。'],
      ['医院感染预防与消毒规范','院感规范','2.2','一、手卫生\n接触动物前后、清洁操作前、接触体液后及接触动物周边环境后执行手卫生。\n\n二、分区管理\n普通诊区、隔离区、手术区及检验区分开管理，用具分别标记。\n\n三、清洁消毒\n先清洁后消毒，按产品说明配制浓度与接触时间，登记配制人、时间和有效期限。\n\n四、医疗废弃物\n锐器置于专用容器，感染性废物分类收集，规范暂存及交接，发生针刺伤立即报告。'],
      ['检验质量控制与危急值报告制度','医疗质量','1.8','一、质控\n仪器每日开机后按要求完成质控，结果合格后方可开展检测，失控时排查并记录整改。\n\n二、样本核对\n核对动物身份、采样时间、样本类型与申请项目，发现凝血、溶血等不合格情况及时沟通。\n\n三、结果审核\n结合物种参考区间及临床情况审核异常结果，必要时复测或人工复核。\n\n四、危急值\n按医院确认的危急值清单及时通知临床医师，复述确认并记录通知时间、接收人及处理情况。'],
      ['病例资料与客户隐私保护规范','信息管理','1.2','一、访问权限\n岗位人员仅访问与工作有关的资料，及时锁屏，不向无关人员提供客户与动物就诊资料。\n\n二、教学与宣传\n病例使用前完成姓名、电话、住址等信息脱敏，必要时取得客户授权。\n\n三、资料流转\n按规定渠道传递病历与影像，禁止私自复制到个人云盘或公开群聊。\n\n四、归档\n遵照医院制度保存病历及相关资料，发现误传、丢失及时报告。'],
      ['药品冷链与近效期管理指引','药事管理','2.0','一、储存\n按产品标示储存，冷藏药品及疫苗一般保持2–8℃，避免冻结并记录温度。\n\n二、验收与批次\n验收供应商资质、批号、效期、包装及运输条件，逐批录入进销存。\n\n三、近效期\n按先到期先出原则发放，定期检查90天内到期品并制定处理计划。\n\n四、异常\n超温、破损或标签不清的产品先隔离，不得擅自使用，按药事负责人确认意见处理。'],
      ['临床病例讨论与培训制度','培训学习','1.1','一、讨论安排\n每周开展临床病例讨论，疑难及不良事件可临时组织多科室讨论。\n\n二、准备资料\n主治医师准备主诉、病史、体征、检查、诊断依据、治疗计划与随访结果，资料提前脱敏。\n\n三、培训记录\n记录参加人员、主题、要点和改进事项；需落实的工作转为协作任务并明确截止时间。\n\n四、复盘\n负责人跟踪改进事项，定期评估流程执行情况及后续培训需求。']
    ];
    documents.forEach((d,i)=>{const created=offset(today,-15-i)+' 10:00:00';insert('oa_documents',{title:d[0],category:d[1],version:d[2],content:d[3],author:'admin · 店长',created_at:created,updated_at:created});});
    insert('oa_meta',{key:'seed_v1',value:today});return true;
  };

  add('GET','/oa/staff',()=>({items:q("SELECT s.*,s.title AS position FROM staff s WHERE s.status='在职' ORDER BY s.id")}));
  add('GET','/oa/overview',()=>{
    const today=date();return {kpi:{pending_approvals:int(val("SELECT COUNT(*) FROM oa_approvals WHERE status='待审批'")),today_on_duty:int(val("SELECT COUNT(*) FROM oa_schedule WHERE date=? AND shift NOT IN('休息','请假')",[today])),open_tasks:int(val("SELECT COUNT(*) FROM oa_tasks WHERE status!='已完成'")),unread_announcements:int(val('SELECT COUNT(*) FROM oa_announcements a WHERE NOT EXISTS(SELECT 1 FROM oa_announcement_reads r WHERE r.announcement_id=a.id AND r.is_read=1)'))},approvals:q(ASELECT+" WHERE a.status='待审批' ORDER BY a.id DESC LIMIT 5"),tasks:q(TSELECT+" WHERE t.status!='已完成' ORDER BY t.due_date,CASE t.priority WHEN '高' THEN 1 WHEN '中' THEN 2 ELSE 3 END,t.id DESC LIMIT 6"),announcements:q('SELECT a.*,COALESCE(r.is_read,0) AS is_read FROM oa_announcements a LEFT JOIN oa_announcement_reads r ON r.announcement_id=a.id ORDER BY a.pinned DESC,a.created_at DESC LIMIT 5'),schedule:q(SSELECT+' WHERE x.date=? ORDER BY x.staff_id',[today]),date:today};
  });
  add('GET','/oa/approvals',p=>{
    const f=D.filters({'a.status':p.status,'a.type':p.type},p.keyword,['a.title','a.approval_no','s.name']);
    return {items:q(ASELECT+f.sql+" ORDER BY CASE a.status WHEN '待审批' THEN 0 ELSE 1 END,a.id DESC",f.args)};
  });
  add('POST','/oa/approvals',(p,d)=>{
    const type=choice(d.type,TYPES,'审批类型'),title=text(d.title,'申请标题',100),applicant=staff(d.applicant_id),reason=text(d.reason,'申请事由');
    let start='',end='',sum=0;
    if(['报销','采购'].includes(type))sum=amount(d.amount);
    if(['请假','调班','加班'].includes(type)) {start=datetime(d.start_at,'开始时间');end=datetime(d.end_at,'结束时间');if(end<=start)fail('结束时间必须晚于开始时间');days(start.slice(0,10),end.slice(0,10));}
    const id=insert('oa_approvals',{approval_no:no('OA','oa_approvals','approval_no'),type,title,applicant_id:applicant.id,amount:sum,start_at:start,end_at:end,reason,status:'待审批',created_at:now(),updated_at:now()});history(id,'提交',reason,applicant.name);return approval(id);
  });
  add('GET','/oa/approvals/{id}',p=>approval(p.id));
  add('POST','/oa/approvals/{id}/action',(p,d)=>{
    if(D.expenseOAGuard)D.expenseOAGuard(p.id);
    const a=approval(p.id);if(a.status!=='待审批')fail('该审批已处理，不能重复操作');
    const action=choice(d.action,['approve','reject','withdraw'],'审批操作');
    const comment=action==='reject'?text(d.comment,'驳回原因',1000):String(d.comment||'').trim();if(comment.length>1000)fail('意见不能超过1000字');
    if(action==='approve'&&a.type==='请假') {
      const conflicts=leaveConflicts(a);if(conflicts.length)fail('该医生请假日期仍有'+conflicts.length+'个预约（如 '+conflicts[0].appt_no+'），请先在预约管理调整或取消后再审批');
      const overlap=q1("SELECT id FROM oa_approvals WHERE applicant_id=? AND id!=? AND type='请假' AND status='已通过' AND start_at<=? AND end_at>=?",[a.applicant_id,a.id,a.end_at,a.start_at]);
      if(overlap)fail('该员工已有重叠的已通过请假申请');
      days(a.start_at.slice(0,10),a.end_at.slice(0,10)).forEach(d=>setShift(a.applicant_id,d,'请假','已通过请假 · '+a.approval_no));
    }
    update('oa_approvals',a.id,{status:action==='approve'?'已通过':action==='reject'?'已驳回':'已撤回',updated_at:now()});
    history(a.id,action==='approve'?'通过':action==='reject'?'驳回':'撤回',comment||(action==='approve'?'同意申请':'申请撤回'),action==='withdraw'?a.applicant_name:'admin · 店长');return approval(a.id);
  });
  add('GET','/oa/tasks',p=>{const f=D.filters({'t.status':p.status,'t.priority':p.priority,'t.assignee_id':int(p.assignee_id)||null},p.keyword,['t.title','t.description','s.name']);return {items:q(TSELECT+f.sql+" ORDER BY CASE t.status WHEN '已完成' THEN 1 ELSE 0 END,t.due_date,CASE t.priority WHEN '高' THEN 1 WHEN '中' THEN 2 ELSE 3 END,t.id DESC",f.args)};});
  function taskFields(d,old) {
    const merged=Object.assign({},old||{},d);return {title:text(merged.title,'任务标题',100),assignee_id:staff(merged.assignee_id).id,priority:choice(merged.priority||'中',PRIORITIES,'优先级'),due_date:day(merged.due_date,'截止日期'),status:choice(merged.status||'待开始',TASK_STATUSES,'任务状态'),description:text(merged.description,'任务说明')};
  }
  add('POST','/oa/tasks',(p,d)=>{const t=taskFields(d),id=insert('oa_tasks',Object.assign(t,{created_at:now(),updated_at:now(),completed_at:t.status==='已完成'?now():null}));return task(id);});
  add('PUT','/oa/tasks/{id}',(p,d)=>{const old=get('oa_tasks',p.id,'任务'),t=taskFields(d,old);update('oa_tasks',p.id,Object.assign(t,{updated_at:now(),completed_at:t.status==='已完成'?(old.completed_at||now()):null}));return task(p.id);});
  add('GET','/oa/schedule',p=>{const week=monday(day(p.week||date()));return {items:q(SSELECT+' WHERE x.date>=? AND x.date<=? ORDER BY x.staff_id,x.date',[week,offset(week,6)]),week,staff:q("SELECT * FROM staff WHERE status='在职' ORDER BY id"),shifts:SHIFTS};});
  add('POST','/oa/schedule',(p,d)=>{const s=staff(d.staff_id),v=day(d.date),shift=choice(d.shift,SHIFTS,'班次');if(q1("SELECT id FROM oa_approvals WHERE applicant_id=? AND type='请假' AND status='已通过' AND substr(start_at,1,10)<=? AND substr(end_at,1,10)>=?",[s.id,v,v]))fail('当天已有已通过请假，不能覆盖排班');if(shift==='请假')fail('请通过请假审批标记请假班次');
    const conflict=q("SELECT appt_no,scheduled_at FROM appointments WHERE doctor_id=? AND substr(scheduled_at,1,10)=? AND status IN('待到店','已到店','诊疗中')",[s.id,v]).find(a=>!doctorAvailability(s.id,a.scheduled_at,shift).available);
    if(conflict)fail('新班次与预约 '+conflict.appt_no+' 冲突，请先调整预约');return setShift(s.id,v,shift,String(d.note||'').slice(0,500));});
  add('GET','/oa/attendance',p=>{const dayValue=day(p.date||date());return {date:dayValue,items:q(`SELECT COALESCE(a.id,0) AS id,s.id AS staff_id,s.name AS staff_name,s.dept,? AS date,COALESCE(x.shift,'未排班') AS shift,COALESCE(a.check_in,'') AS check_in,COALESCE(a.check_out,'') AS check_out,CASE WHEN x.shift='请假' THEN CASE WHEN COALESCE(a.check_in,'')!='' THEN '请假/待核对' ELSE '请假' END WHEN x.shift='休息' AND COALESCE(a.check_in,'')!='' THEN '休息/已打卡' ELSE COALESCE(a.status,CASE WHEN x.shift='休息' THEN '休息' ELSE '未打卡' END) END AS status,COALESCE(a.note,'') || CASE WHEN x.shift='请假' AND COALESCE(a.check_in,'')!='' THEN '；请假已通过，原打卡记录保留，请负责人核对实际出勤。' ELSE '' END AS note FROM staff s LEFT JOIN oa_attendance a ON a.staff_id=s.id AND a.date=? LEFT JOIN oa_schedule x ON x.staff_id=s.id AND x.date=? WHERE s.status='在职' ORDER BY s.id`,[dayValue,dayValue,dayValue])};});
  add('POST','/oa/attendance',(p,d)=>{
    const s=staff(d.staff_id),v=day(d.date),schedule=q1('SELECT * FROM oa_schedule WHERE staff_id=? AND date=?',[s.id,v]);
    if(schedule&&['休息','请假'].includes(schedule.shift))fail('当天为'+schedule.shift+'，请先核对排班后登记考勤');
    const time=(value,label)=>{if(!value)return '';if(typeof value!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))fail(label+'格式应为HH:mm');return value;};
    const cin=time(d.check_in,'上班时间'),cout=time(d.check_out,'下班时间');if(!cin)fail('请填写上班时间');
    if(v>date())fail('不能登记未来日期的考勤');
    const night=schedule&&schedule.shift==='夜班',mins=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5));
    let startMinutes=mins(cin),endMinutes=cout?mins(cout):null;
    if(night&&startMinutes<12*60)startMinutes+=24*60;
    if(cout){if(cout===cin)fail('上下班时间不能相同');if(night){while(endMinutes<startMinutes)endMinutes+=24*60;}else if(endMinutes<startMinutes)fail('下班时间不能早于上班时间');}
    const expected=night?20*60:schedule&&schedule.shift==='晚班'?13*60:8*60+30;
    const end=night?32*60:schedule&&schedule.shift==='晚班'?22*60:17*60+30;
    let status=startMinutes>expected?'迟到':cout?'正常':'在岗';if(cout&&endMinutes<end)status=startMinutes>expected?'迟到/早退':'早退';
    run('INSERT INTO oa_attendance(staff_id,date,check_in,check_out,status,note,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(staff_id,date) DO UPDATE SET check_in=excluded.check_in,check_out=excluded.check_out,status=excluded.status,note=excluded.note,updated_at=excluded.updated_at',[s.id,v,cin,cout,status,String(d.note||'').slice(0,1000),now()]);return q1('SELECT * FROM oa_attendance WHERE staff_id=? AND date=?',[s.id,v]);
  });
  add('GET','/oa/announcements',p=>{const f=D.filters({'a.category':p.category},p.keyword,['a.title','a.content']);return {items:q('SELECT a.*,COALESCE(r.is_read,0) AS is_read,COALESCE(r.is_read,0) AS read_count FROM oa_announcements a LEFT JOIN oa_announcement_reads r ON r.announcement_id=a.id'+f.sql+' ORDER BY a.pinned DESC,a.created_at DESC,a.id DESC',f.args)};});
  add('POST','/oa/announcements',(p,d)=>{const id=insert('oa_announcements',{title:text(d.title,'公告标题',100),category:text(d.category||'行政通知','公告分类',30),content:text(d.content,'公告内容',12000),pinned:d.pinned===true||d.pinned===1||d.pinned==='1'?1:0,author:'admin · 店长',created_at:now(),updated_at:now()});return notice(id);});
  add('GET','/oa/announcements/{id}',p=>notice(p.id));
  add('POST','/oa/announcements/{id}/read',p=>{get('oa_announcements',p.id,'公告');run('INSERT INTO oa_announcement_reads(announcement_id,is_read,read_at) VALUES(?,1,?) ON CONFLICT(announcement_id) DO UPDATE SET is_read=1,read_at=excluded.read_at',[p.id,now()]);return notice(p.id);});
  add('GET','/oa/documents',p=>{const f=D.filters({category:p.category},p.keyword,['title','content']);return {items:q('SELECT * FROM oa_documents'+f.sql+' ORDER BY updated_at DESC,id DESC',f.args)};});
  add('GET','/oa/documents/{id}',p=>get('oa_documents',p.id,'资料'));
  add('POST','/oa/documents',(p,d)=>{const title=text(d.title,'资料标题',100),version=text(d.version||'1.0','版本号',30);if(q1('SELECT id FROM oa_documents WHERE title=? AND version=?',[title,version]))fail('该资料版本已存在，请使用新的版本号');return get('oa_documents',insert('oa_documents',{title,category:text(d.category||'行政制度','资料分类',30),version,content:text(d.content,'资料正文',20000),author:'admin · 店长',created_at:now(),updated_at:now()}));});
})(window.Demo);
