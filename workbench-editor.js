/* Edit the actual workbench widgets. Draft edits are committed only on Save. */
(() => {
  const STORAGE = 'gx-workbench-layout-v1';
  const W = 1770, H = 1019, GAP = 22, SNAP = 8;
  const dashboard = document.querySelector('.dashboard');
  const canvas = document.querySelector('.reference-canvas');
  const clone = value => JSON.parse(JSON.stringify(value));
  let editing = false, mounted = false, libraryOpen = false, selected = null, gesture = null;
  let undoStack = [], dirty = false, savedSnapshot = null, suppressClick = false;
  const nodes = new Map(), wrappers = new Map();
  const definitions = [
    {id:'brief', name:'AI 每日简报', selector:'.brief', minW:300, minH:220},
    {id:'summaries', name:'工作提醒', selector:'.summaries', minW:360, minH:94},
    {id:'todo', name:'统一待办', selector:'.todo-panel', minW:300, minH:200},
    {id:'mail', name:'邮箱服务', selector:'.mail-panel', minW:300, minH:200},
    {id:'apps', name:'常用功能', selector:'.apps-panel', minW:280, minH:150},
    {id:'systems', name:'系统导航', selector:'.systems-panel', minW:280, minH:150},
    {id:'calendar', name:'我的日程', selector:'.calendar-panel', minW:300, minH:220},
    {id:'services', name:'AI 主动服务与智能提醒', minW:300, minH:220, w:576, h:400},
    {id:'banner', name:'门户轮播横幅', minW:360, minH:140, w:1174, h:241},
    {id:'news', name:'AI 智能资讯', minW:480, minH:220, w:1174, h:356},
    {id:'groupNews', name:'集团综合资讯', minW:480, minH:220, w:1174, h:298}
  ];
  const scale = () => canvas.getBoundingClientRect().width / canvas.offsetWidth || 1;
  const startRect = dashboard.getBoundingClientRect(), initialScale = scale();
  const defaults = {version:1, items:definitions.map(d => {
    const node = d.selector ? dashboard.querySelector(d.selector) : null;
    if(node) {
      nodes.set(d.id,node);
      const rect=node.getBoundingClientRect();
      return {id:d.id, visible:true, x:Math.round((rect.left-startRect.left)/initialScale), y:Math.round((rect.top-startRect.top)/initialScale), w:Math.round(rect.width/initialScale), h:Math.round(rect.height/initialScale)};
    }
    return {id:d.id,visible:false,x:0,y:0,w:d.w,h:d.h};
  }), orders:{}};
  const reorderGroups = ['commonApps','systemApps'];
  reorderGroups.forEach(id => {
    const el=document.getElementById(id);
    [...el.children].forEach((child,i)=>child.dataset.layoutItem=`${id}-${i}`);
    defaults.orders[id]=[...el.children].map(c=>c.dataset.layoutItem);
  });
  let state=clone(defaults);
  try {
    const stored=JSON.parse(localStorage.getItem(STORAGE)||'null');
    if(stored?.version===1 && Array.isArray(stored.items)) {
      state.items=defaults.items.map(base=>{
        const saved=stored.items.find(x=>x.id===base.id),def=definitions.find(d=>d.id===base.id);
        if(!saved || !['x','y','w','h'].every(k=>Number.isFinite(saved[k])))return {...base};
        const w=Math.max(def.minW,Math.min(W,saved.w)), h=Math.max(def.minH,Math.min(H,saved.h));
        return {id:base.id,visible:!!saved.visible,x:Math.max(0,Math.min(W-w,saved.x)),y:Math.max(0,Math.min(H-h,saved.y)),w,h};
      });
      if(stored.orders&&typeof stored.orders==='object')state.orders={...defaults.orders,...stored.orders};
    }
  } catch {}
  const toolbar=document.createElement('header');
  toolbar.className='wb-editor-toolbar';toolbar.hidden=true;
  toolbar.innerHTML=`<button class="wb-toolbar-button" data-wb-command="back">‹ 返回工作台</button><button class="wb-toolbar-button" data-wb-command="library" aria-expanded="false">▤ 组件库</button><h1>自定义工作台</h1><span class="wb-editor-status">拖动组件任意位置编排 · Alt＋拖动快捷入口排序</span><span class="wb-editor-spacer"></span><div class="wb-toolbar-size" hidden><label>宽 <input id="wbWidth" type="number" step="8" aria-label="组件宽度"></label><label>高 <input id="wbHeight" type="number" step="8" aria-label="组件高度"></label></div><button class="wb-toolbar-button" data-wb-command="undo" disabled>↶ 撤销</button><button class="wb-toolbar-button" data-wb-command="reset">重置布局</button><button class="wb-toolbar-button wb-toolbar-primary" data-wb-command="save">保存并生效</button>`;
  canvas.insertBefore(toolbar,canvas.firstChild);
  const library=document.createElement('aside');library.className='wb-library';library.hidden=true;
  library.setAttribute('aria-label','组件库');
  library.innerHTML='<div class="wb-library-head"><h2>组件库</h2><button data-wb-command="library" aria-label="关闭组件库">×</button></div><p class="wb-library-subtitle"></p><div class="wb-library-list"></div>';
  canvas.appendChild(library);
  const placement=document.createElement('div');placement.className='wb-placement';placement.hidden=true;
  const empty=document.createElement('div');empty.className='wb-empty';empty.hidden=true;empty.innerHTML='<h2>为工作台添加组件</h2><p>从组件库拖入需要的组件，构建您的工作台</p><button class="primary" data-wb-command="library">打开组件库</button>';
  const dragLabel=document.createElement('div');dragLabel.className='wb-library-drag-label';dragLabel.hidden=true;canvas.appendChild(dragLabel);
  const item=id=>state.items.find(i=>i.id===id);
  const def=id=>definitions.find(d=>d.id===id);
  const visible=()=>state.items.filter(i=>i.visible);
  const overlaps=(a,b)=>a.x < b.x+b.w-1 && a.x+a.w > b.x+1 && a.y < b.y+b.h-1 && a.y+a.h > b.y+1;
  const fits=(r,exclude=[])=>r.x>=0&&r.y>=0&&r.x+r.w<=W+1&&r.y+r.h<=H+1&&!visible().some(i=>!exclude.includes(i.id)&&overlaps(r,i));
  const point=e=>{const r=dashboard.getBoundingClientRect(),s=scale();return {x:(e.clientX-r.left)/s,y:(e.clientY-r.top)/s};};
  const snap=n=>Math.round(n/SNAP)*SNAP;
  function rememberOrders(){reorderGroups.forEach(id=>state.orders[id]=[...document.getElementById(id).children].map(c=>c.dataset.layoutItem));}
  function applyOrders(){reorderGroups.forEach(id=>{const el=document.getElementById(id),children=[...el.children],map=new Map(children.map(c=>[c.dataset.layoutItem,c]));const order=Array.isArray(state.orders[id])?state.orders[id]:defaults.orders[id];order.forEach(key=>{const child=map.get(key);if(child){el.appendChild(child);map.delete(key);}});map.forEach(child=>el.appendChild(child));});}
  function commit(before,message){rememberOrders();if(JSON.stringify(before)===JSON.stringify(state))return;undoStack.push(before);if(undoStack.length>30)undoStack.shift();dirty=JSON.stringify(state)!==JSON.stringify(savedSnapshot);refreshToolbar();if(message)toast(message);}
  function createExtra(id){
    if(id==='services') {
      const el=document.querySelector('#portalNews .portal-service').cloneNode(true);el.classList.add('wb-added-services');
      el.querySelectorAll('[data-reminder-ignore]').forEach(b=>{b.dataset.wbReminderIgnore=b.dataset.reminderIgnore;delete b.dataset.reminderIgnore;});
      return el;
    }
    if(id==='banner') {
      const el=document.createElement('section');el.className='portal-banner wb-banner';
      const slides=[{image:'assets/portal-banner-clean.png',title:'庆祝广新集团连续四年上榜《财富》世界500强'},{image:'assets/portal-banner-foshan.jpeg',title:portalArticles.find(a=>a.id==='foshan').title,url:portalArticles.find(a=>a.id==='foshan').url}];
      let currentSlide=0,bannerTimer=null;
      const schedule=()=>{clearTimeout(bannerTimer);if(!editing&&!dashboard.hidden&&item('banner').visible&&!document.hidden)bannerTimer=setTimeout(()=>{if(!editing&&!dashboard.hidden)render((currentSlide+1)%slides.length);},8000);};
      document.addEventListener('workspacechange',schedule);document.addEventListener('visibilitychange',schedule);
      const render=i=>{currentSlide=i;const s=slides[i];el.innerHTML=`${s.url?`<a class="portal-banner-link" href="${s.url}" target="_blank" rel="noopener noreferrer">`:'<div class="portal-banner-content-local">'}<img class="portal-banner-image" src="${s.image}" alt="${esc(s.title)}"><div class="portal-banner-caption"><span title="${esc(s.title)}">${esc(s.title)}</span></div>${s.url?'</a>':'</div>'}<div class="banner-dots">${slides.map((_,n)=>`<button data-wb-banner="${n}" class="${i===n?'active':''}" aria-label="切换工作台横幅第${n+1}张"></button>`).join('')}</div>`;schedule();};render(0);
      el.addEventListener('click',e=>{const b=e.target.closest('[data-wb-banner]');if(b&&!editing)render(+b.dataset.wbBanner);});return el;
    }
    const group=id==='groupNews',el=document.createElement('section');el.className=`panel ${group?'portal-group-panel':'portal-news-panel'} wb-extra-news`;
    const trackId=group?'wbGroupTrack':'wbNewsTrack';
    el.innerHTML=`<div class="portal-head"><h2><span class="orange-bar"></span>${group?'集团综合资讯':'AI 智能资讯'}</h2><div class="portal-tabs"><button class="active" data-wb-news-filter="全部">全部</button><button data-wb-news-filter="集团动态">集团</button><button data-wb-news-filter="创新驱动">创新</button></div></div><div id="${trackId}" class="portal-card-track ${group?'portal-group-track':''}"></div><button class="portal-arrow left" data-track-prev="${trackId}" aria-label="上一组${def(id).name}">‹</button><button class="portal-arrow" data-track-next="${trackId}" aria-label="下一组${def(id).name}">›</button>`;
    const track=el.querySelector('.portal-card-track');
    const render=filter=>{const list=portalArticles.filter(a=>filter==='全部'||a.category===filter);track.innerHTML=list.map(a=>group?`<a class="portal-group-card" href="${a.url}" target="_blank" rel="noopener noreferrer"><img src="assets/${a.image}.png" alt=""><h3 title="${esc(a.title)}">${esc(a.title)}</h3><time>${a.date}</time></a>`:`<a class="portal-news-card" href="${a.url}" target="_blank" rel="noopener noreferrer"><img src="assets/${a.image}.png" alt=""><div class="portal-news-copy"><div class="portal-tags"><span>${a.category}</span></div><h3 title="${esc(a.title)}">${esc(a.title)}</h3><p>${esc(a.summary)}</p><div class="portal-news-meta"><span>广新集团</span><time>${a.date}</time></div></div></a>`).join('');track.scrollTo({left:0,behavior:'instant'});el.querySelectorAll('[data-wb-news-filter]').forEach(b=>b.classList.toggle('active',b.dataset.wbNewsFilter===filter));requestAnimationFrame(()=>window.portalCarousel?.refresh(track));};
    render('全部');el.addEventListener('click',e=>{const b=e.target.closest('[data-wb-news-filter]');if(b&&!editing)render(b.dataset.wbNewsFilter);});window.portalCarousel?.attach(track);return el;
  }
  function getNode(id){if(!nodes.has(id))nodes.set(id,createExtra(id));return nodes.get(id);}
  function makeWrapper(id){
    if(wrappers.has(id))return wrappers.get(id);
    const el=document.createElement('section');el.className='wb-widget';el.dataset.widgetId=id;el.setAttribute('aria-label',def(id).name);
    const body=document.createElement('div');body.className='wb-widget-body';body.appendChild(getNode(id));el.appendChild(body);
    const controls=document.createElement('div');controls.className='wb-widget-controls';controls.innerHTML=`<button class="wb-drag-handle" data-wb-drag="${id}" aria-label="拖动${def(id).name}" title="拖动编排；拖到其他组件上可交换位置"><span class="grip">⠿</span><span>${def(id).name}</span></button><button class="wb-hide-widget" data-wb-hide="${id}" aria-label="隐藏${def(id).name}" title="隐藏组件，可从组件库恢复">×</button>`;el.appendChild(controls);
    const resize=document.createElement('button');resize.className='wb-resize-handle';resize.dataset.wbResize=id;resize.setAttribute('aria-label',`调整${def(id).name}大小`);resize.title='拖动调整大小，也可使用方向键';el.appendChild(resize);
    wrappers.set(id,el);dashboard.appendChild(el);return el;
  }
  function mount(){if(mounted)return;definitions.filter(d=>d.selector).forEach(d=>getNode(d.id).remove());dashboard.replaceChildren();dashboard.classList.add('wb-layout');dashboard.append(empty,placement);mounted=true;apply();}
  function apply(){
    if(!mounted)return;
    state.items.forEach(i=>{if(i.visible||wrappers.has(i.id)){const el=makeWrapper(i.id);el.hidden=!i.visible;Object.assign(el.style,{left:i.x+'px',top:i.y+'px',width:i.w+'px',height:i.h+'px'});el.classList.toggle('selected',editing&&selected===i.id);}});
    applyOrders();empty.hidden=visible().length>0;refreshToolbar();
  }
  function refreshToolbar(){toolbar.querySelector('[data-wb-command="undo"]').disabled=!undoStack.length;toolbar.querySelector('.wb-editor-status').textContent=dirty?'布局已修改，保存后生效':'拖动组件任意位置编排 · Alt＋拖动快捷入口排序';const size=toolbar.querySelector('.wb-toolbar-size');const current=selected&&item(selected);size.hidden=!current||!current.visible;if(current){document.getElementById('wbWidth').value=Math.round(current.w);document.getElementById('wbHeight').value=Math.round(current.h);document.getElementById('wbWidth').min=def(selected).minW;document.getElementById('wbHeight').min=def(selected).minH;}}
  function libraryRefresh(){
    library.querySelector('.wb-library-subtitle').textContent=`${definitions.length} 个组件 · ${definitions.length-visible().length} 个可添加 · 拖入画布或点击添加`;
    const list=library.querySelector('.wb-library-list');list.replaceChildren();
    definitions.forEach(d=>{
      const used=item(d.id).visible,card=document.createElement('button');card.type='button';card.className='wb-library-card'+(used?' in-use':'');card.dataset.wbLibrary=d.id;card.setAttribute('aria-disabled',String(used));card.setAttribute('aria-label',`${used?'已添加':'添加'}${d.name}`);
      card.innerHTML=`<header><strong>${d.name}</strong><small>${used?'已在画布':'拖动添加 ＋'}</small></header><div class="wb-library-preview" inert><div class="wb-library-preview-inner"></div></div>`;
      const inner=card.querySelector('.wb-library-preview-inner'),node=getNode(d.id).cloneNode(true);
      node.removeAttribute('id');node.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));node.querySelectorAll('[data-layout-item]').forEach(n=>n.removeAttribute('data-layout-item'));
      node.querySelectorAll('input,button,a,textarea,select').forEach(n=>n.tabIndex=-1);
      const width=d.id==='summaries'||d.id==='banner'||d.id==='news'||d.id==='groupNews'?1174:576;
      inner.style.width=width+'px';inner.style.transform=`scale(${244/width})`;node.style.width=width+'px';node.style.height=(d.id==='brief'?1018:d.h||417)+'px';node.style.margin='0';inner.append(node);list.append(card);
    });
  }
  function toggleLibrary(force){libraryOpen=force??!libraryOpen;library.hidden=!libraryOpen;toolbar.querySelector('[data-wb-command="library"]').classList.toggle('active',libraryOpen);toolbar.querySelector('[data-wb-command="library"]').setAttribute('aria-expanded',String(libraryOpen));if(libraryOpen)libraryRefresh();}
  function selectWidget(id){selected=id;wrappers.forEach((el,key)=>el.classList.toggle('selected',editing&&key===id));refreshToolbar();}
  function resizeItem(id,width,height){
    const cur=item(id),spec=def(id),next={...cur,w:Math.max(spec.minW,Math.min(W-cur.x,width)),h:Math.max(spec.minH,Math.min(H-cur.y,height))};
    for(let pass=0;pass<3;pass++)visible().filter(o=>o.id!==id).forEach(o=>{
      if(!overlaps(next,o))return;
      if(o.x>=cur.x+cur.w-1)next.w=Math.max(spec.minW,Math.min(next.w,o.x-cur.x));
      if(o.y>=cur.y+cur.h-1)next.h=Math.max(spec.minH,Math.min(next.h,o.y-cur.y));
    });
    if(fits(next,[id]))Object.assign(cur,next);return cur;
  }
  function findSpace(id,preferred){const current=item(id),size={w:Math.min(W,current.w),h:Math.min(H,current.h)};const candidates=[{x:preferred?.x??current.x,y:preferred?.y??current.y},{x:current.x,y:current.y},{x:0,y:0}];visible().filter(i=>i.id!==id).forEach(i=>{candidates.push({x:i.x+i.w+GAP,y:i.y},{x:i.x,y:i.y+i.h+GAP});});
    for(const p of candidates){const r={...size,x:Math.max(0,Math.min(W-size.w,p.x)),y:Math.max(0,Math.min(H-size.h,p.y))};if(fits(r,[id]))return r;}
    for(let y=0;y<=H-size.h;y+=16)for(let x=0;x<=W-size.w;x+=16)if(fits({x,y,...size},[id]))return {x,y,...size};return null;
  }
  function arrangeForAddition(id,preferred){
    const ordered=visible().filter(i=>i.id!==id).sort((a,b)=>a.y-b.y||a.x-b.x),added=item(id);
    let index=ordered.length;if(preferred){const nearest=ordered.findIndex(i=>preferred.y<=i.y+i.h/2);if(nearest>=0)index=nearest;}
    ordered.splice(index,0,added);const cols=3,rows=Math.ceil(ordered.length/cols),width=(W-GAP*(cols-1))/cols,height=(H-GAP*(rows-1))/rows;
    ordered.forEach((i,n)=>Object.assign(i,{visible:true,x:(n%cols)*(width+GAP),y:Math.floor(n/cols)*(height+GAP),w:width,h:height}));
  }
  function addWidget(id,preferred,before=clone(state)){if(item(id).visible)return;const space=findSpace(id,preferred);item(id).visible=true;if(space)Object.assign(item(id),space);else arrangeForAddition(id,preferred);selected=id;apply();libraryRefresh();commit(before,space?'组件已添加':'组件已添加，并自动整理布局');}
  function placementPreview(rect,label,invalid=false){placement.hidden=false;Object.assign(placement.style,{left:rect.x+'px',top:rect.y+'px',width:rect.w+'px',height:rect.h+'px'});placement.classList.toggle('invalid',invalid);placement.innerHTML=`<span>${esc(label)}</span>`;}
  function dragCandidate(g,p){
    const source=item(g.id),spec=def(g.id);
    const target=visible().find(i=>i.id!==g.id&&p.x>=i.x&&p.x<=i.x+i.w&&p.y>=i.y&&p.y<=i.y+i.h&&i.w>=spec.minW&&i.h>=spec.minH&&source.w>=def(i.id).minW&&source.h>=def(i.id).minH);
    if(target)return {target:target.id,rect:{x:target.x,y:target.y,w:target.w,h:target.h},valid:true};
    const rect={x:Math.max(0,Math.min(W-source.w,snap(g.original.x+p.x-g.start.x))),y:Math.max(0,Math.min(H-source.h,snap(g.original.y+p.y-g.start.y))),w:source.w,h:source.h};
    return {rect,valid:fits(rect,[g.id])};
  }
  function clearGesture(){
    wrappers.forEach(el=>el.classList.remove('dragging','swap-target'));
    document.querySelectorAll('.wb-item-target,.wb-item-dragging').forEach(el=>el.classList.remove('wb-item-target','wb-item-dragging'));
    placement.hidden=true;dragLabel.hidden=true;
  }
  function endGesture(event,cancel=false){
    if(!gesture||event.pointerId!==gesture.pointerId)return;
    const g=gesture;gesture=null;
    if(g.moved){suppressClick=true;
      if(cancel){state=g.before;apply();}
      else if(g.kind==='move'){
        if(g.candidate?.valid){const source=item(g.id),old={x:source.x,y:source.y,w:source.w,h:source.h};if(g.candidate.target)Object.assign(item(g.candidate.target),old);Object.assign(source,g.candidate.rect);apply();commit(g.before);}
        else toast('位置与其他组件重叠，可拖到空白处或合适的组件上交换');
      }else if(g.kind==='resize'){commit(g.before);}
      else if(g.kind==='library'){
        const p=point(event);if(p.x>=0&&p.x<=W&&p.y>=0&&p.y<=H&&!library.contains(document.elementFromPoint(event.clientX,event.clientY)))addWidget(g.id,{x:Math.max(0,p.x-item(g.id).w/2),y:Math.max(0,p.y-25)},g.before);
      }else if(g.kind==='item'&&g.target){const source=document.querySelector(`[data-layout-item="${g.key}"]`),target=document.querySelector(`[data-layout-item="${g.target}"]`);if(source&&target&&source.parentElement===target.parentElement){const siblings=[...source.parentElement.children],after=siblings.indexOf(source)<siblings.indexOf(target);target.parentElement.insertBefore(source,after?target.nextSibling:target);commit(g.before);}}
    }
    clearGesture();if(g.capture.hasPointerCapture(g.pointerId))g.capture.releasePointerCapture(g.pointerId);refreshToolbar();
  }
  document.addEventListener('pointerdown',event=>{
    if(!editing||!event.isPrimary||event.button!==0||gesture)return;
    suppressClick=false;
    const lib=event.target.closest('[data-wb-library]'),handle=event.target.closest('[data-wb-drag]'),resize=event.target.closest('[data-wb-resize]'),shortcut=event.target.closest('.wb-widget [data-layout-item]'),widget=event.target.closest('.wb-widget');
    // Dedicated close/resize actions take priority over whole-widget dragging.
    if(event.target.closest('[data-wb-hide]'))return;
    const before=clone(state),start=point(event);let g=null;
    if(lib&&!item(lib.dataset.wbLibrary).visible)g={kind:'library',id:lib.dataset.wbLibrary,capture:lib};
    else if(resize){const id=resize.dataset.wbResize;selectWidget(id);g={kind:'resize',id,original:clone(item(id)),capture:resize};}
    else if(shortcut&&event.altKey){g={kind:'item',key:shortcut.dataset.layoutItem,group:shortcut.parentElement.id,capture:shortcut};}
    else if(widget){const id=widget.dataset.widgetId;selectWidget(id);g={kind:'move',id,original:clone(item(id)),capture:widget};}
    if(g){
      gesture={...g,before,start,pointerId:event.pointerId,screenX:event.clientX,screenY:event.clientY,moved:false};
      // Nested carousels and business controls must not start a second gesture.
      if(g.kind!=='library'){event.preventDefault();event.stopImmediatePropagation();}
    }
  },true);
  window.addEventListener('pointermove',event=>{
    const g=gesture;if(!g||g.pointerId!==event.pointerId)return;
    if(!g.moved&&Math.hypot(event.clientX-g.screenX,event.clientY-g.screenY)<5)return;
    if(!g.moved){g.moved=true;g.capture.setPointerCapture(event.pointerId);}
    event.preventDefault();const p=point(event);
    if(g.kind==='move'){
      g.candidate=dragCandidate(g,p);wrappers.forEach((el,id)=>el.classList.toggle('swap-target',id===g.candidate.target));wrappers.get(g.id).classList.add('dragging');placementPreview(g.candidate.rect,g.candidate.target?`与「${def(g.candidate.target).name}」交换位置`:g.candidate.valid?'松开完成移动':'与其他组件重叠',!g.candidate.valid);
    }else if(g.kind==='resize'){
      resizeItem(g.id,snap(g.original.w+p.x-g.start.x),snap(g.original.h+p.y-g.start.y));apply();wrappers.get(g.id).classList.add('dragging');
    }else if(g.kind==='library'){
      const r=canvas.getBoundingClientRect(),s=scale();dragLabel.hidden=false;dragLabel.textContent=`＋ ${def(g.id).name}`;dragLabel.style.left=(event.clientX-r.left)/s+15+'px';dragLabel.style.top=(event.clientY-r.top)/s+15+'px';
      if(p.x>=0&&p.x<=W&&p.y>=0&&p.y<=H){const spot=findSpace(g.id,{x:p.x-item(g.id).w/2,y:p.y-25});placementPreview(spot||{x:Math.max(0,Math.min(W-575,p.x-287)),y:Math.max(0,Math.min(H-250,p.y-25)),w:575,h:250},spot?'松开添加组件':'松开添加并自动整理布局');}else placement.hidden=true;
    }else if(g.kind==='item'){
      g.capture.classList.add('wb-item-dragging');const target=document.elementsFromPoint(event.clientX,event.clientY).map(el=>el.closest?.('[data-layout-item]')).find(el=>el&&el.parentElement.id===g.group&&el.dataset.layoutItem!==g.key);g.target=target?.dataset.layoutItem||null;document.querySelectorAll('[data-layout-item]').forEach(el=>el.classList.toggle('wb-item-target',el.dataset.layoutItem===g.target));
    }
  },{passive:false});
  window.addEventListener('pointerup',e=>endGesture(e));window.addEventListener('pointercancel',e=>endGesture(e,true));
  document.addEventListener('dragstart',e=>{if(editing)e.preventDefault();},true);
  function cancel(){if(!editing)return;if(gesture)endGesture({pointerId:gesture.pointerId},true);state=clone(savedSnapshot);exit();apply();toast('已返回工作台，未保存的修改已放弃');}
  function exit(){editing=false;dirty=false;selected=null;undoStack=[];toggleLibrary(false);toolbar.hidden=true;document.body.classList.remove('wb-editing');apply();window.navigateWorkspace('workbench');}
  function saveLayout(){rememberOrders();try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch{toast('浏览器存储不可用，布局尚未保存');return;}savedSnapshot=clone(state);exit();toast('工作台布局已保存并生效');}
  const commands={back:cancel,library:()=>toggleLibrary(),save:saveLayout,reset:()=>{const before=clone(state);state=clone(defaults);selected=null;apply();libraryRefresh();commit(before,'已恢复默认布局，保存后生效');},undo:()=>{if(!undoStack.length)return;state=undoStack.pop();dirty=JSON.stringify(state)!==JSON.stringify(savedSnapshot);apply();if(libraryOpen)libraryRefresh();}};
  document.addEventListener('click',event=>{
    if(!editing)return;
    const target=event.target.closest('button,a,input,select,textarea');
    if(target?.closest('.wb-toolbar-size'))return;
    if(target?.dataset.wbCommand){event.preventDefault();event.stopImmediatePropagation();commands[target.dataset.wbCommand]?.();return;}
    if(suppressClick&&event.detail!==0){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;return;}
    const hidden=event.target.closest('[data-wb-hide]');if(hidden){event.preventDefault();event.stopImmediatePropagation();const before=clone(state);item(hidden.dataset.wbHide).visible=false;selected=null;apply();if(libraryOpen)libraryRefresh();commit(before,'组件已隐藏，可从组件库重新添加');return;}
    const lib=event.target.closest('[data-wb-library]');if(lib){event.preventDefault();event.stopImmediatePropagation();addWidget(lib.dataset.wbLibrary);return;}
    if(event.target.closest('.wb-widget')){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  document.addEventListener('keydown',event=>{
    if(!editing)return;
    if(event.key==='Escape'){if(gesture)endGesture({pointerId:gesture.pointerId},true);else if(libraryOpen)toggleLibrary(false);return;}
    const input=event.target.closest('input,textarea,select');
    if((event.metaKey||event.ctrlKey)&&event.key==='z'&&!input){event.preventDefault();commands.undo();return;}
    const handle=event.target.closest('[data-wb-resize],[data-wb-drag]');if(!handle||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const id=handle.dataset.wbResize||handle.dataset.wbDrag,cur=item(id),before=clone(state),step=event.shiftKey?32:8;
    const dx=event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,dy=event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0;
    if(handle.dataset.wbResize)resizeItem(id,cur.w+dx,cur.h+dy);else{const candidate={...cur,x:cur.x+dx,y:cur.y+dy};if(fits(candidate,[id]))Object.assign(cur,candidate);}apply();commit(before);
  });
  ['wbWidth','wbHeight'].forEach(id=>document.getElementById(id).addEventListener('change',()=>{if(!selected)return;const before=clone(state);const width=+document.getElementById('wbWidth').value,height=+document.getElementById('wbHeight').value;if(Number.isFinite(width)&&Number.isFinite(height))resizeItem(selected,width,height);apply();commit(before);}));
  document.addEventListener('click',e=>{if(editing)return;const b=e.target.closest('[data-wb-reminder-ignore]');if(b){b.closest('.portal-reminder').remove();toast('已忽略此提醒');}});
  window.workbenchEditor={open(){if(editing)return;window.navigateWorkspace('workbench');mount();savedSnapshot=clone(state);undoStack=[];dirty=false;selected=null;editing=true;document.body.classList.add('wb-editing');toolbar.hidden=false;apply();},getState:()=>clone(state)};
  window.addEventListener('beforeunload',event=>{if(editing&&dirty){event.preventDefault();event.returnValue='';}});
  if(JSON.stringify(state)!==JSON.stringify(defaults))mount();
})();
