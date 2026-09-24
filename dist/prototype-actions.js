// Behaviour for controls the exported screens left inert: filters, bookmarks,
// share, contact links and similar. Injected into every screen by router.js.
// Runs in the capture phase on window, ahead of prototype-nav.js, and only
// claims the controls it handles.
(() => {
  const screen = document.body.dataset.screen || location.pathname.match(/\/screens\/(s\d+)\//)?.[1] || '';
  const go = route => { window.parent.location.hash = route; };
  const clean = value => (value || '').replace(/\s+/g, ' ').trim();
  const labelOf = element => clean(element?.textContent);
  const iconOf = element => clean(element.querySelector('.material-symbols-outlined')?.textContent);
  // Tailwind display utilities (flex, grid) outrank the hidden attribute, so hide inline.
  const setHidden = (element, hidden) => { element.style.display = hidden ? 'none' : ''; };
  const isPlaceholderLink = element => element.tagName === 'A' && ['', '#'].includes(element.getAttribute('href') || '');

  // id: [name, category route, sub-categories used by the category filters]
  const PLACES = {
    'umbrella-center': ['ศูนย์อุตสาหกรรมทำร่มบ่อสร้าง', 'handicraft', ['ร่มบ่อสร้าง']],
    'sa-paper-demo': ['ศูนย์สาธิตการทำกระดาษสา', 'handicraft', ['กระดาษสา']],
    'woodcraft-museum': ['พิพิธภัณฑ์หัตถกรรมไม้แกะสลัก', 'handicraft', ['งานไม้']],
    'lanna-textile-shop': ['ร้านผ้าทอเมืองล้านนา', 'handicraft', ['งานผ้า']],
    'wat-tonpao': ['วัดต้นเปา', 'temples-culture', ['วัด', 'สถาปัตยกรรมล้านนา']],
    'wat-borsang': ['วัดบ่อสร้าง', 'temples-culture', ['วัด']],
    'tonpao-cultural-center': ['ศูนย์วัฒนธรรมชุมชนต้นเปา', 'temples-culture', ['ศิลปวัฒนธรรม']],
    'tonpao-cultural-community': ['ชุมชนวัฒนธรรมบ้านต้นเปา', 'temples-culture', ['ประเพณีชุมชน']],
    'tonpao-cafe': ['เสน่ห์คาเฟ่ ต้นเปา', 'food-cafe', ['คาเฟ่']],
    'tonpao-kitchen': ['ครัวเมืองต้นเปา', 'food-cafe', ['ร้านอาหาร', 'อาหารท้องถิ่น']],
    'tonpao-food-market': ['ตลาดของกินชุมชนต้นเปา', 'food-cafe', ['อาหารท้องถิ่น']],
    'tonpao-coffee-house': ['บ้านขนมและกาแฟต้นเปา', 'food-cafe', ['ของหวานและเครื่องดื่ม', 'คาเฟ่']],
    'tonpao-homestay': ['บ้านต้นเปาโฮมสเตย์', 'accommodation', ['โฮมสเตย์', 'ที่พักใกล้ชุมชน']],
    'borsang-garden-resort': ['บ่อสร้างการ์เดนรีสอร์ต', 'accommodation', ['รีสอร์ต']],
    'lanna-guesthouse': ['เรือนล้านนาเกสต์เฮาส์', 'accommodation', ['เกสต์เฮาส์']],
    'tonpao-garden-house': ['บ้านสวนต้นเปา', 'accommodation', ['ที่พักใกล้ชุมชน']],
    'umbrella-learning': ['ศูนย์เรียนรู้การทำร่มบ่อสร้าง', 'community-learning', ['หัตถกรรมและอาชีพ', 'เวิร์กชอปชุมชน']],
    'sa-paper-learning': ['ศูนย์เรียนรู้การทำกระดาษสา', 'community-learning', ['หัตถกรรมและอาชีพ', 'เวิร์กชอปชุมชน']],
    'community-museum': ['พิพิธภัณฑ์หัตถกรรมชุมชน', 'community-learning', ['ประวัติศาสตร์ท้องถิ่น']],
    'community-agriculture': ['แหล่งเรียนรู้เกษตรชุมชนต้นเปา', 'community-learning', ['เกษตรและสิ่งแวดล้อม']]
  };
  const idByName = Object.fromEntries(Object.entries(PLACES).map(([id, [name]]) => [name, id]));

  let toastTimer;
  const toast = message => {
    let node = document.getElementById('tp-toast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'tp-toast';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      Object.assign(node.style, {
        position: 'fixed', left: '50%', bottom: '88px', transform: 'translateX(-50%)', zIndex: '9999',
        maxWidth: 'calc(100vw - 32px)', padding: '12px 20px', borderRadius: '999px', background: '#161c28', color: '#fff',
        font: "500 15px/1.45 'Be Vietnam Pro','Noto Sans Thai',sans-serif", textAlign: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,.2)', opacity: '0', transition: 'opacity .2s', pointerEvents: 'none'
      });
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.style.opacity = '0'; }, 2600);
  };

  // Saved places persist per browser only; the prototype has no accounts.
  const SAVED_KEY = 'tonpao:saved-places';
  const readSaved = () => { try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch { return []; } };
  const toggleSaved = id => {
    const list = readSaved();
    const saved = !list.includes(id);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved ? [...list, id] : list.filter(item => item !== id))); } catch { /* storage blocked */ }
    return saved;
  };
  const paintBookmark = (button, saved) => {
    button.setAttribute('aria-pressed', String(saved));
    if (!labelOf(button).replace(/bookmark/, '').trim()) button.setAttribute('aria-label', saved ? 'นำออกจากรายการที่บันทึก' : 'บันทึกสถานที่');
    const icon = button.querySelector('.material-symbols-outlined');
    if (icon) icon.style.fontVariationSettings = `'FILL' ${saved ? 1 : 0}`;
  };
  const bookmark = (button, id) => {
    if (!id) return;
    const saved = toggleSaved(id);
    paintBookmark(button, saved);
    toast(saved ? `บันทึก “${PLACES[id][0]}” แล้ว` : `นำ “${PLACES[id][0]}” ออกจากรายการที่บันทึกแล้ว`);
  };

  const share = async title => {
    const url = window.parent.location.href;
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('คัดลอกลิงก์แล้ว');
    } catch {
      toast(`คัดลอกลิงก์ไม่สำเร็จ: ${url}`);
    }
  };
  const openExternal = url => window.open(url, '_blank', 'noopener');

  // Mark the one-of-many buttons in a group (null clears it), reusing the export's own active/idle classes.
  const selectable = buttons => {
    const activeClass = buttons[0].className;
    const idleClass = buttons[1]?.className || activeClass;
    const check = buttons[0].querySelector('.material-symbols-outlined:last-child:not(:first-child)');
    return selected => buttons.forEach(button => {
      const on = button === selected;
      button.className = on ? activeClass : idleClass;
      button.setAttribute('aria-pressed', String(on));
      if (check && on) button.appendChild(check);
    });
  };

  const rules = [];
  const on = (test, run) => rules.push({ test, run });
  window.addEventListener('click', event => {
    const control = event.target.closest?.('a, button, [role="button"]');
    const rule = control && rules.find(item => item.test(control));
    if (!rule) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    rule.run(control);
  }, true);

  // Shared header and footer controls.
  on(control => control.closest('header') && iconOf(control) === 'help' && labelOf(control) === 'help',
    () => (screen === 's13' ? document.querySelector('main input')?.focus() : go('/help')));
  on(control => control.closest('header') && labelOf(control) === 'notifications',
    () => toast('ยังไม่มีการแจ้งเตือนใหม่ ติดตามกิจกรรมล่าสุดได้ที่หน้า “กิจกรรม”'));
  on(control => labelOf(control) === 'mail', () => go('/about'));
  on(control => isPlaceholderLink(control) && /^(ติดต่อเรา|Contact Us|สำนักงานการท่องเที่ยว|Tourism Office)$/.test(labelOf(control)), () => {
    const contact = [...document.querySelectorAll('main span')].find(span => /info@tonpao/.test(span.textContent));
    if (contact) contact.closest('div, section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else go('/about');
  });
  on(control => isPlaceholderLink(control) && labelOf(control) === 'ข้อกำหนดการใช้งาน', () => go('/terms'));
  on(control => isPlaceholderLink(control) && labelOf(control) === 'นโยบายความเป็นส่วนตัว', () => go('/privacy'));

  // s01 home: "ดูทั้งหมด" next to the featured places.
  on(control => screen === 's01' && isPlaceholderLink(control) && /^ดูทั้งหมด/.test(labelOf(control)), () => go('/map'));

  // s19–s23 category listings: sub-category, distance and sort filters, bookmarks, detail links.
  if (['s19', 's20', 's21', 's22', 's23'].includes(screen)) {
    const cards = [...document.querySelectorAll('article')].filter(card => idByName[labelOf(card.querySelector('h3'))]);
    const grid = cards[0]?.parentElement;
    const aside = document.querySelector('aside');
    if (grid && aside) {
      const items = cards.map((card, index) => {
        const id = idByName[labelOf(card.querySelector('h3'))];
        const distance = card.textContent.match(/([\d.]+)\s*(กม\.|ม\.)\s*จากตำแหน่งของคุณ/);
        const star = [...card.querySelectorAll('.material-symbols-outlined')].find(icon => labelOf(icon) === 'star');
        card.dataset.poiId = id || '';
        return {
          card, index, id,
          tags: PLACES[id]?.[2] || [],
          km: distance ? parseFloat(distance[1]) / (distance[2] === 'ม.' ? 1000 : 1) : 0,
          rating: parseFloat(labelOf(star?.nextElementSibling)) || 0
        };
      });
      const heading = [...aside.querySelectorAll('h3')].find(title => /หมวดหมู่ย่อย/.test(title.textContent));
      const chips = [...(heading?.nextElementSibling?.querySelectorAll('button') || [])];
      const radios = [...aside.querySelectorAll('input[name="distance"]')];
      const sort = aside.querySelector('select');
      const count = [...document.querySelectorAll('main span')].find(span => /^แสดง \d+ จาก \d+ รายการ$/.test(labelOf(span)));
      if (count?.nextElementSibling) setHidden(count.nextElementSibling, true); // every listing fits on one page
      const empty = document.createElement('div');
      setHidden(empty, true);
      empty.className = 'rounded-xl border border-dashed border-outline-variant p-lg text-center text-on-surface-variant';
      empty.innerHTML = 'ไม่พบสถานที่ที่ตรงกับตัวกรอง <button type="button" data-reset-filters class="ml-2 font-bold text-primary underline">ล้างตัวกรอง</button>';
      grid.after(empty);
      const markChip = chips.length ? selectable(chips) : () => {};
      const state = { tag: 'ทั้งหมด' };
      const maxKm = () => {
        const label = labelOf(radios.find(radio => radio.checked)?.parentElement);
        return label === 'ใกล้ฉัน' ? 1 : parseFloat(label) || Infinity;
      };
      const apply = () => {
        const limit = maxKm();
        const order = sort?.selectedIndex === 1 ? (a, b) => a.km - b.km
          : sort?.selectedIndex === 2 ? (a, b) => b.rating - a.rating
          : (a, b) => a.index - b.index;
        const visible = items.filter(item => (state.tag === 'ทั้งหมด' || item.tags.includes(state.tag)) && item.km <= limit);
        [...items].sort(order).forEach(item => {
          setHidden(item.card, !visible.includes(item));
          grid.appendChild(item.card);
        });
        setHidden(empty, visible.length > 0);
        if (count) count.textContent = `แสดง ${visible.length} จาก ${items.length} รายการ`;
      };
      items.forEach(item => {
        const button = [...item.card.querySelectorAll('button')].find(candidate => iconOf(candidate) === 'bookmark');
        if (button) paintBookmark(button, readSaved().includes(item.id));
      });
      on(control => chips.includes(control), control => {
        state.tag = labelOf(control.querySelector('span')) || labelOf(control);
        markChip(control);
        apply();
      });
      on(control => control.matches('[data-reset-filters]'), () => {
        state.tag = 'ทั้งหมด';
        markChip(chips[0]);
        const widest = radios[radios.length - 1];
        if (widest) widest.checked = true;
        if (sort) sort.selectedIndex = 0;
        apply();
      });
      radios.forEach(radio => radio.addEventListener('change', apply));
      sort?.addEventListener('change', apply);
      on(control => control.closest('article')?.dataset.poiId && iconOf(control) === 'bookmark',
        control => bookmark(control, control.closest('article').dataset.poiId));
      on(control => control.closest('article')?.dataset.poiId && /^ดูรายละเอียด/.test(labelOf(control)),
        control => go(`/poi/${control.closest('article').dataset.poiId}`));
      apply();
    }
  }

  // s04 place detail.
  if (screen === 's04') {
    const id = new URLSearchParams(location.search).get('poi') || 'umbrella-center';
    const name = PLACES[id]?.[0] || labelOf(document.querySelector('main h1'));
    const saveButton = [...document.querySelectorAll('main button')].find(button => iconOf(button) === 'bookmark');
    if (saveButton) paintBookmark(saveButton, readSaved().includes(id));
    const crumbs = document.querySelectorAll('main nav a');
    on(control => control === crumbs[0], () => go('/'));
    on(control => control === crumbs[1], () => go(PLACES[id] ? `/category/${PLACES[id][1]}` : '/map'));
    on(control => control.tagName === 'BUTTON' && labelOf(control) === 'ดูทั้งหมด',
      control => go(/กิจกรรม/.test(control.parentElement.textContent) ? '/events' : '/map'));
    on(control => iconOf(control) === 'call' && /โทร/.test(labelOf(control)),
      () => toast(`ยังไม่มีเบอร์โทรของ ${name} ในระบบ`));
    on(control => iconOf(control) === 'language' && /เว็บไซต์/.test(labelOf(control)),
      () => openExternal(`https://www.google.com/search?q=${encodeURIComponent(`${name} ต้นเปา สันกำแพง`)}`));
    on(control => iconOf(control) === 'facebook',
      () => openExternal(`https://www.facebook.com/search/top?q=${encodeURIComponent(name)}`));
    on(control => iconOf(control) === 'share' && /แชร์/.test(labelOf(control)), () => share(`${name} — TonPao Map`));
    on(control => control === saveButton, control => bookmark(control, PLACES[id] ? id : null));
  }

  // s08 event schedule: only the first day has published sessions.
  if (screen === 's08') {
    const title = [...document.querySelectorAll('h3')].find(heading => /เลือกวันที่/.test(heading.textContent));
    const days = [...(title?.nextElementSibling?.querySelectorAll('button') || [])];
    const timeline = document.querySelector('.space-y-lg.relative');
    if (days.length && timeline) {
      const markDay = selectable(days);
      const empty = document.createElement('div');
      setHidden(empty, true);
      empty.className = 'p-xl text-center text-on-surface-variant';
      timeline.after(empty);
      on(control => days.includes(control), control => {
        markDay(control);
        const first = control === days[0];
        setHidden(timeline, !first);
        setHidden(empty, first);
        empty.textContent = `ยังไม่มีกำหนดการที่ประกาศสำหรับวันที่ ${labelOf(control).replace(/\s*check$/, '')}`;
      });
    }
    on(control => isPlaceholderLink(control) && /^เทศกาลร่มบ่อสร้าง/.test(labelOf(control)), () => go('/events/umbrella-festival'));
  }

  // s13 help: topic tabs and FAQ search.
  if (screen === 's13') {
    const topics = [...document.querySelectorAll('aside nav a')];
    const faqs = [...document.querySelectorAll('section button[onclick]')].map(button => button.parentElement);
    const faqTopics = ['Getting Started', 'Contributor Guide', 'Using the Map'];
    const heading = document.querySelector('section h2');
    const search = [...document.querySelectorAll('main input')].find(input => /คำถาม/.test(input.placeholder));
    const searchButton = search?.parentElement.querySelector('button');
    if (topics.length && faqs.length && heading) {
      const markTopic = selectable(topics);
      const empty = document.createElement('div');
      setHidden(empty, true);
      empty.className = 'rounded-2xl border border-dashed border-outline-variant p-lg text-center text-on-surface-variant';
      faqs[faqs.length - 1].after(empty);
      const show = (visible, message) => {
        faqs.forEach(faq => { setHidden(faq, !visible.includes(faq)); });
        setHidden(empty, visible.length > 0);
        empty.textContent = message;
      };
      on(control => topics.includes(control), control => {
        const topic = labelOf(control).replace(/^\S+\s/, '');
        markTopic(control);
        heading.textContent = topic;
        if (search) search.value = '';
        show(faqs.filter((_, index) => faqTopics[index] === topic), 'ยังไม่มีคำถามในหมวดนี้ ติดต่อทีมงานได้ที่ปุ่ม “ติดต่อฝ่ายสนับสนุน” ด้านล่าง');
      });
      const runSearch = () => {
        const query = clean(search.value).toLowerCase();
        markTopic(null);
        heading.textContent = query ? `ผลการค้นหา “${search.value.trim()}”` : 'คำถามทั้งหมด';
        const visible = faqs.filter(faq => faq.textContent.toLowerCase().includes(query));
        visible.forEach(faq => { if (query) faq.querySelector('button + div')?.classList.remove('hidden'); });
        show(visible, 'ไม่พบคำถามที่ตรงกับคำค้นหา ลองใช้คำอื่น หรือติดต่อฝ่ายสนับสนุน');
      };
      on(control => control === searchButton, runSearch);
      search?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); runSearch(); } });
    }
    on(control => /ติดต่อฝ่ายสนับสนุน/.test(labelOf(control)), () => go('/about'));
  }

  // s12 about: the contact card lists the municipality address.
  on(control => screen === 's12' && /ส่งข้อความถึงเรา/.test(labelOf(control)), () => {
    window.open(`mailto:info@tonpao.go.th?subject=${encodeURIComponent('ติดต่อจาก TonPao Map')}`, '_self');
  });

  // s42 my itineraries.
  on(control => screen === 's42' && labelOf(control) === 'ดำเนินการต่อ', () => go('/plan/result'));

  // s07 parking: vehicle type filter over the parking cards.
  if (screen === 's07') {
    const heading = [...document.querySelectorAll('h2')].find(title => /ค้นหาที่จอดรถ/.test(title.textContent));
    const vehicles = [...(heading?.nextElementSibling?.querySelectorAll('button') || [])];
    if (vehicles.length) {
      const markVehicle = selectable(vehicles);
      const keyword = { directions_car: 'รถยนต์', two_wheeler: 'รถจักรยานยนต์', directions_bus: 'รถบัส' };
      on(control => vehicles.includes(control), control => {
        markVehicle(control);
        const word = keyword[iconOf(control)];
        const cards = [...document.querySelectorAll('.sidebar-scroll > div')];
        const matches = cards.filter(card => card.textContent.includes(word));
        cards.forEach(card => { setHidden(card, !matches.includes(card)); });
        toast(`พบที่จอดสำหรับ${labelOf(control).replace(/^\S+\s/, '')} ${matches.length} จุด`);
      });
    }
  }
})();
