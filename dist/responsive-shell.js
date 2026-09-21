(() => {
  const screen = document.body.dataset.screen || '';
  const hash = window.parent?.location?.hash?.replace(/^#/, '') || '/';

  const items = [
    { href: '/#/', match: value => value === '/' || value === '', icon: 'home', label: 'หน้าแรก' },
    { href: '/#/map', match: value => value === '/map' || value === '/explore' || value === '/search' || value.startsWith('/poi/') || value.startsWith('/category/'), icon: 'map', label: 'สำรวจ' },
    { href: '/#/events', match: value => value.startsWith('/events'), icon: 'event', label: 'กิจกรรม' },
    { href: '/#/plan/templates', match: value => value.startsWith('/plan/') || value === '/my-itineraries', icon: 'route', label: 'แผนเที่ยว' },
    { href: '/#/about', match: value => ['/about', '/help', '/privacy', '/terms'].includes(value), icon: 'info', label: 'เกี่ยวกับ' }
  ];

  const nav = document.createElement('nav');
  nav.className = 'tp-mobile-nav';
  nav.setAttribute('aria-label', 'เมนูหลักบนมือถือ');
  nav.innerHTML = items.map(item => {
    const current = item.match(hash) ? ' aria-current="page"' : '';
    return `<a href="${item.href}"${current}><span class="material-symbols-outlined" aria-hidden="true">${item.icon}</span><span>${item.label}</span></a>`;
  }).join('');
  document.body.appendChild(nav);

  document.querySelectorAll('button, a, input, select, textarea').forEach(element => {
    if (element.matches('button, a') && !element.getAttribute('aria-label') && !element.textContent.trim()) {
      element.setAttribute('aria-label', 'ปุ่มใช้งาน');
    }
  });

  if (screen === 's02' || screen === 's11') {
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 250);
  }
})();
