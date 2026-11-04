/* Portal presentation: official news links and explicitly local sample metrics. */
(() => {
 const newsView=document.querySelector('#portalNews'),dataView=document.querySelector('#portalData');
 const toolbar=document.querySelector('.floating-tools');
 const initialButtons=toolbar.innerHTML;
 const articleData=window.portalArticles;
 const icon=name=>`<svg aria-hidden="true"><use href="#${name}"/></svg>`;
 const bulletinTitles=['广东先进新材料产业集群加快布局','高性能复合材料下游需求增长','省级新材料专项扶持政策落地，重点攻关卡脖子材料','生物基、可降解新材料商业化进程加快','新材料产学研对接平台扩容，校企联合攻关项目持续落地'];
 let currentPage=document.body.classList.contains('ai-mode')?'ai':'workbench';
 let newsTab='推荐',groupTab='最新',bannerIndex=0;
 const searchValues={news:'',group:''};
 const fmt=(n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
 window.navigateWorkspace=page=>{
   if(modal.open)modal.close();
   currentPage=page;
   const portal=page==='portal-news'||page==='portal-data';
   document.body.classList.toggle('portal-mode',portal);
   document.body.classList.toggle('ai-mode',page==='ai');
   document.querySelector('.dashboard').hidden=page!=='workbench';
   document.querySelector('#aiWorkspace').hidden=page!=='ai';
   newsView.hidden=page!=='portal-news';dataView.hidden=page!=='portal-data';
   document.querySelectorAll('[data-nav]').forEach(b=>{const active=b.dataset.nav===(portal?'广新门户':'工作台');b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
   if(portal){
     if(!toolbar.querySelector('[data-action="portalNews"]'))toolbar.innerHTML=`<button data-action="portalNews" aria-label="资讯">${icon('doc')}<span>资讯</span></button><button data-action="portalData" aria-label="数据">${icon('bars')}<span>数据</span></button>`;
     toolbar.querySelector('[data-action="portalNews"]').setAttribute('aria-pressed',String(page==='portal-news'));
     toolbar.querySelector('[data-action="portalData"]').setAttribute('aria-pressed',String(page==='portal-data'));
   }else{
     if(!toolbar.querySelector('[data-action="ai"]'))toolbar.innerHTML=initialButtons;
     toolbar.querySelector('[data-action="ai"]').setAttribute('aria-pressed',String(page==='ai'));
     toolbar.querySelector('[data-action="workbench"]').setAttribute('aria-pressed',String(page==='workbench'));
   }
   toolbar.setAttribute('aria-label',portal?'资讯与数据切换，可拖动调整位置':'工作台切换，可拖动调整位置');
   document.title=`广智新 · ${{workbench:'智慧工作台',ai:'AI 工作台','portal-news':'广新门户','portal-data':'数据看板'}[page]}`;
 };
 actions.portal=()=>window.navigateWorkspace('portal-news');
 actions.portalNews=()=>window.navigateWorkspace('portal-news');
 actions.portalData=()=>window.navigateWorkspace('portal-data');
 function searchBox(section){return `<label class="portal-search"><input data-portal-search="${section}" aria-label="搜索${section==='news'?'智能资讯':'集团资讯'}" placeholder="搜索">${icon('search')}</label>`}
 function noticeList(type){return `<ol class="portal-notice-list">${bulletinTitles.map((t,i)=>`<li><button data-bulletin="${type}:${i}"><span class="rank">${i+1}${type==='announcement'?'.':''}</span><span class="notice-title">${t}</span></button></li>`).join('')}</ol>`}
 newsView.innerHTML=`<div class="portal-left">
  <section class="portal-banner" aria-label="集团宣传轮播"><img class="portal-banner-image" src="assets/portal-banner.png" alt="设计稿示意横幅：庆祝广新集团连续四年上榜财富世界500强" title="设计稿横幅示意"><div class="portal-banner-text" hidden></div><div class="banner-dots" aria-label="切换轮播图">${[0,1,2].map(i=>`<button class="${i===0?'active':''}" data-banner="${i}" aria-label="第${i+1}张轮播" aria-pressed="${i===0}"></button>`).join('')}</div></section>
  <section class="panel portal-news-panel"><div class="portal-head"><h2><span class="orange-bar"></span>AI 智能资讯</h2><div class="portal-tabs" role="tablist" aria-label="智能资讯分类">${['推荐','我关注的','与我有关','集团要闻','行业趋势','政策法规'].map(t=>`<button role="tab" data-news-tab="${t}" class="${t==='推荐'?'active':''}" aria-selected="${t==='推荐'}">${t}</button>`).join('')}</div>${searchBox('news')}<a class="more" href="https://www.gdghg.com/xwzx/gxyw/" target="_blank" rel="noopener noreferrer">更多 ›</a></div><div class="portal-card-track" id="newsTrack"></div><button class="portal-arrow" data-track-next="newsTrack" aria-label="下一组智能资讯">›</button></section>
  <section class="panel portal-group-panel"><div class="portal-head"><h2><span class="orange-bar"></span>集团综合资讯</h2><div class="portal-tabs" role="tablist" aria-label="集团资讯分类">${['最新','最热','焦点','党建'].map(t=>`<button role="tab" data-group-tab="${t}" class="${t==='最新'?'active':''}" aria-selected="${t==='最新'}">${t}</button>`).join('')}</div>${searchBox('group')}<a class="more" href="https://www.gdghg.com/xwzx/gxyw/" target="_blank" rel="noopener noreferrer">更多 ›</a></div><div class="portal-card-track portal-group-track" id="groupTrack"></div><button class="portal-arrow left" data-track-prev="groupTrack" aria-label="上一组集团资讯">‹</button><button class="portal-arrow" data-track-next="groupTrack" aria-label="下一组集团资讯">›</button></section>
 </div><div class="portal-right"><section class="panel portal-service"><div class="section-head"><h2><span class="orange-bar"></span>AI 主动服务与智能提醒</h2><button class="more" data-portal-command="reminders">更多 ›</button></div><div class="portal-reminders">
 <article class="portal-reminder" data-reminder="hotel"><span class="reminder-icon">${icon('doc')}</span><div class="reminder-heading">出差申请 <span>出行准备</span></div><h3>明天前往济南出差，尚未查到酒店预订</h3><p>出差申请已审批通过，关联记录中已有机票，暂未查到覆盖入住日期的酒店。若已通过其他渠道预订，请先核实。</p><div class="reminder-actions"><button data-reminder-view="hotel">查看</button data-ignore><button data-reminder-ignore="hotel">忽略</button></div></article>
 <article class="portal-reminder" data-reminder="flight"><span class="reminder-icon red-tone">${icon('people')}</span><div class="reminder-heading">酒店/机票/高铁预订 <span class="purple-tone">行程核对</span></div><h3>明早08:30航班起飞，请提前核对行程</h3><p>广州白云—济南遥墙，机票状态为已出票。返程高铁与酒店订单也可一并核对；预订时间不代表实时运行状态。</p><div class="reminder-actions"><button data-reminder-view="flight">查看</button><button data-reminder-ignore="flight">忽略</button></div></article></div></section>
 <section class="panel portal-notices"><div class="section-head"><h2><span class="heading-symbol">📣</span>最新通知</h2><button class="more" data-portal-command="notices">更多 ›</button></div>${noticeList('notice')}</section>
 <section class="panel portal-notices portal-announcements"><div class="section-head"><h2><span class="heading-symbol">📢</span>最新公告</h2><button class="more" data-portal-command="announcements">更多 ›</button></div>${noticeList('announcement')}</section></div>`;
 function filteredArticles(section){
  let list=[...articleData];
  if(section==='news'){
   if(newsTab==='我关注的')list=list.filter(a=>a.following);
   if(newsTab==='与我有关')list=list.filter(a=>a.related);
   if(newsTab==='集团要闻')list=list.filter(a=>a.category==='集团动态');
   if(newsTab==='行业趋势')list=list.filter(a=>a.category!=='集团动态');
   if(newsTab==='政策法规')list=[];
  }else{
   if(groupTab==='最新')list.sort((a,b)=>b.date.localeCompare(a.date));
   if(groupTab==='最热'||groupTab==='焦点')list=list.filter(a=>a.featured);
   if(groupTab==='党建')list=[];
  }
  const q=searchValues[section].trim();return q?list.filter(a=>`${a.title}${a.category}`.includes(q)):list;
 }
 function renderArticles(section){const list=filteredArticles(section);const track=document.getElementById(section==='news'?'newsTrack':'groupTrack');track.innerHTML=list.length?list.map(a=>section==='news'?`<a class="portal-news-card" href="${a.url}" target="_blank" rel="noopener noreferrer" title="${esc(a.title)}（广新集团官网，新窗口打开）"><img src="assets/${a.image}.png" alt="" title="设计稿配图"><div class="portal-news-copy"><div class="portal-tags"><span>${a.category}</span>${a.featured?'<span>重磅</span>':''}</div><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p><div class="portal-news-meta"><span>广新集团</span><time>${a.date}</time></div></div></a>`:`<a class="portal-group-card" href="${a.url}" target="_blank" rel="noopener noreferrer" title="${esc(a.title)}（广新集团官网，新窗口打开）"><img src="assets/${a.image}.png" alt="" title="设计稿配图"><h3>${esc(a.title)}</h3><time>${a.date}</time></a>`).join(''):'<p class="portal-empty">暂无匹配资讯</p>';track.scrollLeft=0;document.querySelectorAll(section==='news'?'[data-news-tab]':'[data-group-tab]').forEach(b=>{const active=(section==='news'?b.dataset.newsTab:b.dataset.groupTab)===(section==='news'?newsTab:groupTab);b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active))});updateTrackButtons(track)}
 function updateTrackButtons(track){const next=document.querySelector(`[data-track-next="${track.id}"]`),prev=document.querySelector(`[data-track-prev="${track.id}"]`);if(next)next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-2;if(prev)prev.disabled=track.scrollLeft<=1}
 ['newsTrack','groupTrack'].forEach(id=>document.getElementById(id).addEventListener('scroll',e=>updateTrackButtons(e.currentTarget)));
 const projects=[
 {name:'智能制造装备升级项目',company:'广东某某科技股份有限公司',type:'智能制造',stage:'投资中',irr:18.5,years:4.2,progress:75,profit:16.8,budget:8500,actual:7200,short:'新一代人工智能技术…'},
 {name:'高性能复合材料研发项目',company:'深圳某某创新研究院',type:'新材料',stage:'投后管理',irr:22.3,years:3.8,progress:90,profit:21.4,budget:6200,actual:5100,short:'高性能复合材料研制'},
 {name:'新型生物药物研发项目',company:'北京某某生物科技有限公司',type:'生物医药',stage:'投资中',irr:25.1,years:5.1,progress:60,profit:23.6,budget:2600,actual:1800,short:'新型生物药物研发平台'},
 {name:'7nm芯片研发项目',company:'上海某某半导体有限公司',type:'半导体',stage:'投前',irr:28.7,years:6.3,progress:30,profit:null,budget:1900,actual:1400,short:'7nm芯片先导制程项目'},
 {name:'新型固态电池研发项目',company:'杭州某某新能源有限公司',type:'新能源',stage:'投资中',irr:20.4,years:4.7,progress:50,profit:18.9,budget:1500,actual:1200,short:'新型固态电池规模化'}
 ];
 const provinces=[{name:'北京',value:45678,x:282,y:97,color:'#ffac8c'},{name:'山东',value:62340,x:324,y:130,color:'#ff5b33'},{name:'江苏',value:98760,x:331,y:162,color:'#ff5433'},{name:'上海',value:58920,x:341,y:194,color:'#ff8765'},{name:'广东',value:125680,x:242,y:261,color:'#ff343b'}];
 const filters={company:'全部企业',year:'2026',projectType:'项目类型',projectCompany:'所属企业',stage:'投资阶段',month:'2026-09',mapCompany:'全部企业',mapYear:'2026',summary:'集团合并'};
 const select=(key,options,label)=>`<select data-data-filter="${key}" aria-label="${label}">${options.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select>`;
 const shortCompanies=['全部企业','广东科技','深圳创新','北京生物'];
 const headline=title=>`<h2><span class="orange-bar"></span>${title}</h2>`;
 dataView.innerHTML=`<div class="data-left"><section class="panel data-summary"><div class="data-head">${headline('一利五率+营收/利润')}<div class="data-filters"><span class="sample-data-label">示例数据</span>${select('summary',['集团合并','广东科技','深圳创新'],'财务统计范围')}</div></div><div class="metric-grid" id="metricGrid"></div><div class="ratio-grid" id="ratioGrid"></div></section>
 <section class="panel data-tax"><div class="data-head">${headline('二级公司纳税情况')}<div class="data-filters">${select('company',shortCompanies,'纳税企业')}${select('year',['2026','2025'],'纳税年度')}</div></div><div class="tax-panels">${['营业收入与整体税负趋势','当月实缴税款情况'].map((title,i)=>`<section class="tax-subpanel"><h3>${title}</h3><div class="tax-metrics"><div class="tax-stat">${icon('grid')}<div><span>当月营业收入 (万元)</span><strong data-tax-revenue>12,345.67</strong></div></div><div class="tax-stat">${icon('grid')}<div><span>月税负率 (%)</span><strong data-tax-rate>2.10</strong></div></div></div><div class="chart-legend"><span><i class="legend-dot" style="--dot:${i?'#03c9cc':'#ff8000'}"></i>营业收入 (万元)</span><span><i class="legend-line"></i>整体税负率 (%)</span></div><svg class="combo-chart" id="taxChart${i}" viewBox="0 0 530 149" role="img" aria-label="${title}，演示数据"></svg></section>`).join('')}</div></section>
 <section class="panel data-projects"><div class="data-head">${headline('项目投资')}<div class="data-filters">${select('projectType',['项目类型',...new Set(projects.map(p=>p.type))],'项目类型')}${select('projectCompany',['所属企业',...projects.map(p=>p.company)],'所属企业')}${select('stage',['投资阶段','投资中','投后管理','投前'],'投资阶段')}${select('month',['2026-09','2026-08'],'项目统计月份')}</div></div><table class="data-table"><colgroup><col style="width:18%"><col style="width:18%"><col style="width:11%"><col style="width:11.5%"><col style="width:15%"><col style="width:19%"><col style="width:8.5%"></colgroup><thead><tr>${['项目名称','所属企业','项目阶段','预计IRR','预计投资回收期','投资完成率','投资利润率'].map(t=>`<th>${t}</th>`).join('')}</tr></thead><tbody id="projectRows"></tbody></table></section></div>
 <div class="data-right"><section class="panel data-research"><div class="data-head">${headline('科研动态')}<button class="more" data-portal-command="research">更多 ›</button></div><table class="data-table"><colgroup><col style="width:38%"><col style="width:21%"><col style="width:41%"></colgroup><thead><tr><th>企业名称</th><th>类别</th><th>最新动态</th></tr></thead><tbody>${[['智能制造装备升级项目','智能算法','成功研发新一代智能算法模型，…'],['高性能复合材料研发项目','复合材料','高性能复合材料项目进入中试阶段'],['智能制造装备升级项目','智能算法','新型生物药物临床试验申请获批'],['高性能复合材料研发项目','复合材料','7nm芯片研发取得重大突破']].map((r,i)=>`<tr data-research-detail="${i}">${r.map(t=>`<td title="${t}">${t}</td>`).join('')}</tr>`).join('')}</tbody></table></section>
 <section class="panel data-map"><div class="data-head">${headline('各省份年度累计实缴税金 (万元)')}<div class="data-filters">${select('mapCompany',['全部企业','广东科技','深圳创新'],'税金企业')}${select('mapYear',['2026','2025'],'税金年度')}</div></div><div class="map-container"><div class="map-zoom"><button data-map-zoom="1" aria-label="放大地图">＋</button><button data-map-zoom="-1" aria-label="缩小地图">−</button></div><div class="map-canvas"><img src="assets/tax-map.png" alt="设计稿中的各省份税金分布示意地图"><div id="provinceLabels"></div></div><div class="map-scale"><span>高</span><i></i><span>低</span></div><div class="map-legend">${[provinces[0],provinces[3],provinces[2],provinces[1],provinces[4]].map(p=>`<button data-province="${p.name}"><i class="legend-dot" style="--dot:${p.color}"></i>${p.name}</button>`).join('')}</div></div></section>
 <section class="panel data-progress"><div class="data-head">${headline('集团重大科技创新项目实施进度')}</div><div class="chart-legend"><span><i class="legend-dot" style="--dot:#ff201f"></i>预算研发经费投入 (万元)</span><span><i class="legend-dot" style="--dot:#ffceb9"></i>实际研发经费投入 (万元)</span></div><div class="research-bars">${projects.map((p,i)=>`<button class="research-bar-row" data-project="${i}" title="${p.name}"><span>${p.short}</span><div class="bar-pair"><div class="research-bar" style="width:${p.budget/85}%"><em>${fmt(p.budget)}</em></div><div class="research-bar actual" style="width:${p.actual/85}%"><em>${fmt(p.actual)}</em></div></div></button>`).join('')}</div></section></div>`;
 const tooltip=document.createElement('div');tooltip.className='chart-tooltip';tooltip.hidden=true;tooltip.setAttribute('role','status');document.body.appendChild(tooltip);
 function companyFactor(name){return name==='全部企业'||name==='集团合并'?1:name==='广东科技'?.62:name==='深圳创新'?.38:.28}
 function drawMetrics(){const factor=companyFactor(filters.summary);document.querySelector('#metricGrid').innerHTML=[['营业收入(亿元)',1234.56,''],['利润总额(亿元)',345.67,'green-tone'],['资产总额(亿元)',5678.90,'orange-tone'],['净利润(亿元)',123.45,'red-tone']].map(([label,n,color])=>`<div class="metric"><span class="metric-icon ${color}">${icon('people')}</span><div><div class="metric-label">${label}</div><div class="metric-value">${fmt(n*factor,2)}</div></div></div>`).join('');document.querySelector('#ratioGrid').innerHTML=[['净资产收益率',11.2],['营业收入现金比率',11.2],['资产负债率',1.2],['研发投入强度',26.2],['全员劳动生产率',22.1]].map(([t,n])=>`<div class="ratio"><span>${t}</span><strong>${(n*(factor===1?1:.94)).toFixed(1)}<small>%</small></strong></div>`).join('')}
 function drawTax(){const factor=companyFactor(filters.company)*(filters.year==='2025'?.88:1);document.querySelectorAll('[data-tax-revenue]').forEach(el=>el.textContent=fmt(12345.67*factor,2));document.querySelectorAll('[data-tax-rate]').forEach(el=>el.textContent=(2.1*(filters.year==='2025'?1.04:1)).toFixed(2));const revenue=[18000,16000,16500,14500,18000,18000,16500,14500].map(n=>n*factor),rates=[2.3,1.7,2.45,1.8,2.55,1.95,2.55,1.15];
  [0,1].forEach(index=>{const svg=document.querySelector(`#taxChart${index}`),color=index?'#03c8ce':'#ff8000';let contents=[0,5000,10000,15000,20000].map(v=>{const y=119-v/20000*100;return `<line x1="30" y1="${y}" x2="510" y2="${y}" stroke="#edf1f7"/>${[0,10000,15000,20000].includes(v)?`<text x="0" y="${y+4}">${v?v/1000+'k':'0'}</text>`:''}`}).join('');contents+=[0,1,2,3].map(v=>`<text x="512" y="${123-v/3*100}">${v}%</text>`).join('');const points=rates.map((r,i)=>`${55+i*61},${119-r/3*100}`).join(' ');contents+=revenue.map((v,i)=>`<g class="chart-hit" tabindex="0" data-chart-month="${i}" data-chart-label="${i+1}月 · 营业收入 ${fmt(v,2)} 万元 · 整体税负率 ${rates[i].toFixed(2)}%"><rect x="${49+i*61}" y="${119-v/20000*100}" width="11" height="${v/20000*100}" rx="5" fill="${color}"/><rect x="${32+i*61}" y="12" width="45" height="109" fill="transparent"/><title>${i+1}月：营业收入 ${fmt(v,2)}万元，整体税负率${rates[i]}%</title><text x="${55+i*61}" y="140" text-anchor="middle">${i+1}月</text></g>`).join('');contents+=`<polyline points="${points}" fill="none" stroke="#1677ff" stroke-width="2.2" pointer-events="none"/>`+rates.map((r,i)=>`<circle cx="${55+i*61}" cy="${119-r/3*100}" r="3" fill="white" stroke="#1677ff" stroke-width="2" pointer-events="none"/>`).join('');svg.innerHTML=contents})}
 function drawProjects(){let list=projects.map((p,i)=>({...p,id:i})).filter(p=>(filters.projectType==='项目类型'||p.type===filters.projectType)&&(filters.projectCompany==='所属企业'||p.company===filters.projectCompany)&&(filters.stage==='投资阶段'||p.stage===filters.stage));document.querySelector('#projectRows').innerHTML=list.length?list.map(p=>{const progress=filters.month==='2026-08'?Math.max(0,p.progress-8):p.progress;return `<tr tabindex="0" data-project="${p.id}"><td title="${p.name}">${p.name}</td><td title="${p.company}">${p.company}</td><td><span class="stage-badge ${p.stage==='投后管理'?'post':p.stage==='投前'?'pre':''}">${p.stage}</span></td><td>${p.irr.toFixed(2)}%</td><td>${p.years.toFixed(1)} 年</td><td><span class="project-progress"><span class="project-track"><span class="project-fill" style="width:${progress}%"></span></span>${progress}%</span></td><td>${p.profit===null?'--':p.profit.toFixed(2)+'%'}</td></tr>`}).join(''):'<tr><td colspan="7" class="empty">暂无符合筛选条件的项目</td></tr>'}
 function provinceValue(p){return Math.round(p.value*companyFactor(filters.mapCompany)*(filters.mapYear==='2025'?.85:1))}
 function drawMap(){document.querySelector('#provinceLabels').innerHTML=provinces.map(p=>`<button class="province-label" style="left:${p.x}px;top:${p.y}px" data-province="${p.name}" title="${filters.mapYear}年${p.name}累计实缴税金（示例）"><i class="legend-dot" style="background:${p.color}"></i>${p.name}${fmt(provinceValue(p))}</button>`).join('')}
 function showProject(index){const p=projects[index];if(!p)return;openModal(p.name,`<p class="detail-meta">${p.company} · ${p.stage} · 示例数据</p><p class="detail-text">预计 IRR：${p.irr.toFixed(2)}%<br>预计投资回收期：${p.years.toFixed(1)} 年<br>投资完成率：${p.progress}%<br>预算研发投入：${fmt(p.budget)} 万元<br>实际研发投入：${fmt(p.actual)} 万元</p><p class="detail-meta">来自设计稿的本地演示数据，未连接集团经营系统。</p>`)}
 function reminderDetail(id){openModal(id==='hotel'?'出差行程 · 酒店待核实':'出差行程 · 航班核对',`<p class="detail-meta">演示提醒</p><p class="detail-text">${id==='hotel'?'出差目的地：济南。当前示例记录暂未关联酒店订单，请核实是否已经通过其他渠道预订。':'广州白云—济南遥墙，示例起飞时间 08:30。请在出行前通过航空公司核实真实航班信息。'}</p>`)}
 let mapZoom=1;
 document.addEventListener('change',e=>{const key=e.target.dataset.dataFilter;if(!key)return;filters[key]=e.target.value;if(key==='summary')drawMetrics();else if(['company','year'].includes(key))drawTax();else if(['mapCompany','mapYear'].includes(key))drawMap();else drawProjects()});
 document.querySelectorAll('[data-portal-search]').forEach(input=>input.addEventListener('input',e=>{searchValues[input.dataset.portalSearch]=e.target.value;renderArticles(input.dataset.portalSearch)}));
 document.addEventListener('click',e=>{
  const target=e.target.closest('button,[data-project],[data-research-detail]');if(!target)return;
  if(target.dataset.newsTab){newsTab=target.dataset.newsTab;renderArticles('news')}
  if(target.dataset.groupTab){groupTab=target.dataset.groupTab;renderArticles('group')}
  if(target.dataset.trackNext||target.dataset.trackPrev){const track=document.getElementById(target.dataset.trackNext||target.dataset.trackPrev);track.scrollBy({left:(target.dataset.trackNext?1:-1)*554,behavior:'smooth'})}
  if(target.dataset.banner!==undefined){bannerIndex=+target.dataset.banner;document.querySelectorAll('[data-banner]').forEach(b=>{b.classList.toggle('active',+b.dataset.banner===bannerIndex);b.setAttribute('aria-pressed',String(+b.dataset.banner===bannerIndex))});const overlay=document.querySelector('.portal-banner-text');overlay.hidden=bannerIndex===0;overlay.innerHTML=bannerIndex===1?'<strong>以科技创新引领产业升级</strong><p>聚焦先进制造，培育发展新动能</p>':'<strong>广新，让未来更美好</strong><p>协同发展 · 产业共创 · 开放合作</p>'}
  if(target.dataset.reminderView)reminderDetail(target.dataset.reminderView);
  if(target.dataset.reminderIgnore){target.closest('.portal-reminder').remove();if(!document.querySelector('.portal-reminder'))document.querySelector('.portal-reminders').innerHTML='<p class="portal-empty">暂无待处理提醒</p>';toast('已忽略此提醒')}
  if(target.dataset.bulletin){const [type,index]=target.dataset.bulletin.split(':');openModal(type==='notice'?'最新通知':'最新公告',`<h3>${bulletinTitles[+index]}</h3><p class="detail-text">此条为设计稿中的示例通知，尚未接入企业通知公告系统。真实集团新闻可通过资讯卡片进入官网查看。</p>`)}
  if(target.dataset.project!==undefined)showProject(+target.dataset.project);
  if(target.dataset.researchDetail!==undefined)showProject(+target.dataset.researchDetail%projects.length);
  if(target.dataset.province){const p=provinces.find(p=>p.name===target.dataset.province);openModal(`${p.name} · 实缴税金`, `<p class="detail-meta">${filters.mapYear}年 · ${filters.mapCompany} · 示例数据</p><div class="metric-value">${fmt(provinceValue(p))} 万元</div><p class="detail-text">当前为设计稿演示值，未连接真实税务数据。</p>`)}
  if(target.dataset.mapZoom){mapZoom=Math.min(1.5,Math.max(.8,mapZoom+(+target.dataset.mapZoom)*.1));document.querySelector('.map-canvas').style.setProperty('--map-zoom',mapZoom)}
  if(target.dataset.portalCommand){const cmd=target.dataset.portalCommand;if(cmd==='research')openModal('科研动态',projects.map((p,i)=>`<button class="result" data-project="${i}">${p.name}　›</button>`).join(''));else if(cmd==='reminders')openModal('智能提醒','<button class="result" data-reminder-view="hotel">酒店预订待核实　›</button><button class="result" data-reminder-view="flight">明早航班行程核对　›</button>');else openModal(cmd==='notices'?'最新通知':'最新公告',noticeList(cmd==='notices'?'notice':'announcement'))}
 });
 dataView.addEventListener('pointermove',e=>{const hit=e.target.closest('[data-chart-label]');if(!hit){tooltip.hidden=true;return}tooltip.hidden=false;tooltip.textContent=hit.dataset.chartLabel;tooltip.style.left=Math.max(8,Math.min(window.innerWidth-280,e.clientX+12))+'px';tooltip.style.top=Math.max(8,Math.min(window.innerHeight-80,e.clientY-60))+'px'});
 dataView.addEventListener('pointerleave',()=>{tooltip.hidden=true});
 dataView.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const item=e.target.closest('[data-project]');if(item){e.preventDefault();showProject(+item.dataset.project)}});
 renderArticles('news');renderArticles('group');drawMetrics();drawTax();drawProjects();drawMap();
 // Measurements are available once the portal is visible.
 const originalNavigate=window.navigateWorkspace;
 window.navigateWorkspace=page=>{tooltip.hidden=true;originalNavigate(page);if(page==='portal-news')requestAnimationFrame(()=>['newsTrack','groupTrack'].forEach(id=>updateTrackButtons(document.getElementById(id))))};
})();
