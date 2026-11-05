/* AI workspace: page navigation and local prototype interactions. */
const AI_PROMPT_PLACEHOLDER='发消息或创建任务，/调用指令，@文件或对话';
const aiWorkspace = document.querySelector('#aiWorkspace');
const aiHistoryDefaults = ['参加“数字化创新大赛”的通知','第一季度各区域销售业绩汇报','参加“数字化创新大赛”','关于集团2026年调研实施方案的讨论','组织2026年度员工体检的通知','数据监测与优化策略','永恒的人性探索','我的出差报销标准','工作日统计'];
const aiCommonQuestions = ['如何申请出差及报销？','如何查询我的待办事项？','怎样创建和分享知识库？','如何使用 AI 生成工作汇报？','如何申请加班？','怎样预约会议？','如何查询集团制度？','云盘支持哪些文件类型？','如何联系 IT 服务台？','怎样查看考勤记录？'];
let aiConversations = [];
try { const data = JSON.parse(localStorage.getItem('gx-ai-conversations') || '[]'); if(Array.isArray(data)) aiConversations=data.filter(x=>typeof x.title==='string'&&Array.isArray(x.messages)); } catch {}
let activeConversation = null;
let questionCategory = 'hot';
let selectedAiMode = '智能问答';
const aiIcon = (name) => {
 const paths = {
 edit:'<path d="M15 4H4v16h16V9M10 14l2-5 7-7 3 3-7 7z"/><path d="m16 5 3 3" stroke="#ff4d4f"/>',
 bot:'<rect x="4" y="7" width="16" height="14" rx="4"/><path d="M12 3v4M1 11v6m22-6v6M8 12v4m8-4v4"/><circle cx="12" cy="2" r="1" stroke="#ff4d4f"/>',
 book:'<path d="m2 7 10-5 10 5-10 5zM5 9v9l7 4 7-4V9"/>',
 person:'<circle cx="10" cy="6" r="4"/><path d="M3 21v-4c0-5 11-5 11 0"/><circle cx="18" cy="18" r="3" stroke="#ff4d4f"/><path d="M18 13v2m0 6v2m-5-5h2m6 0h2" stroke="#ff4d4f"/>',
 cloud:'<path d="M7 19H5a4 4 0 0 1-1-8 8 8 0 0 1 15-2 5 5 0 0 1 0 10h-2"/><path d="M12 22V11m-4 4 4-4 4 4" stroke="#ff4d4f"/>',
 ask:'<circle cx="12" cy="12" r="9"/><path d="M7 10h10M8 15q4 3 8 0"/>',
 write:'<path d="m5 20 3-7L18 3l3 3L11 16zM4 3v5m-2-3h5m10 12v5m-2-3h5"/>',
 summary:'<path d="M14 3H4v18h15v-9M8 7h5m-5 4h4m-2 7 3-6 6-6 3 3-6 6z"/>',
 data:'<rect x="3" y="4" width="18" height="15" rx="2"/><path d="m6 14 4-5 4 3 4-6M7 22h10"/>',
 mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
 send:'<path d="m5 12 7-7 7 7M12 5v15"/>',
 copy:'<rect x="7" y="7" width="14" height="14" rx="2"/><path d="M17 7V3H3v14h4"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 19h16"/>',
 refresh:'<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
 share:'<path d="M4 20v-5c0-6 7-6 10-6V4l7 7-7 7v-5c-4 0-7 2-10 7z"/>',
 like:'<path d="M8 10 12 4V2h2c2 1 2 4 1 7h5l-2 12H8zM3 10h5v11H3z"/>',
 dislike:'<path d="M8 14 12 20v2h2c2-1 2-4 1-7h5L18 3H8zM3 14h5V3H3z"/>',
 audio:'<path d="M3 9h4l5-5v16l-5-5H3zM16 8q4 4 0 8m3-11q6 7 0 14"/>',
 file:'<path d="M5 2h9l5 5v15H5zM14 2v6h5M8 12h8m-8 4h8"/>',
 task:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4m8-4v4M7 13l3 3 7-7"/>',
 collapse:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M10 3v18"/>'
 }; return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.ask}</svg>`;
};
aiWorkspace.innerHTML = `
 <button class="ai-collapse" data-ai-command="collapse" aria-label="收起侧栏" aria-expanded="true">${aiIcon('collapse')}</button>
 <h2 class="ai-page-title">新建会话</h2>
 <aside class="ai-sidebar"><nav class="ai-side-nav" aria-label="AI 工作台导航">
 ${[['edit','新建会话','new'],['bot','智能体·技能','agents'],['book','知识库','knowledge'],['person','数字员工管理','employees'],['cloud','云盘','drive']].map(([icon,label,cmd])=>`<button data-ai-command="${cmd}" aria-label="${label}">${aiIcon(icon)}<span>${label}</span></button>`).join('')}
 </nav><section class="ai-history"><div class="ai-history-heading"><h2>历史记录</h2><button data-ai-command="history">更多 ›</button></div><div class="ai-history-list"></div></section></aside>
 <section class="ai-landing"><h1 class="ai-welcome">您好，欢迎使用广智新</h1><div class="ai-feature-grid">
 ${[['write','创作文档','智能写作'],['ask','咨询问答','智能问答'],['ppt','制作PPT','制作PPT'],['data','分析数据','智能数据']].map(([id,title,mode])=>`<button class="ai-feature" data-ai-feature="${mode}"><div class="ai-feature-art ${id}"><img src="assets/ai-${id}.png" alt=""><h2>${title}</h2></div><p>从需求到方案一键生成完整<br>方案</p><span class="ai-feature-arrow" aria-hidden="true">→</span></button>`).join('')}
 </div><div class="ai-question-tabs" role="tablist" aria-label="问题分类"><button role="tab" aria-selected="false" data-ai-category="recent">最近记录</button><button class="active" role="tab" aria-selected="true" data-ai-category="hot">热门问答</button><button role="tab" aria-selected="false" data-ai-category="common">常用问题</button></div><div class="ai-question-list"></div></section>
 <section class="ai-chat-view" aria-label="会话内容" aria-live="polite"></section>
 <section class="ai-market" aria-label="智能体与技能市场" hidden></section>
 <form class="ai-composer"><img class="ai-mascot" src="assets/ai-mascot.png" alt="广智新助手"><div class="ai-context-tray" aria-label="已选择的指令和引用" hidden></div><div id="aiComposerPopover" class="ai-composer-popover" hidden></div><textarea class="ai-prompt" aria-label="输入任务或问题" aria-haspopup="listbox" aria-controls="aiSuggestionList" aria-expanded="false" placeholder="${AI_PROMPT_PLACEHOLDER}"></textarea><input type="file" id="aiFileInput" multiple hidden aria-label="添加附件"><div class="ai-composer-tools"><button type="button" class="ai-add" data-ai-command="attach" aria-label="添加附件">＋</button>
 ${[['ask','智能问答'],['write','智能写作'],['summary','智能摘要'],['data','智能数据']].map(([icon,label])=>`<button type="button" class="ai-mode-button" data-ai-mode="${label}">${aiIcon(icon)}${label}</button>`).join('')}
 <span class="ai-toolbar-spacer"></span><button type="button" class="ai-network" aria-pressed="false" title="联网搜索（演示）">◎ 联网搜索</button><select class="ai-model" aria-label="选择模型"><option value="qwen3.8-27">qwen3.8-27...</option><option value="enterprise">企业知识助手</option></select><button type="button" class="ai-send" aria-label="语音输入" title="语音输入">${aiIcon('mic')}</button></div></form>
 <p class="ai-disclaimer">请勿上传、处理涉及国家秘密、工作秘密、敏感信息等涉密敏感内容</p>
`;
const aiPrompt=document.querySelector('.ai-prompt');
const aiPopover=document.querySelector('#aiComposerPopover');
const aiContextTray=document.querySelector('.ai-context-tray');
const aiCommandsList=[
 {id:'ask',token:'/问答',name:'智能问答',mode:'智能问答',icon:'ask',aliases:'ask question 问答',description:'围绕问题和引用内容展开对话'},
 {id:'write',token:'/写作',name:'智能写作',mode:'智能写作',icon:'write',aliases:'write writing 写作 文档',description:'起草通知、汇报与方案'},
 {id:'summary',token:'/摘要',name:'智能摘要',mode:'智能摘要',icon:'summary',aliases:'summary summarize 摘要 总结',description:'整理文件或对话中的重点'},
 {id:'analyze',token:'/分析',name:'数据分析',mode:'智能数据',icon:'data',aliases:'analyze data 分析 数据',description:'梳理指标、分析思路与行动建议'},
 {id:'ppt',token:'/PPT',name:'制作 PPT',mode:'制作PPT',icon:'file',aliases:'ppt slides 演示',description:'组织演示文稿结构'},
 {id:'task',token:'/任务',name:'创建任务',mode:'创建任务',icon:'task',aliases:'task todo 任务 创建任务',description:'设置任务名称、截止日期和优先级'}
];
const aiExampleFiles=[
 {id:'example-research',name:'集团调研实施方案（示例）.md',kind:'file',type:'text/markdown',text:'示例调研方案：本次调研围绕业务协同、数字化能力及项目推进情况展开。各部门需梳理已有资料，形成问题清单，明确负责人及后续行动。'},
 {id:'example-product',name:'新品研发规划（示例）.md',kind:'file',type:'text/markdown',text:'示例研发规划：首先完成需求调研和方案评审，再组织样品验证与阶段复盘。计划跟踪研发周期、需求变更及测试通过情况。'},
 {id:'example-deployment',name:'项目部署说明（示例）.md',kind:'file',type:'text/markdown',text:'示例部署说明：上线前需完成环境检查、数据备份和回滚演练。上线后由项目负责人确认关键功能，并记录需要持续跟进的问题。'}
];
let aiFiles=[],aiTasks=[],aiReferences=[],aiSelectedCommand=null,aiPicker=null,aiDraftVersion=0;
try{const files=JSON.parse(localStorage.getItem('gx-ai-files')||'[]');if(Array.isArray(files))aiFiles=files.filter(f=>typeof f.id==='string'&&typeof f.name==='string')}catch{}
try{const tasks=JSON.parse(localStorage.getItem('gx-ai-tasks')||'[]');if(Array.isArray(tasks))aiTasks=tasks.filter(t=>typeof t.id==='string'&&typeof t.title==='string')}catch{}
function aiId(prefix){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
aiConversations.forEach(c=>{c.id=c.id||aiId('chat');c.messages=c.messages.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.text==='string');c.messages.forEach(m=>m.id=m.id||aiId('message'))});
function aiSave(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{toast('浏览器存储空间不足，本次内容仅保留在当前页面');return false}}
function persistAiHistory(){aiSave('gx-ai-conversations',aiConversations.slice(0,30))}
function renderAiHistory(){const titles=[...aiConversations.map(c=>c.title),...aiHistoryDefaults];document.querySelector('.ai-history-list').innerHTML=titles.slice(0,9).map((t,i)=>`<button data-ai-history="${i}" title="${esc(t)}">${esc(t)}</button>`).join('')}
function renderAiQuestions(){const questions=questionCategory==='common'?aiCommonQuestions:questionCategory==='recent'?[...aiConversations.map(c=>c.title),...aiHistoryDefaults].slice(0,10):[...aiHistoryDefaults.slice(0,5),...aiHistoryDefaults.slice(0,5)];document.querySelector('.ai-question-list').innerHTML=questions.map((q,i)=>`<button class="ai-question" data-ai-question="${esc(q)}"><span class="ai-question-number">${i+1}.</span><span class="ai-question-text">${esc(q)}</span><span class="ai-question-next">›</span></button>`).join('');document.querySelectorAll('[data-ai-category]').forEach(b=>{const active=b.dataset.aiCategory===questionCategory;b.classList.toggle('active',active);b.setAttribute('aria-selected',active)})}
function switchWorkspace(ai){if(window.navigateWorkspace)return window.navigateWorkspace(ai?'ai':'workbench');document.body.classList.toggle('ai-mode',ai);aiWorkspace.hidden=!ai;document.querySelector('.dashboard').hidden=ai}
actions.ai=()=>switchWorkspace(true);actions.workbench=()=>switchWorkspace(false);
function closeAiPicker(){aiPicker=null;aiPopover.hidden=true;aiPopover.innerHTML='';aiPrompt.setAttribute('aria-expanded','false');aiPrompt.removeAttribute('aria-activedescendant')}
function clearAiDraft(){aiDraftVersion++;aiPrompt.value='';aiReferences=[];aiSelectedCommand=null;selectedAiMode='智能问答';document.querySelector('#aiFileInput').value='';document.querySelectorAll('[data-ai-mode]').forEach(b=>b.classList.remove('selected'));closeAiPicker();renderAiContexts();updateAiSend()}
function newAiConversation(){activeConversation=null;closeAiMarket();aiWorkspace.classList.remove('has-conversation');const title=document.querySelector('.ai-page-title');title.textContent='新建会话';title.title='新建会话';document.querySelector('.ai-chat-view').innerHTML='';clearAiDraft();if('speechSynthesis'in window)speechSynthesis.cancel()}
function updateAiSend(){const filled=!!aiPrompt.value.trim()||aiReferences.length>0;const button=document.querySelector('.ai-send');button.innerHTML=aiIcon(filled?'send':'mic');button.setAttribute('aria-label',filled?'发送消息':'语音输入');button.title=filled?'发送消息':'语音输入';aiPrompt.placeholder=AI_PROMPT_PLACEHOLDER}
function renderAiContexts(){const chips=[];if(aiSelectedCommand)chips.push(`<span class="ai-context-chip command">${aiIcon(aiSelectedCommand.icon)}${aiSelectedCommand.name}<button type="button" data-ai-remove-command aria-label="移除指令">×</button></span>`);aiReferences.forEach((r,i)=>chips.push(`<span class="ai-context-chip">${aiIcon(r.kind==='file'?'file':'ask')}<button type="button" class="ai-context-name" data-ai-context="${i}" title="${esc(r.name)}">${esc(r.name)}</button><button type="button" data-ai-remove-reference="${i}" aria-label="移除引用${esc(r.name)}">×</button></span>`));aiContextTray.innerHTML=chips.join('');aiContextTray.hidden=!chips.length;document.querySelector('.ai-composer').classList.toggle('has-context',chips.length>0);aiWorkspace.classList.toggle('has-draft-context',chips.length>0)}
function chooseAiMode(mode){selectedAiMode=mode;aiSelectedCommand=aiCommandsList.find(c=>c.mode===mode)||null;document.querySelectorAll('[data-ai-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.aiMode===mode));aiPrompt.placeholder=AI_PROMPT_PLACEHOLDER;renderAiContexts();updateAiSend();aiPrompt.focus()}
function aiReferenceText(reference){if(reference.kind==='file')return reference.text||'此文件尚未解析，只能引用名称。';if(typeof reference.text==='string'&&reference.text)return reference.text;const conversation=aiConversations.find(c=>c.id===reference.id);return conversation?conversation.messages.map(m=>`${m.role==='user'?'用户':'助手'}：${m.text}`).join('\n').slice(0,12000):reference.text||'仅保留会话标题。'}
function showAiReference(reference){if(!reference)return;openModal(reference.kind==='file'?'引用文件':'引用对话',`<h3 class="detail-title">${esc(reference.name)}</h3><p class="detail-meta">${reference.kind==='file'?(reference.parsed===false?'仅引用文件名，未解析正文':'本地文件内容'):'历史对话'} · 未上传</p><pre class="ai-reference-preview">${esc(aiReferenceText(reference))}</pre>`)}
function formatAiReply(text){
 const lines=String(text).split('\n');let html='',list=null;
 const endList=()=>{if(list){html+=`</${list}>`;list=null}};
 const inline=value=>esc(value).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
 for(const line of lines){const heading=line.match(/^(#{1,4})\s+(.+)$/),bullet=line.match(/^\s*[-•]\s+(.+)$/),number=line.match(/^\s*\d+[.、]\s+(.+)$/);
  if(!line.trim()){endList();continue}
  if(/^---+$/.test(line.trim())){endList();html+='<hr>';continue}
  if(heading){endList();const tag=heading[1].length<=2?'h3':'h4';html+=`<${tag}>${inline(heading[2])}</${tag}>`;continue}
  if(bullet||number){const kind=bullet?'ul':'ol';if(list!==kind){endList();list=kind;html+=`<${kind}>`};html+=`<li>${inline((bullet||number)[1])}</li>`;continue}
  endList();html+=line.startsWith('> ')?`<blockquote>${inline(line.slice(2))}</blockquote>`:`<p>${inline(line)}</p>`;
 }
 endList();return html;
}
function aiDemoReply(text,mode=selectedAiMode,refs=aiReferences){
 if(refs.length){const snippets=refs.map(r=>{const raw=aiReferenceText(r).replace(/\s+/g,' ').slice(0,230);return `### ${r.name}\n> ${raw}${raw.length>=230?'…':''}`}).join('\n\n');return `## 引用内容梳理\n\n${snippets}\n\n---\n### 建议下一步\n- 明确需要解决的问题、交付形式和完成时间。\n- 核对引用内容中的事实与负责人。\n- 将需要执行的事项整理成任务，并跟进完成情况。\n\n以上为引用片段与预设整理框架，未调用在线模型。`}
 if(text.includes('数据监测与优化策略'))return '## 数据监测与优化策略\n\n### 1、关键指标\n- 优先级：前3秒跳出率（示例目标＜35%）、第7秒互动触发点\n- 转化核心：短链点击率 > GPM > 客单价\n\n### 2、动态调优机制\n- 启用自动熔断：当某版CTR低于均值50%时，5分钟内暂停计划\n- 实时流量倾斜：表现最优组自动获得70%流量分配\n- 双周迭代：拆解爆款元素重组新版本（如保留A版前三帧+B版结尾）\n\n### 3、增效组合\n- 人群包联动：对25–35岁高互动用户追加测试版本\n- 私域反馈：将咨询用户的反馈纳入下一轮内容验证\n\n---\n## 执行要点\n1. 使用短链生成器分流追踪，避免跨版本数据污染\n2. 测试周期≤72小时，结合业务节奏安排复盘\n\n- 最终决策依据：显著性差异检测\n- 考虑Lift值增量（真实转化提升 vs 自然波动）\n\n以上为设计稿中的示例策略。指标、阈值和预算分配应结合实际业务校准，不代表已执行任何投放或优化操作。';
 if(mode==='制作PPT')return `## 演示文稿结构\n\n### 主题\n${text}\n\n1. 项目背景与目标\n2. 当前进展与关键数据\n3. 核心方案与实施计划\n4. 风险与资源需求\n5. 下一步行动\n\n---\n### 准备材料\n- 补充受众、使用场景和期望页数。\n- 使用 @ 引用已有方案或相关文件。`;
 if(mode==='智能数据')return `## 数据分析建议\n\n### 分析目标\n${text}\n\n### 关键步骤\n- 明确统计周期、指标定义与数据来源。\n- 对比实际完成值、目标及同期表现。\n- 找出差异较大的区域或业务，记录可能原因。\n\n---\n### 输出建议\n用结论、数据依据和行动建议组织分析；可使用 @ 引用数据文件。`;
 if(mode==='智能摘要')return `## 摘要整理框架\n\n### 整理目标\n${text}\n\n- 核心结论：记录最重要的判断。\n- 关键事实：保留时间、数字与责任人。\n- 待决事项：列出仍需核实的问题。\n- 下一步行动：明确具体事项与完成时间。\n\n使用 @ 引用文件或历史对话，可在回复中查看所引用的内容。`;
 if(mode==='智能写作'||text.includes('通知'))return `## 文档草稿\n\n### ${text.slice(0,60)}\n\n各部门、各单位：\n\n为有序推进相关工作，请结合实际情况做好组织安排，明确负责人及完成时限，并及时反馈工作进展。\n\n### 待补充信息\n- 工作主题、参与范围与目标。\n- 时间、地点及相关负责人。\n- 材料要求与反馈方式。\n\n---\n可使用 @ 引用既有文档，或输入 /任务 将后续工作创建为任务。`;
 return `## ${text.length<35?text:'处理建议'}\n\n已收到您的消息。您可以补充业务背景、相关资料与希望得到的结果。\n\n### 可以继续做的事\n- 输入 / 选择写作、摘要或数据分析指令。\n- 输入 @ 引用文件或已有对话。\n- 使用 /任务 创建带截止时间的工作事项。\n\n---\n当前为本地交互演示，回复使用预设内容，尚未连接真实模型。`;
}
function aiTaskCard(id){const task=aiTasks.find(t=>t.id===id);if(!task)return '';return `<div class="ai-task-card"><div class="ai-task-card-title">${aiIcon('task')}<strong>${esc(task.title)}</strong><span class="ai-task-state ${task.done?'done':''}">${task.done?'已完成':'待处理'}</span></div><p>${task.due?'截止：'+esc(task.due):'未设置截止时间'}　·　${esc(task.priority)}优先级</p>${task.note?`<p>${esc(task.note)}</p>`:''}<button data-ai-task-toggle="${task.id}" aria-pressed="${!!task.done}">${task.done?'标记未完成':'标记完成'}</button></div>`}
function renderAiConversation(scroll=true){if(!activeConversation)return;aiWorkspace.classList.add('has-conversation');const title=document.querySelector('.ai-page-title');title.textContent=activeConversation.title;title.title=activeConversation.title;const box=document.querySelector('.ai-chat-view');const previous=box.scrollTop;
 box.innerHTML=activeConversation.messages.map(m=>m.role==='user'?`<article class="ai-chat-message user-message"><div class="ai-user-bubble">${esc(m.text)}</div>${m.refs?.length?`<div class="ai-sent-references">${m.refs.map((r,i)=>`<button data-ai-sent-ref="${m.id}:${i}">${aiIcon(r.kind==='file'?'file':'ask')}${esc(r.name)}</button>`).join('')}</div>`:''}</article>`:`<article class="ai-chat-message assistant-message" data-ai-message="${m.id}"><div class="ai-reply-status"><img src="assets/ai.png" alt="广智新 AI"><span>已思考</span><small title="当前回复由本地示例逻辑生成，未连接真实模型">示例回复</small>${m.regenerations?'<small>已重新生成</small>':''}</div><div class="ai-reply-body">${formatAiReply(m.text)}</div>${m.taskId?aiTaskCard(m.taskId):''}<div class="ai-reply-actions" aria-label="回复操作">${[['audio','朗读'],['copy','复制'],['download','下载'],['refresh','重新生成'],['share','分享'],['like','有帮助'],['dislike','无帮助']].map(([action,label])=>`<button type="button" data-ai-reply-action="${action}" data-message-id="${m.id}" aria-label="${label}" title="${label}" ${['like','dislike'].includes(action)?`aria-pressed="${m.vote===action}"`:''}>${aiIcon(action)}</button>`).join('')}</div></article>`).join('');
 if(scroll){const users=box.querySelectorAll('.user-message');box.scrollTop=users.length>1?users[users.length-1].offsetTop:0;}else box.scrollTop=previous;
}
function ensureAiConversation(title){if(!activeConversation){activeConversation={id:aiId('chat'),title:title.slice(0,40),messages:[]};aiConversations.unshift(activeConversation)}}
function pushAiExchange(text,reply,extra={}){ensureAiConversation(text);const refs=aiReferences.map(r=>({...r,text:aiReferenceText(r).slice(0,12000)}));activeConversation.messages.push({id:aiId('message'),role:'user',text,refs},{id:aiId('message'),role:'assistant',text:reply,mode:selectedAiMode,...extra});persistAiHistory();renderAiHistory();renderAiQuestions();renderAiConversation();aiPrompt.value='';aiReferences=[];document.querySelector('#aiFileInput').value='';closeAiPicker();renderAiContexts();updateAiSend()}
function sendAiMessage(value){let text=value.trim();if(!text&&aiReferences.length)text='请整理引用内容的重点';if(!text)return;const command=text.match(/^\/(\S+)\s*/);if(command){const entry=aiCommandsList.find(c=>c.token.slice(1).toLowerCase()===command[1].toLowerCase()||c.id===command[1].toLowerCase()||c.aliases.split(' ').includes(command[1]));if(entry){text=text.slice(command[0].length).trim();if(entry.id==='task'){openAiTaskForm(text);return}chooseAiMode(entry.mode);if(!text){aiPrompt.value='';updateAiSend();return}}}
 if(/^创建任务[：:\s]/.test(text)){openAiTaskForm(text.replace(/^创建任务[：:\s]+/,''));return}pushAiExchange(text,aiDemoReply(text));}
function pickerToken(){const before=aiPrompt.value.slice(0,aiPrompt.selectionStart);let match=before.match(/(^|\s)\/([^\s/]*)$/);if(match)return {type:'commands',query:match[2],start:before.length-match[2].length-1,end:before.length};match=before.match(/@([^\s@]*)$/);if(match){const start=before.length-match[1].length-1;if(start>0&&/[a-zA-Z0-9._]/.test(before[start-1]))return null;return {type:'references',query:match[1],start,end:before.length}}return null}
function availableReferences(kind,query){const list=kind==='files'?[...aiFiles,...aiExampleFiles]:aiConversations.map(c=>({id:c.id,name:c.title,kind:'conversation',text:c.messages.map(m=>`${m.role==='user'?'用户':'助手'}：${m.text}`).join('\n')})).concat(aiHistoryDefaults.filter(title=>!aiConversations.some(c=>c.title===title)).map((title,i)=>({id:'example-chat-'+i,name:title+'（示例）',kind:'conversation',text:`示例历史对话\n用户：${title}\n助手：${aiDemoReply(title,'智能问答',[])}`})));return list.filter(r=>r.name.toLowerCase().includes(query.toLowerCase())).slice(0,12)}
function renderAiPicker(){if(!aiPicker)return;let rows=[];if(aiPicker.type==='commands')rows=aiCommandsList.filter(c=>`${c.name} ${c.aliases} ${c.token}`.toLowerCase().includes(aiPicker.query.toLowerCase())).map(c=>({...c,key:c.id}));else rows=availableReferences(aiPicker.kind||'files',aiPicker.query).map(r=>({...r,key:r.id}));aiPicker.rows=rows;aiPicker.index=Math.max(0,Math.min(aiPicker.index||0,rows.length-1));aiPopover.hidden=false;
 aiPopover.innerHTML=`<div class="ai-picker-heading"><strong>${aiPicker.type==='commands'?'调用指令':'引用文件或对话'}</strong><span>↑ ↓ 选择　Enter 确认　Esc 关闭</span></div>${aiPicker.type==='references'?`<div class="ai-picker-tabs"><button type="button" data-ai-ref-kind="files" class="${aiPicker.kind==='files'?'active':''}">文件</button><button type="button" data-ai-ref-kind="conversations" class="${aiPicker.kind==='conversations'?'active':''}">对话</button><button type="button" class="ai-picker-upload" data-ai-upload>＋ 添加本地文件</button></div>`:''}<div id="aiSuggestionList" role="listbox" aria-label="${aiPicker.type==='commands'?'指令':'引用'}列表">${rows.length?rows.map((r,i)=>`<button type="button" id="aiSuggestion-${i}" role="option" aria-selected="${i===aiPicker.index}" class="ai-suggestion ${i===aiPicker.index?'active':''}" data-ai-pick="${i}">${aiIcon(r.icon||(r.kind==='file'?'file':'ask'))}<span><strong>${esc(r.name)}</strong><small>${esc(r.description||(r.kind==='file'?(r.parsed===false?'仅引用名称，未解析正文':'本地文件 · 可查看内容'):'历史对话'))}</small></span>${r.token?`<em>${r.token}</em>`:''}</button>`).join(''):'<div class="ai-picker-empty">暂无匹配内容</div>'}</div>`;
 aiPrompt.setAttribute('aria-expanded','true');if(rows.length)aiPrompt.setAttribute('aria-activedescendant',`aiSuggestion-${aiPicker.index}`);else aiPrompt.removeAttribute('aria-activedescendant');}
function updateAiPicker(){const token=pickerToken();if(!token){closeAiPicker();return}const previous=aiPicker;aiPicker={...token,kind:token.type==='references'?(previous?.kind||'files'):null,index:0};renderAiPicker()}
function removePickerToken(){if(!aiPicker)return;const {start,end}=aiPicker;aiPrompt.value=aiPrompt.value.slice(0,start)+aiPrompt.value.slice(end);aiPrompt.setSelectionRange(start,start)}
function pickAiSuggestion(index){if(!aiPicker)return;const entry=aiPicker.rows[index],type=aiPicker.type;if(!entry)return;removePickerToken();closeAiPicker();if(type==='commands'){if(entry.id==='task'){openAiTaskForm(aiPrompt.value.trim());return}chooseAiMode(entry.mode)}else{if(!aiReferences.some(r=>r.id===entry.id&&r.kind===entry.kind))aiReferences.push({...entry,text:aiReferenceText(entry).slice(0,12000)});renderAiContexts();updateAiSend();aiPrompt.focus()}}
function showAiAddMenu(){closeAiPicker();aiPopover.hidden=false;aiPopover.innerHTML=`<div class="ai-add-menu"><button type="button" data-ai-upload>${aiIcon('file')}添加本地文件</button><button type="button" data-ai-new-task>${aiIcon('task')}创建任务</button><button type="button" data-ai-insert-reference>${aiIcon('ask')}引用文件或对话</button><button type="button" data-ai-show-tasks>${aiIcon('task')}我的任务</button></div>`}
function insertAiTrigger(character){aiPrompt.focus();const start=aiPrompt.selectionStart,end=aiPrompt.selectionEnd;aiPrompt.setRangeText(character,start,end,'end');updateAiSend();updateAiPicker()}
async function uploadAiFiles(files){const version=aiDraftVersion;closeAiPicker();for(const file of Array.from(files).slice(0,10)){if(file.size>10*1024*1024){toast(`${file.name} 超过10MB，未添加`);continue}let text='',parsed=false;const readable=/\.(txt|md|csv|tsv|json|log)$/i.test(file.name)||file.type.startsWith('text/');if(readable&&file.size<=2*1024*1024){try{text=(await file.text()).slice(0,30000);parsed=true}catch{}}const record={id:aiId('file'),kind:'file',name:file.name,type:file.type,size:file.size,text,parsed};aiFiles.unshift(record);if(version===aiDraftVersion)aiReferences.push(record)}aiFiles=aiFiles.slice(0,20);aiSave('gx-ai-files',aiFiles);renderAiContexts();updateAiSend();document.querySelector('#aiFileInput').value='';aiPrompt.focus()}
function openAiTaskForm(title=''){closeAiPicker();openModal('创建任务',`<form id="aiTaskForm"><label class="field">任务名称<input name="title" value="${esc(title)}" required maxlength="100" placeholder="例如：完成项目周报"></label><div class="ai-task-form-row"><label class="field">截止日期<input name="due" type="date"></label><label class="field">优先级<select name="priority"><option>普通</option><option>高</option><option>低</option></select></label></div><label class="field">任务说明<textarea name="note" maxlength="1500" placeholder="补充交付要求、负责人或注意事项"></textarea></label><p class="detail-meta">任务保存在当前浏览器，可在对话或“＋ → 我的任务”中查看。</p><div class="modal-actions"><button type="button" class="secondary" data-close>取消</button><button class="primary">创建任务</button></div></form>`);document.querySelector('#aiTaskForm').onsubmit=e=>{e.preventDefault();const data=new FormData(e.target),task={id:aiId('task'),title:String(data.get('title')).trim(),due:data.get('due'),priority:data.get('priority'),note:data.get('note'),done:false};if(!task.title)return;aiTasks.unshift(task);aiSave('gx-ai-tasks',aiTasks);modal.close();pushAiExchange(`创建任务：${task.title}`,'## 任务已创建\n\n您可以在下方更新任务状态。',{taskId:task.id});};}
function showAiTasks(){closeAiPicker();openModal('我的任务',aiTasks.length?`<div class="ai-task-list">${aiTasks.map(t=>aiTaskCard(t.id)).join('')}</div>`:'<p class="empty">还没有任务</p><div class="modal-actions"><button class="primary" data-ai-new-task>创建任务</button></div>')}
async function copyAiText(text){try{await navigator.clipboard.writeText(text);toast('已复制');return}catch{}const input=document.createElement('textarea');input.value=text;input.style.cssText='position:fixed;left:-9999px';document.body.append(input);input.select();let copied=false;try{copied=document.execCommand('copy')}catch{}input.remove();if(copied)toast('已复制');else openModal('复制内容',`<label class="field">请选择并复制<textarea readonly>${esc(text)}</textarea></label>`)}
function plainAiText(text){return text.replace(/^#{1,4}\s+/gm,'').replace(/\*\*/g,'').replace(/^---+$/gm,'')}
function performAiReplyAction(action,id){const message=activeConversation?.messages.find(m=>m.id===id);if(!message)return;const text=plainAiText(message.text);
 if(action==='copy'){copyAiText(text);return}
 if(action==='download'){const blob=new Blob([message.text],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=(activeConversation.title.replace(/[\\/:*?"<>|]/g,'-').slice(0,50)||'AI回复')+'.md';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return}
 if(action==='audio'){if(!('speechSynthesis'in window)){toast('当前浏览器不支持朗读');return}if(speechSynthesis.speaking){speechSynthesis.cancel();toast('已停止朗读');return}const utterance=new SpeechSynthesisUtterance(text);utterance.lang='zh-CN';utterance.onerror=()=>toast('朗读暂不可用，请检查浏览器语音支持');speechSynthesis.speak(utterance);return}
 if(action==='refresh'){if(message.taskId){toast('任务已创建，无需重新生成');return}const index=activeConversation.messages.indexOf(message),user=activeConversation.messages.slice(0,index).reverse().find(m=>m.role==='user');message.text=aiDemoReply(user?.text||activeConversation.title,message.mode||'智能问答',user?.refs||[]);message.regenerations=(message.regenerations||0)+1;persistAiHistory();renderAiConversation(false);return}
 if(action==='share'){const transcript=activeConversation.messages.map(m=>`${m.role==='user'?'我':'广智新 AI'}：\n${plainAiText(m.text)}`).join('\n\n');openModal('分享对话',`<h3>${esc(activeConversation.title)}</h3><p class="detail-text">复制对话文本后，可粘贴分享给同事。</p><textarea class="ai-share-text" readonly>${esc(transcript)}</textarea><div class="modal-actions"><button class="primary" id="aiCopyTranscript">复制对话</button></div>`);document.querySelector('#aiCopyTranscript').onclick=()=>copyAiText(transcript);return}
 if(['like','dislike'].includes(action)){message.vote=message.vote===action?null:action;persistAiHistory();renderAiConversation(false)}
}
function openAiHistory(index){closeAiMarket();closeAiPicker();if(modal.open)modal.close();clearAiDraft();if(index<aiConversations.length){activeConversation=aiConversations[index]}else{const title=aiHistoryDefaults[index-aiConversations.length];if(!title)return;activeConversation={id:aiId('chat'),title,messages:[{id:aiId('message'),role:'user',text:title},{id:aiId('message'),role:'assistant',text:aiDemoReply(title,'智能问答',[]),mode:'智能问答'}]};aiConversations.unshift(activeConversation);persistAiHistory();renderAiHistory();renderAiQuestions()}renderAiConversation()}
const aiMarketCategories=['全部','常用','热门','官方','个人','组织','法务','财务','人力'];
const aiMarketDefaults=[
 {name:'智能问答',description:'一站式答疑问',icon:'ask',tone:'blue',mode:'智能问答',categories:['常用','热门','官方']},
 {name:'智能写作',description:'快速生成文案',icon:'write',tone:'purple',mode:'智能写作',categories:['常用','热门','官方']},
 {name:'智能数据',description:'分析数据制报表',icon:'data',tone:'orange',mode:'智能数据',categories:['常用','热门','官方','财务']},
 {name:'法智小新',description:'解法规，答操作',icon:'summary',tone:'cyan',mode:'智能问答',categories:['官方','法务']},
 {name:'智能摘要',description:'提炼文章要点',icon:'book',tone:'green',mode:'智能摘要',categories:['常用','官方']},
 {name:'财务共享',description:'一句话提交出差申请单',icon:'data',tone:'orange',mode:'智能数据',categories:['官方','财务']},
 {name:'AI+员工服务',description:'员工服务与常见问题咨询',icon:'write',tone:'purple',mode:'智能问答',categories:['官方','人力']}
];
let aiMarketTab='智能体',aiMarketCategory='全部',aiMarketQuery='',aiMarketCustom=[];
try{const items=JSON.parse(localStorage.getItem('gx-ai-market-items')||'[]');if(Array.isArray(items))aiMarketCustom=items.filter(x=>x&&typeof x.name==='string'&&typeof x.description==='string')}catch{}
function closeAiMarket(){aiWorkspace.classList.remove('is-market');document.querySelector('.ai-market').hidden=true;document.querySelector('[data-ai-command="agents"]').classList.remove('active')}
function openAiMarket(){closeAiPicker();aiWorkspace.classList.add('is-market');document.querySelector('.ai-market').hidden=false;document.querySelector('[data-ai-command="agents"]').classList.add('active');renderAiMarket()}
function marketItems(){return [...aiMarketDefaults,...aiMarketCustom].filter(item=>(item.custom?item.kind===aiMarketTab:aiMarketTab==='智能体'||['智能问答','智能写作','智能数据','智能摘要'].includes(item.name))&&(aiMarketCategory==='全部'||(item.categories||[]).includes(aiMarketCategory))&&`${item.name} ${item.description}`.toLowerCase().includes(aiMarketQuery.toLowerCase()))}
function renderAiMarket(){const market=document.querySelector('.ai-market');const items=marketItems();market.innerHTML=`<div class="ai-market-head"><h2><span class="orange-bar"></span>智能体·技能</h2><div class="ai-market-tabs" role="tablist" aria-label="市场类型">${['智能体','技能'].map(tab=>`<button role="tab" aria-selected="${aiMarketTab===tab}" class="${aiMarketTab===tab?'active':''}" data-market-tab="${tab}">${tab}</button>`).join('')}</div><button class="ai-market-create" data-market-create>＋ 创建</button></div><div class="ai-market-toolbar"><div class="ai-market-categories" aria-label="分类筛选">${aiMarketCategories.map(category=>`<button data-market-category="${category}" class="${aiMarketCategory===category?'active':''}" aria-pressed="${aiMarketCategory===category}">${category}</button>`).join('')}</div><label class="ai-market-search">${aiIcon('ask')}<input type="search" aria-label="搜索智能体和技能" placeholder="请输入" value="${esc(aiMarketQuery)}"></label></div><div class="ai-market-grid">${items.length?items.map(item=>`<button class="ai-market-card" data-market-item="${esc(item.name)}"><span class="ai-market-icon ${esc(item.tone||'blue')}">${aiIcon(item.icon)}</span><span class="ai-market-card-copy"><strong>${esc(item.name)}</strong><span title="${esc(item.description)}">${esc(item.description)}</span><small>${item.custom?'个人创建':'♨ 2万+ · @广新集团'}</small></span></button>`).join(''):'<p class="ai-market-empty">暂无匹配的内容</p>'}</div>`;market.querySelector('input').addEventListener('input',e=>{aiMarketQuery=e.target.value;const position=e.target.selectionStart;renderAiMarket();const input=market.querySelector('input');input.focus();input.setSelectionRange(position,position)})}
function createAiMarketItem(){openModal(`创建${aiMarketTab}`,`<form id="aiMarketCreateForm"><label class="field">名称<input name="name" maxlength="30" required></label><label class="field">简介<input name="description" maxlength="60" required></label><div class="modal-actions"><button class="primary" type="submit">创建</button></div></form>`);document.querySelector('#aiMarketCreateForm').onsubmit=e=>{e.preventDefault();const data=new FormData(e.target),name=String(data.get('name')).trim(),description=String(data.get('description')).trim();if(!name||!description)return;if([...aiMarketDefaults,...aiMarketCustom].some(item=>item.name===name)){toast('名称已存在');return}aiMarketCustom.push({name,description,kind:aiMarketTab,icon:'bot',tone:'blue',mode:'智能问答',categories:['个人'],custom:true});aiSave('gx-ai-market-items',aiMarketCustom);aiMarketCategory='全部';aiMarketQuery='';modal.close();renderAiMarket();toast('创建成功')}}
const aiCommands={new:newAiConversation,collapse:()=>{const collapsed=document.querySelector('.ai-sidebar').classList.toggle('collapsed');document.body.classList.toggle('ai-sidebar-collapsed',collapsed);const button=document.querySelector('.ai-collapse');button.setAttribute('aria-expanded',String(!collapsed));button.setAttribute('aria-label',collapsed?'展开侧栏':'收起侧栏')},attach:showAiAddMenu,knowledge:()=>showApp('知识库'),drive:()=>showApp('云盘'),agents:()=>openModal('智能体·技能',`<p class="detail-text">选择一个技能开始新任务</p>${aiCommandsList.filter(c=>c.id!=='task').map(c=>`<button class="result" data-ai-feature="${c.mode}">${c.name}　›</button>`).join('')}`),employees:()=>openModal('数字员工管理','<p class="detail-text">数字员工服务入口 · 本地演示</p><div class="result">办公助手　<span class="status">可体验</span></div><div class="result">知识助手　<span class="detail-meta">待接入知识库</span></div>'),history:()=>openModal('历史记录',[...aiConversations.map(c=>c.title),...aiHistoryDefaults].map((t,i)=>`<button class="result" data-ai-history="${i}">${esc(t)}</button>`).join('')),feedback:()=>{openModal('意见反馈','<form id="aiFeedbackForm"><label class="field">您的意见<textarea required placeholder="请描述问题或建议"></textarea></label><div class="modal-actions"><button class="primary">保存反馈</button></div></form>');document.querySelector('#aiFeedbackForm').onsubmit=e=>{e.preventDefault();aiSave('gx-ai-feedback',e.target.querySelector('textarea').value);modal.close();toast('反馈已保存至本地')}}};
aiCommands.agents=openAiMarket;
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.aiCommand)aiCommands[b.dataset.aiCommand]?.();if(b.dataset.aiCategory){questionCategory=b.dataset.aiCategory;renderAiQuestions()}
 if(b.dataset.marketTab){aiMarketTab=b.dataset.marketTab;aiMarketCategory='全部';aiMarketQuery='';renderAiMarket()}
 if(b.dataset.marketCategory){aiMarketCategory=b.dataset.marketCategory;renderAiMarket()}
 if(b.hasAttribute('data-market-create'))createAiMarketItem();
 if(b.dataset.marketItem){const item=[...aiMarketDefaults,...aiMarketCustom].find(entry=>entry.name===b.dataset.marketItem);if(item){newAiConversation();chooseAiMode(item.mode||'智能问答')}}
 if(b.dataset.aiFeature){if(modal.open)modal.close();chooseAiMode(b.dataset.aiFeature)}if(b.dataset.aiMode)chooseAiMode(b.dataset.aiMode);
 if(b.dataset.aiQuestion){aiPrompt.value=b.dataset.aiQuestion;updateAiSend();aiPrompt.focus()}
 if(b.dataset.aiHistory!==undefined)openAiHistory(+b.dataset.aiHistory);
 if(b.dataset.aiPick!==undefined)pickAiSuggestion(+b.dataset.aiPick);
 if(b.dataset.aiRefKind&&aiPicker){aiPicker.kind=b.dataset.aiRefKind;aiPicker.index=0;renderAiPicker();aiPrompt.focus()}
 if(b.hasAttribute('data-ai-upload')){closeAiPicker();document.querySelector('#aiFileInput').click()}
 if(b.hasAttribute('data-ai-insert-reference')){closeAiPicker();insertAiTrigger('@')}
 if(b.hasAttribute('data-ai-new-task'))openAiTaskForm(aiPrompt.value.trim());if(b.hasAttribute('data-ai-show-tasks'))showAiTasks();
 if(b.hasAttribute('data-ai-remove-command')){aiSelectedCommand=null;selectedAiMode='智能问答';renderAiContexts();document.querySelectorAll('[data-ai-mode]').forEach(b=>b.classList.remove('selected'))}
 if(b.dataset.aiRemoveReference!==undefined){aiReferences.splice(+b.dataset.aiRemoveReference,1);renderAiContexts();updateAiSend()}
 if(b.dataset.aiContext!==undefined)showAiReference(aiReferences[+b.dataset.aiContext]);
 if(b.dataset.aiSentRef){const [id,index]=b.dataset.aiSentRef.split(':');showAiReference(activeConversation?.messages.find(m=>m.id===id)?.refs?.[+index])}
 if(b.dataset.aiReplyAction)performAiReplyAction(b.dataset.aiReplyAction,b.dataset.messageId);
 if(b.dataset.aiTaskToggle){const task=aiTasks.find(t=>t.id===b.dataset.aiTaskToggle);if(task){task.done=!task.done;aiSave('gx-ai-tasks',aiTasks);renderAiConversation(false);if(modal.open&&document.querySelector('#modalTitle').textContent==='我的任务')showAiTasks()}}
});
aiPrompt.addEventListener('input',e=>{updateAiSend();if(!e.isComposing)updateAiPicker()});aiPrompt.addEventListener('compositionend',updateAiPicker);aiPrompt.addEventListener('click',()=>{if(pickerToken())updateAiPicker()});
aiPrompt.addEventListener('keydown',e=>{if(e.isComposing)return;if(aiPicker){if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();const n=aiPicker.rows.length;if(n)aiPicker.index=(aiPicker.index+(e.key==='ArrowDown'?1:-1)+n)%n;renderAiPicker();document.querySelector('.ai-suggestion.active')?.scrollIntoView({block:'nearest'});return}if(e.key==='Escape'){e.preventDefault();closeAiPicker();return}if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();pickAiSuggestion(aiPicker.index);return}if(e.key==='Tab'){closeAiPicker();return}}if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAiMessage(aiPrompt.value)}});
document.querySelector('.ai-composer').onsubmit=e=>{e.preventDefault();sendAiMessage(aiPrompt.value)};
document.querySelector('.ai-send').onclick=()=>{if(aiPrompt.value.trim()||aiReferences.length)sendAiMessage(aiPrompt.value);else toast('语音输入尚未接入，请使用文字输入')};
document.querySelector('.ai-network').onclick=e=>{const b=e.currentTarget,enabled=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(enabled));toast(enabled?'已选择联网搜索模式（演示，尚未连接搜索服务）':'已关闭联网搜索')};
document.querySelector('#aiFileInput').onchange=e=>uploadAiFiles(e.target.files);
document.addEventListener('pointerdown',e=>{if(!aiPopover.hidden&&!e.target.closest('.ai-composer'))closeAiPicker()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!aiPopover.hidden)closeAiPicker()});
document.addEventListener('workspacechange',e=>{if(e.detail.page!=='ai'){closeAiPicker();if('speechSynthesis'in window)speechSynthesis.cancel()}});
const thanksStyles=['简洁明了','轻松有趣','温柔抒情','积极向上','尊重得体'];
const thanksBlessings={
 '简洁明了':{
  0:'陈晓晓，入职一周年快乐！感谢你这一年的付出，期待与你继续并肩同行。',
  1:'陈晓晓，入职一周年快乐！过去一年辛苦了，未来的路一起走。',
  2:'陈晓晓，入职一周年快乐！愿新的一岁工作顺遂，我们一起加油。'
 },
 '轻松有趣':{
  0:'陈晓晓，入职一周年啦！官方消息：恭喜你解锁「老员工」成就，继续升级打怪！',
  1:'陈晓晓，入职一周年快乐！工位旁的绿植都比你有经验了，但你的笑容最加分。',
  2:'陈晓晓，入职一周年快乐！咖啡续了一年的杯，友情和默契也一起升级。'
 },
 '温柔抒情':{
  0:'陈晓晓，入职一周年快乐。三百多个日夜，你温柔而坚定地做好每一件小事，这份坚持值得被看见、被感谢。',
  1:'陈晓晓，入职一周年快乐。感谢你把热爱带进每一天的工作，愿未来的日子，温暖与好运常伴。',
  2:'陈晓晓，入职一周年快乐。与你共事的日子，总让人安心。愿新的一程，依然眼里有光、心中有暖。'
 },
 '积极向上':{
  0:'陈晓晓，入职一周年快乐！新的一岁，愿你乘势而上，再创佳绩，我们一起向更高处出发。',
  1:'陈晓晓，入职一周年快乐！愿你在新的阶段勇往直前，把热爱做成成绩，把付出变成勋章。',
  2:'陈晓晓，入职一周年快乐！感谢你的全力以赴，未来可期，我们一起把目标变成现实。'
 },
 '尊重得体':{
  0:'陈晓晓，入职一周年快乐。感谢您一年来的辛勤付出与专业担当，愿您工作顺遂、前程似锦。',
  1:'陈晓晓，入职一周年快乐。感谢您一直以来的敬业与协作，祝您在新的阶段再创佳绩。',
  2:'陈晓晓，入职一周年快乐。感谢您的付出与坚守，愿未来合作顺利、收获满满。'
 }
};
function currentThanksStyle(){return document.querySelector('.thanks-tag.active')?.dataset.thanksTag||'简洁明了'}
function updateThanksCounter(){const box=document.querySelector('#thanksBox');if(!box)return;document.querySelector('.thanks-count').textContent=`${box.value.length}/200`}
function renderThanksBlessing(){const box=document.querySelector('#thanksBox');if(!box)return;box.value=thanksBlessings[currentThanksStyle()][thanksVariant%3];updateThanksCounter()}
function updateThanksTags(){document.querySelectorAll('.thanks-tag').forEach(t=>t.classList.toggle('active',t.dataset.thanksTag===currentThanksStyle()))}
let thanksVariant=0;
function openThanksDialog(){
 const esc2=v=>String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
 const html=`<div class="thanks-dialog-body"><button class="thanks-close" aria-label="关闭祝福弹窗" title="关闭"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg></button><div class="thanks-hero-wrap"><img class="thanks-hero" src="assets/thanks-anniversary-hero.png" alt="送入职周年祝福啦"><div class="thanks-hero-fade"></div></div><div class="thanks-card"><div class="thanks-head"><span class="thanks-tip">写一条给陈晓晓的入职周年祝福</span></div><div class="thanks-tags" role="tablist" aria-label="祝福风格">${thanksStyles.map((t,i)=>`<button class="thanks-tag${i===0?' active':''}" data-thanks-tag="${esc2(t)}" role="tab" aria-selected="${i===0}">${esc2(t)}</button>`).join('')}</div><div class="thanks-divider"></div><textarea id="thanksBox" maxlength="200" aria-label="写一条给陈晓晓的入职周年祝福" placeholder="写一条给陈晓晓的入职周年祝福"></textarea><div class="thanks-foot"><button type="button" class="thanks-emoji" data-thanks-emoji aria-label="插入表情" title="插入表情"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="10" r="1.15" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.15" fill="currentColor" stroke="none"/><path d="M8 14.5q4 3 8 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button><span class="thanks-footer-right"><button type="button" data-thanks-reroll title="换一换"><svg viewBox="0 0 24 24" class="thanks-reroll-icon" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4.5h-4.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>换一换</button><span class="thanks-count">0/200</span></span></div></div><button class="thanks-send" data-thanks-send>发送IM祝福</button></div>`;
 openModal('送入职周年祝福',html);
 modal.classList.add('thanks-dialog');
 modal.querySelector('.thanks-close').onclick=()=>modal.close();
 modal.querySelector('[data-thanks-emoji]').onclick=e=>{const box=modal.querySelector('#thanksBox');const s=box.selectionStart??box.value.length,en=box.selectionEnd??s;box.setRangeText('😊',s,en,'end');updateThanksCounter();box.focus()};
 renderThanksBlessing();
 updateThanksTags();
 modal.querySelector('#thanksBox').addEventListener('input',updateThanksCounter);
 modal.addEventListener('close',()=>modal.classList.remove('thanks-dialog'),{once:true});
}

document.addEventListener('click',e=>{
 if(!e.target.closest('[data-brief-thanks]'))return;
 e.stopPropagation();
 openThanksDialog();
});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-thanks-tag')){thanksVariant=0;updateThanksTags();renderThanksBlessing();return}
 if(b.hasAttribute('data-thanks-reroll')){thanksVariant=(thanksVariant+1)%3;renderThanksBlessing();return}
 if(b.hasAttribute('data-thanks-send')){
  const box=modal.querySelector('#thanksBox');
  const text=box?.value.trim()||'';
  if(!text){toast('请先输入祝福内容');box?.focus();return}
  box.value='';
  modal.close();
  try{switchWorkspace(true);newAiConversation()}catch{}
  pushAiExchange(text,'## IM 祝福已发送\n\n已按您编辑的内容发送给陈晓晓，她可在 IM 中查收。\n\n- 发送内容：'+text+'\n- 发送渠道：IM 私信\n- 发送对象：陈晓晓（入职 1 周年）\n\n祝您与同事的沟通愉快。如需生成感谢信、贺卡文案或部门群祝福，随时告诉我。');
  toast('IM 祝福已发送');
  return}
});
modal.addEventListener('close',()=>{const b=document.querySelector('.thanks-close');if(b)b.remove()});
renderAiHistory();renderAiQuestions();updateAiSend();
