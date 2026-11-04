/* Anchored menus use the same design coordinates as their header triggers. */
(() => {
  const tools = document.querySelector('.top-actions .tools');
  const paths = {
    search: '<circle cx="10.5" cy="10.5" r="7.8"/><path d="m16.3 16.3 5 5"/>',
    settings: '<path d="m9.4 2.7-.6 2.2-2 .9-2.1-.6-2 3.5 1.6 1.6v2.4l-1.6 1.6 2 3.5 2.1-.6 2 .9.6 2.2h4l.6-2.2 2-.9 2.1.6 2-3.5-1.6-1.6v-2.4l1.6-1.6-2-3.5-2.1.6-2-.9-.6-2.2z"/><circle cx="11.4" cy="11.5" r="3.4"/>',
    help: '<circle cx="12" cy="12" r="9.4"/><path d="M9.3 8.2a2.8 2.8 0 1 1 4.5 2.2c-1.3.8-1.8 1.2-1.8 3.1"/><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none"/>',
    travel: '<rect x="3" y="6" width="12" height="15" rx="1.5"/><path d="M7 6V3h4v3M6 9v9m6-9v3M6 21v1m6-1v1"/><circle cx="17" cy="17" r="4"/><path d="M17 14v3l2 1"/>',
    layout: '<rect x="2" y="3" width="20" height="18" rx="1"/><path d="M2 7h20M8 7v14"/>',
    preferences: '<path d="M3 5h18M3 12h6M3 19h5"/><circle cx="16" cy="15" r="3"/><path d="M16 10v2m0 6v2m-5-5h2m6 0h2m-9-4 1.5 1.5m5 5L20 19m-8 0 1.5-1.5m5-5L20 11"/>',
    logout: '<path d="M11 3H3v18h8m-3-9h14m-5-5 5 5-5 5"/>',
    feedback: '<path d="M8 10 12 4V1h2c2 1 2 4 1 7h5c2 0 2 1 2 3l-2 9H8z"/><path d="M3 10h5v10H3z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7" r=".8" fill="currentColor" stroke="none"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
  document.querySelector('.top-actions [data-action="search"]').innerHTML = icon('search');
  document.querySelector('[data-header-menu="settings"]').innerHTML = icon('settings');
  document.querySelector('[data-header-menu="help"]').innerHTML = icon('help');
  const items = {
    settings: [['travel','差旅偏好','travel'],['layout','自定义工作台','customize'],['preferences','设置','settings'],['logout','退出系统','logout']],
    help: [['feedback','反馈','feedback'],['info','帮助','help']]
  };
  for (const [name, rows] of Object.entries(items)) {
    tools.insertAdjacentHTML('beforeend', `<div id="${name}Menu" class="header-menu ${name}-menu" role="menu" aria-label="${name==='settings'?'设置菜单':'帮助菜单'}" hidden>${rows.map(([svg,label,command])=>`<button role="menuitem" tabindex="-1" data-header-command="${command}" class="${command==='logout'?'danger':''}">${icon(svg)}<span>${label}</span></button>`).join('')}</div>`);
  }
  let current = null;
  function closeMenu(restoreFocus = false) {
    if (!current) return;
    const trigger = document.querySelector(`[data-header-menu="${current}"]`);
    document.getElementById(`${current}Menu`).hidden = true;
    trigger.setAttribute('aria-expanded','false');
    current = null;
    if (restoreFocus) trigger.focus();
  }
  function toggleMenu(name, keyboard = false) {
    if (current === name && !keyboard) { closeMenu(); return; }
    closeMenu();
    current = name;
    const menu = document.getElementById(`${name}Menu`);
    menu.hidden = false;
    document.querySelector(`[data-header-menu="${name}"]`).setAttribute('aria-expanded','true');
    if (keyboard) menu.querySelector('button').focus();
  }
  function readPreference(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function writePreference(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
  const handlers = {
    settings: () => actions.settings(),
    help: () => actions.help(),
    feedback: () => aiCommands.feedback(),
    travel: () => {
      const saved = readPreference('gx-travel-preferences',{transport:'高铁',seat:'靠窗',hotel:'无偏好'});
      openModal('差旅偏好', `<form id="travelPreferences"><label class="field">出行方式<select name="transport"><option>高铁</option><option>飞机</option><option>无偏好</option></select></label><label class="field">座位偏好<select name="seat"><option>靠窗</option><option>靠过道</option><option>无偏好</option></select></label><label class="field">酒店偏好<input name="hotel" maxlength="80" placeholder="请输入酒店偏好"></label><div class="modal-actions"><button type="button" class="secondary" data-close>取消</button><button class="primary">保存偏好</button></div></form>`);
      const form = document.querySelector('#travelPreferences');
      for (const name of ['transport','seat','hotel']) form.elements[name].value = saved[name];
      form.onsubmit = e => { e.preventDefault(); writePreference('gx-travel-preferences',Object.fromEntries(new FormData(form))); modal.close(); toast('差旅偏好已保存'); };
    },
    customize: () => {
      const saved = readPreference('gx-workbench-preferences',{home:'workbench'});
      openModal('自定义工作台', `<form id="workbenchPreferences"><label class="field">默认打开的工作台<select name="home"><option value="workbench">常用工作台</option><option value="ai">AI 工作台</option></select></label><p class="detail-text">保存后立即切换，下次打开时使用该工作台。</p><div class="modal-actions"><button type="button" class="secondary" data-close>取消</button><button class="primary">保存设置</button></div></form>`);
      const form = document.querySelector('#workbenchPreferences');
      form.elements.home.value = saved.home;
      form.onsubmit = e => { e.preventDefault(); const home=form.elements.home.value; writePreference('gx-workbench-preferences',{home}); switchWorkspace(home==='ai'); toast('默认工作台已更新'); };
    },
    logout: () => {
      openModal('退出系统','<p class="detail-text">当前为本地演示，尚未接入统一登录服务。</p><div class="modal-actions"><button class="primary" data-close>返回工作台</button></div>');
    }
  };
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-header-menu]');
    if (trigger) { toggleMenu(trigger.dataset.headerMenu); return; }
    const item = e.target.closest('[data-header-command]');
    if (item) { const command=item.dataset.headerCommand; closeMenu(); handlers[command]?.(); return; }
    closeMenu();
  });
  document.addEventListener('keydown', e => {
    const trigger = e.target.closest('[data-header-menu]');
    if (trigger && ['ArrowDown','ArrowUp'].includes(e.key)) { e.preventDefault(); toggleMenu(trigger.dataset.headerMenu,true); return; }
    if (!current) return;
    if (e.key==='Escape') { e.preventDefault(); closeMenu(true); return; }
    if (e.key==='Tab') { closeMenu(); return; }
    if (!['ArrowDown','ArrowUp','Home','End'].includes(e.key)) return;
    e.preventDefault();
    const buttons = [...document.getElementById(`${current}Menu`).querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    const next = e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
    buttons[next].focus();
  });
  document.addEventListener('focusin', e => { if(current && !tools.contains(e.target)) closeMenu(); });
  window.addEventListener('resize', () => closeMenu());
  const saved = readPreference('gx-workbench-preferences',{home:'workbench'});
  if(saved.home==='ai') switchWorkspace(true);
})();
