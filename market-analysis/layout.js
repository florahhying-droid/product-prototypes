/* Reuse the 1688 task-detail navigation and module folding conventions. */
(() => {
  const main = document.querySelector('.main');
  if (main?.dataset.taskAccessDenied === 'true') return;
  const oldNav = main.querySelector('.jump-rail');
  const items = [
    ['basicSection', '任务信息'], ['referenceSection', '参考产品'],
    ['marketSection', '市场分析'], ['candidateSection', '1688溯源结果'],
    ['supplierSection', '备选供应商'], ['pendingSection', '待开发产品']
  ];
  const nav = document.createElement('nav');
  nav.className = 'module-anchor-bar';
  nav.setAttribute('aria-label', '任务详情模块导航');
  nav.innerHTML = `<div class="module-anchor-list">${items.map(([id, label], i) => `<button class="module-anchor ${i === 0 ? 'active' : ''}" type="button" data-target="${id}" ${id === 'marketSection' ? 'id="marketJump"' : ''}><span>${label}</span>${id === 'basicSection' ? '' : `<span class="module-anchor-count" data-count-for="${id}">0</span>`}</button>`).join('')}</div><div class="module-anchor-actions"></div>`;
  oldNav?.remove();
  main.querySelector('.detail-hero').after(nav);
  const actions = main.querySelector('.task-actions');
  if (actions) {
    nav.querySelector('.module-anchor-actions').append(...[...actions.children].filter(button => button.id === 'submitTask' || button.classList.contains('back-link')));
    actions.hidden = true;
  }
  document.getElementById('submitTask').textContent = '提交';

  function fold(box, collapsed) {
    box.classList.toggle('module-collapsed', collapsed);
    const button = box.querySelector(':scope > .section-head .module-toggle, :scope > .sub-head .module-toggle, :scope > .field-head .module-toggle, :scope > .comp-head .module-toggle');
    if (button) {
      button.setAttribute('aria-expanded', String(!collapsed));
      button.setAttribute('aria-label', (collapsed ? '展开' : '收起') + box.dataset.foldLabel);
      button.title = (collapsed ? '展开' : '收起') + box.dataset.foldLabel;
    }
  }
  function ready(box, head, label) {
    if (!head || box.dataset.foldReady) return;
    box.dataset.foldReady = 'true';
    box.dataset.foldLabel = label;
    box.classList.add('foldable-module');
    head.classList.add('module-fold-head');
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'module-toggle';
    toggle.textContent = '›';
    const title = head.querySelector('.section-title, h3');
    if (title) {
      title.prepend(toggle);
      if (box.classList.contains('detail-section')) {
        title.classList.add('collapse-title');
        const summary = document.createElement('span');
        summary.className = 'section-summary';
        title.append(summary);
      }
    }
    else head.prepend(toggle);
    head.addEventListener('click', event => {
      if (event.target.closest('a, input, select, textarea') || (event.target.closest('button') && !event.target.closest('.module-toggle'))) return;
      fold(box, !box.classList.contains('module-collapsed'));
    });
    fold(box, false);
  }
  // Both category and competitor blocks fold independently within market analysis.
  const market = document.getElementById('marketSection');
  market?.querySelectorAll(':scope > .sub-head').forEach((head, i) => {
    const part = document.createElement('div');
    part.className = 'market-submodule';
    part.id = i ? 'competitorAnalysisBlock' : 'categoryAnalysisBlock';
    head.before(part);
    let next = head.nextElementSibling;
    part.append(head);
    while (next && !next.classList.contains('sub-head')) {
      const following = next.nextElementSibling;
      part.append(next);
      next = following;
    }
    ready(part, head, i ? '竞品市场分析' : '类目市场分析');
  });
  function enhance() {
    items.forEach(([id, label]) => {
      const section = document.getElementById(id);
      if (section) ready(section, section.querySelector(':scope > .section-head'), label);
      const anchor = nav.querySelector(`[data-target="${id}"]`);
      if (anchor.hidden !== !!section?.hidden) anchor.hidden = !!section?.hidden;
      const totals = {referenceSection: '#refTotal', candidateSection: '#candidateTotal', supplierSection: '#supplierTotal', pendingSection: '#pendingTotal'};
      let count = id === 'basicSection' ? 1 : id === 'marketSection' ? 1 + Number(document.getElementById('competitors')?.dataset.total || 0) : Number((document.querySelector(totals[id])?.textContent.match(/\d+/) || ['0'])[0]);
      const badge = anchor.querySelector('.module-anchor-count');
      if (badge && badge.textContent !== String(count)) badge.textContent = String(count);
      const summary = section?.querySelector(':scope > .section-head .section-summary');
      if (summary) {
        let text;
        if (id === 'basicSection') {
          const fields = [...section.querySelectorAll('.task-grid > div')];
          const value = name => {const label = fields.find(el => el.classList.contains('label') && el.textContent.trim() === name); return label?.nextElementSibling?.textContent.trim() || '';};
          text = value('星商品线') + ' · 负责人 ' + value('负责人');
        } else text = count + (id === 'marketSection' ? '份分析' : '条');
        if (summary.textContent !== text) summary.textContent = text;
      }
      if (id === 'marketSection') {const title = '1份类目分析、' + (count - 1) + '份竞品分析'; if (badge.title !== title) badge.title = title;}
      if (id === 'pendingSection' && badge.title !== 'SPU和SKU总数') badge.title = 'SPU和SKU总数';
    });
    market?.querySelectorAll('.dim-card').forEach(card => ready(card, card.querySelector(':scope > .field-head'), card.querySelector('.field-head')?.textContent.trim() || '分析内容'));
    market?.querySelectorAll('.comp-card').forEach(card => ready(card, card.querySelector(':scope > .comp-head'), card.querySelector('.comp-name')?.textContent.trim() || '竞品分析'));
  }
  function reveal(target) {
    let parent = target;
    while (parent && parent !== main) {
      if (parent.classList.contains('foldable-module')) fold(parent, false);
      parent = parent.parentElement;
    }
  }
  nav.addEventListener('click', event => {
    const button = event.target.closest('[data-target]');
    if (!button) return;
    const target = document.getElementById(button.dataset.target);
    if (!target) return;
    reveal(target);
    nav.querySelectorAll('.module-anchor').forEach(a => a.classList.toggle('active', a === button));
    target.scrollIntoView({behavior: 'smooth', block: 'start'});
  });
  // Existing jump links and validation can also reveal a collapsed field.
  main.addEventListener('click', event => {
    const jump = event.target.closest('[data-jump], a[href^="#"]');
    if (jump) {
      const target = document.getElementById(jump.dataset.jump ? 'comp-' + jump.dataset.jump : jump.getAttribute('href').slice(1));
      if (target) reveal(target);
    }
  }, true);
  main.addEventListener('focusin', event => {
    if (event.target.matches('input, textarea, select, [contenteditable="true"]')) reveal(event.target);
  });
  enhance();
  fold(document.getElementById('basicSection'), true);
  new MutationObserver(() => enhance()).observe(main, {childList: true, subtree: true});
})();
