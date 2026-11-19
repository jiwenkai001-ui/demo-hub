export const BASE = new URL('../', import.meta.url);
export const storeId = new URL(location.href).searchParams.get('store') || 'yunshang';
export const namespace = `yunshang.v2:${BASE.pathname}:${storeId}:`;
export function read(key, fallback = '') {try {return localStorage.getItem(namespace + key) || fallback;} catch {return fallback;}}
export function write(key, value) {try {localStorage.setItem(namespace + key, value);} catch { /* 内存值仍可使用 */ }}
let language = read('language', 'zh');
export function getLang() {return language;}
export function setLang(next) {language = next === 'en' ? 'en' : 'zh'; write('language', language); document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN'; window.dispatchEvent(new Event('queue:language'));}
window.addEventListener('storage', e => {if (e.key === namespace + 'language') {language = e.newValue === 'en' ? 'en' : 'zh'; document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN'; window.dispatchEvent(new Event('queue:language'));}});
document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
const words = {
"cancelled":["已取消", "Cancelled"],
"arriving":["已叫号 · 待到场", "Called · awaiting arrival"],
"serving":["服务中", "In service"],
"startService":["确认到场并服务", "Start service"],
"confirmArrival":["叫号后确认顾客到场", "Confirm arrival after calling"],
"arrivalHint":["开启后先叫号，再确认到场并计时；请结束当前接待后切换", "When enabled, call first, then confirm arrival to start timing. Change after the current service ends."],
"cancelEnabled":["允许顾客取消等待或过号", "Allow guests to cancel waiting or missed tickets"],
"openTickets":["开放取号", "Ticketing open"],
"pausedTickets":["暂停取号", "Ticketing paused"],
"completeNext":["完成并叫下一位", "Complete & call next"],
"nextGuest":["下一位", "Next guest"],
"completeNextText":["将完成当前顾客并叫下一位，请核对下方号码。", "Complete the current guest and call the next ticket. Check the numbers below."],
"undo":["撤销上一步", "Undo last action"],
"undoHint":["15秒内且没有后续操作时可撤销", "Undo within 15 seconds before any further change"],
"undoExpired":["撤销已超时或后续业务已推进", "Undo expired or another operation occurred"],
"arrivalRequired":["请先确认顾客到场并开始服务", "Confirm arrival and start service first"],
"cancelQueue":["取消排队", "Leave queue"],
"cancelQueueText":["确认取消此号？取消后30秒内不能重新取号，重新取号将排在队尾。", "Leave this queue? Wait 30 seconds before taking a new ticket at the end of the queue."],
"requestReturn":["我已到店，请店员安排", "I have returned"],
"returnRequested":["已告知店员，请等待安排", "Staff notified. Please wait."],
"returnBadge":["已到店待安排", "Returned · needs recall"],
"walkIn":["现场代取号", "Walk-in ticket"],
"walkin":["现场顾客", "Walk-in"],
"walkInText":["将为本店新增一张现场号单，按正常顺序排队。", "Add a walk-in ticket to the end of this store’s queue."],
"showTicket":["请向顾客出示此号码", "Show this number to the guest"],
"searchNumber":["按号码查找，例如 H018", "Find ticket, e.g. H018"],
"search":["查找", "Find"],
"clearSearch":["清除查找", "Clear search"],
"details":["完整信息", "Details"],
"waited":["已等候", "Waiting for"],
"noMatch":["未找到匹配号码", "No matching tickets"],
"demoTools":["演示工具", "Demo tools"],
"queueQR":["扫码取号与链接", "Ticket QR & links"],
"switchStore":["切换门店", "Change store"],
"switchStoreText":["切换门店不会转移或取消已有号单；请核对门店后取号。", "Changing stores will not transfer or cancel your ticket. Check the store before joining."],
"autoUpdate":["自动更新 · 刚刚同步", "Auto update · just synced"],
"backgroundNote":["锁屏或切到后台不能保证及时提醒，请留意现场叫号。", "Background or locked screens may not receive timely updates. Watch the store display."],
"nearTurn":["即将叫号，请留意现场", "Your turn is approaching"],
"currentOverdue":["上一位仍在服务，预计时间可能延长", "The current service is taking longer. Your wait may increase."],
"cancelledTip":["您已取消排队，需要时可重新取号。", "You left the queue. Take a new ticket when needed."],
"servingTip":["已开始为您服务，祝您到店愉快。", "Your service has started. Enjoy your visit."],
"calledAction":["请到接待处出示号码", "Please show your ticket at reception"],
"finishedAt":["服务结束", "Service finished"],
"cancelledAt":["取消时间", "Cancelled at"],
"foregroundAlert":["开启页面叫号提醒", "Enable in-page alerts"],
"alertsOn":["页面提醒已开启", "In-page alerts on"],
"source":["号单来源", "Source"],
"operator":["接待员署名", "Staff label"],
"operatorHint":["仅用于演示操作记录，不代表独立账号权限", "A demo record label; it does not create an account or permissions."],
"dateTo":["结束日期", "End date"],
"rangeSummary":["筛选结果统计", "Filtered summary"],
"averageWait":["平均首次等候", "Average initial wait"],
"averageService":["平均累计服务", "Average service"],
"missedTickets":["曾过号", "Missed at least once"],
"serviceDuration":["累计服务", "Service duration"],
"voiceBusy":["另一终端正在播报，请先关闭它的语音或等待15秒", "Another terminal is announcing. Turn its voice off or wait 15 seconds."],
"fullscreenUnavailable":["无法全屏，请检查浏览器权限", "Fullscreen unavailable. Check browser permissions."],
"actionCalled":["已叫号", "Called"],
"actionPassed":["已过号", "Marked missed"],
"actionCompleted":["已完成", "Completed"],
"actionRecalled":["已重呼", "Recalled"],
"actionStarted":["已开始服务", "Service started"],
"actionUndone":["已撤销上一步", "Last action undone"],
"cancelCooldown":["取消后请等待30秒再取号", "Wait 30 seconds after cancelling before joining again"],

 invalidInput:['输入内容不符合要求，请检查后重试','Invalid input. Please check and try again.'], requestReused:['操作标识已被使用，请刷新后重试','Request already used. Refresh and try again.'], rateLimit:['操作过于频繁，请稍后重试','Too many requests. Please try again later.'], storeMissing:['未找到该门店，请从总入口重新选择','Store not found. Please choose a store from Home.'], serviceType:['服务类型','Service'], completedList:['已完成记录','Completed'], noCompleted:['暂无已完成记录','No completed tickets'], resetAll:['重新开始演示','Restart this store’s demo'], resetAllText:['清空本店所有营业日的号单和叫号记录，号码从 H001 重新开始；保留门店设置，其他门店不受影响。此操作无法撤销。','Clear this store’s tickets and call records for all dates and restart at H001. Store settings remain; other stores are unaffected. This cannot be undone.'],

 brand:['云裳序','Yunshangxu'], brandSub:['汉服门店 · 有序接待','HANFU · QUEUE STUDIO'], home:['总入口','Home'], customer:['顾客取号','Take a ticket'], merchant:['商户工作台','Staff workspace'], display:['门店大屏','Store display'], dashboard:['排队工作台','Queue overview'], history:['号单档案','Ticket archive'], settings:['门店设置','Store settings'], today:['今日','Today'], live:['实时同步中','Live'], offline:['连接中断 · 数据可能已过期','Connection lost · Data may be outdated'], connecting:['正在连接','Connecting'], retry:['重新连接','Reconnect'], all:['全部','All'], waiting:['等待中','Waiting'], called:['正在接待','Now serving'], passed:['过号待重呼','Missed · recall later'], completed:['已完成','Completed'], expired:['跨日失效','Expired'], people:['位','people'], minutes:['分钟','min'], noCurrent:['暂未叫号','No active call'], waitingCount:['等待接待','Waiting'], completedCount:['今日已完成','Served today'], passedCount:['暂时过号','Missed'], totalCount:['今日取号','Tickets today'], number:['号码','Ticket'], created:['取号','Created'], calledAt:['叫号','Called'], endedAt:['结束','Finished'], passCount:['过号次数','Missed calls'], status:['当前状态','Status'], service:['汉服到店服务','Hanfu in-store service'], callNext:['叫下一位','Call next'], recall:['重呼当前号','Recall current'], pass:['过号，稍后安排','Mark missed'], complete:['完成接待','Complete service'], recallSpecific:['重呼该号','Recall ticket'], processing:['正在处理…','Processing…'], nextHint:['按取号顺序接待每一份期待','A little order for every arrival.'], busyHint:['请先完成或过号当前顾客','Complete or pass the current guest first.'], currentLabel:['当前接待号码','NOW SERVING'], currentEmpty:['顾客取号后，点击“叫下一位”开始接待','When guests join, call the next ticket to begin.'], queue:['等待队列','Waiting queue'], missedQueue:['过号队列','Missed queue'], recent:['最新动态','Recent activity'], noEvents:['还没有接待动态','No activity yet'], noWaiting:['此刻无需排队','No one is waiting'], noWaitingHint:['每一场相逢，都有恰好的顺序。','A little pause before the next lovely arrival.'], noPassed:['暂无过号顾客','No missed tickets'], emptyHistory:['当前条件下没有号单','No tickets match your filters'], viewAll:['查看全部档案','View all tickets'], addDemo:['添加演示顾客','Add demo guests'], export:['导出 CSV','Export CSV'], previous:['上一页','Previous'], next:['下一页','Next'], page:['页','page'], demoGuest:['演示顾客','Demo guest'], guest:['到店顾客','Guest'], action:['操作','Action'], welcome:['今日，亦是好时光','A GOOD DAY TO MEET'], workTitle:['有序接待，从容相逢。','A calmer way to welcome.'], workSubtitle:['照顾眼前的每一位，也让等待更有期待。','Give every guest a little more care, and every wait a little more ease.'], scanTitle:['把有序相逢，交给一枚二维码','A small code. A warmer welcome.'], scanHint:['同一 Wi-Fi 下，手机扫码取号','Scan on the same Wi-Fi to join'], copy:['复制取号链接','Copy ticket link'], copied:['链接已复制','Link copied'], openCustomer:['打开顾客端','Open guest page'], openDisplay:['打开门店大屏','Open store display'], soundOn:['语音已开启','Voice on'], soundOff:['开启语音','Enable voice'], noVoice:['当前浏览器不支持语音播报','Voice is unavailable in this browser'], voiceReady:['语音叫号已开启','Voice announcements enabled'], logout:['退出登录','Sign out'], login:['进入工作台','Sign in'], loginTitle:['让每一份等待，都被温柔照顾','Every arrival deserves a little care.'], loginSub:['登录门店，开启今日有序接待。','Sign in to manage today’s queue.'], account:['账号','Account'], password:['口令','Password'], demoCredentials:['演示账号 admin · 口令 123456','Demo: admin / 123456'], loginBad:['账号或口令不正确','Incorrect account or password'], take:['领取今日号码','Take a ticket'], refresh:['查看最新进度','Refresh progress'], takeAgain:['再次取号','Take another ticket'], myTicket:['我的号单','MY TICKET'], yourNumber:['您的到店号码','YOUR TICKET'], ahead:['前方等待','Guests ahead'], estimate:['预计等候','Estimated wait'], estimateNote:['仅供参考，实际以现场接待为准','An estimate only; actual service time may vary.'], noTicket:['一份期待，一个号码','Your visit, in good order.'], noTicketSub:['轻点取号，接下来的等待交给我们。','Join the queue and enjoy a little time for yourself.'], customerTitle:['赴一场从容的相逢','A lovely visit, without the rush.'], customerIntro:['取一个号，把好时光留给自己。','Take a ticket. Make the moment yours.'], waitingTip:['请保留本页，临近叫号时留意现场提示。','Keep this page open and watch for your call.'], calledTip:['轮到您了，请向店员出示此号码。','It’s your turn. Please show your number to our staff.'], passedTip:['暂时错过了叫号？联系店员为您重新安排。','Missed your call? Our staff can help you rejoin.'], completedTip:['感谢到店，愿今日的美好与您相伴。','Thank you for visiting. Take a little beauty with you.'], paused:['暂时停止取号','Ticketing paused'], accepting:['正在接待 · 可取号','Open · tickets available'], storeNotice:['门店小笺','A NOTE FROM OUR STORE'], howItWorks:['从容到店，三步即可','THREE LITTLE STEPS'], step1:['扫码取号','Take a ticket'], step1Text:['无需登记手机号，领取今日到店号码','No phone number needed. Just join today’s queue.'], step2:['安心等候','Enjoy the moment'], step2Text:['实时查看前方人数与等候进度','See your place in the queue as it updates.'], step3:['依号入席','Your turn to shine'], step3Text:['留意屏幕叫号，到店员处开始服务','Watch for your number and meet our staff.'], storeAddress:['门店位置','LOCATION'], homeEyebrow:['云裳相逢，自有其序','EVERY ARRIVAL, IN GOOD ORDER'], homeTitle:['把等待，留给美好。','Make room for a lovely moment.'], homeIntro:['一枚号码，连接门店与顾客。让每一份期待被看见，让每一场相逢更从容。','One little ticket connects guests and staff. A calmer wait. A warmer welcome.'], homeStart:['顾客取号','Join the queue'], homeStaff:['进入商户工作台','Open staff workspace'], threePorts:['一场相逢，三端相连','ONE VISIT. THREE CONNECTED VIEWS.'], guestCard:['号码在手，安心等候','A ticket in hand, a little peace of mind.'], staffCard:['一眼掌握，从容接待','Everything in view, every guest cared for.'], displayCard:['大屏同步，不错过好时光','A clear call, for every lovely arrival.'], enter:['进入','Open'], phoneUrl:['手机访问地址','Phone access URL'], phoneUrlHint:['局域网访问请确保电脑与手机连接同一 Wi-Fi。','Connect your phone and computer to the same Wi-Fi.'], updateQR:['更新二维码','Update QR'], settingsTitle:['细节妥帖，相逢更从容','A few details for a warmer visit.'], acceptingLabel:['开放顾客取号','Accept new tickets'], acceptingHint:['关闭后不影响已有顾客的接待和重呼','Existing guests can still be served when paused.'], minutesLabel:['每位预计接待时长','Estimated minutes per guest'], noticeLabel:['顾客端门店提示','Guest-facing store note'], save:['保存门店设置','Save store settings'], saved:['门店设置已保存','Store settings saved'], resetTitle:['清空今日演示数据','Clear today’s demo data'], resetText:['清空本店今日号单和动态，保留历史日期；今日号码不重复使用。','Clear today’s tickets and activity for this store. Previous days remain. Today’s numbers will not be reused.'], reset:['清空今日数据','Clear today'], confirm:['确认操作','Confirm'], cancel:['取消','Cancel'], confirmReset:['确认清空今日数据？','Clear today’s data?'], seedText:['为当前门店添加 6 位演示顾客，不影响已有号单。','Add six demo guests to this store without changing existing tickets.'], seeded:['已添加6位演示顾客','Six demo guests added'], createdOk:['号码已领取，请留意叫号','Your ticket is ready. Watch for your call.'], reused:['已为您恢复当前有效号单','Your active ticket has been restored'], actionOk:['处理成功，所有页面将同步更新','Done. Connected views will update.'], noServer:['请先运行文件夹内的“启动演示.cmd”，再打开本地地址。','Run the launcher in the demo folder, then open the local URL.'], networkError:['连接暂时不可用，请稍后重试','Unable to connect. Please try again.'], contractError:['返回数据异常，请重新连接','Unexpected response. Please reconnect.'], queueEmpty:['当前没有等待中的顾客','There are no waiting guests'], currentBusy:['请先完成或过号当前顾客','Complete or pass the current guest first'], staleTicket:['号单已被处理，已为您刷新最新状态','This ticket changed. The latest state is now shown.'], authRequired:['登录已失效，请重新登录','Your session expired. Please sign in again.'], queuePaused:['门店暂时停止取号，请联系店员','Ticketing is paused. Please speak with our staff.'], allPages:['全部等待号码将自动轮播','All waiting numbers rotate automatically'], displayWelcome:['静候佳人，依序相逢','A lovely arrival, in its own time.'], displayInvite:['请至接待处，开启今日的美好','Please come to the reception desk.'], fullScreen:['全屏展示','Fullscreen'], minuteShort:['分','min'], noMore:['暂无更多记录','No more records'], avg:['本轮平均接待','Average service'], date:['营业日期','Business date'], historySubtitle:['每一次接待，都有迹可循。','A thoughtful record of every visit.'], footer:['云裳序 · 让相逢，自有其序','YUNSHANGXU · EVERY ARRIVAL, IN GOOD ORDER'], soon:['即将到您','You’re next'], qrUnavailable:['二维码暂不可用，请使用取号链接','QR unavailable. Please use the ticket link.'], pausedNote:['门店暂时停止新取号，已取号码仍会正常接待。','New tickets are paused. Existing tickets will still be served.']
};
export function t(key) {return words[key]?.[language === 'en' ? 1 : 0] || key;}
export function statusText(key) {return t(key);}
export function eventText(key) {return ({created:t('created'),called:t('callNext'),recalled:t('recall'),passed:t('pass'),completed:t('complete'),expired:t('expired'),cancelled:t('cancelled'),'service-started':t('startService'),'return-requested':t('returnBadge'),undo:t('undo'),settings:t('settings'),reset:t('reset'),seed:t('addDemo')})[key] || key;}
