(() => {
  const screen = location.pathname.match(/\/screens\/(s\d+)\//)?.[1] || '';
  const go = route => { window.parent.location.hash = route; };
  const clean = value => (value || '').replace(/\s+/g, ' ').trim();
  const buttons = () => [...document.querySelectorAll('button')];
  const byButton = pattern => buttons().find(button => pattern.test(clean(button.textContent)));
  const readJson = (storage, key, fallback = {}) => {
    try { return JSON.parse(storage.getItem(key) || JSON.stringify(fallback)); }
    catch { storage.removeItem(key); return fallback; }
  };
  const templateDraft = name => {
    const base = { name: name || 'เที่ยวต้นเปาในแบบของฉัน', start:'', end:'', startPoint:'เทศบาลเมืองต้นเปา', constraints:[], template:name || null };
    if ((name || '').includes('ไหว้พระ')) return {...base, interests:['วัฒนธรรม'], duration:'ครึ่งวัน', transport:'รถยนต์'};
    if ((name || '').includes('ชิม')) return {...base, interests:['อาหารและคาเฟ่'], duration:'เต็มวัน', transport:'รถยนต์'};
    if ((name || '').includes('ธรรมชาติ')) return {...base, interests:['ธรรมชาติ'], duration:'เต็มวัน', transport:'รถยนต์'};
    return {...base, interests:['หัตถกรรม'], duration:'ครึ่งวัน', transport:'รถยนต์'};
  };
  const beginNewItinerary = () => {
    localStorage.removeItem('tonpao_selected_template');
    sessionStorage.removeItem('tonpao_itinerary_preferences');
    go('/plan/build');
  };

  const style = document.createElement('style');
  style.textContent = `
    .tp-toast{position:fixed;right:24px;bottom:24px;z-index:99999;max-width:380px;padding:14px 18px;border-radius:14px;background:#123f70;color:#fff;font:500 15px/1.45 'Be Vietnam Pro',sans-serif;box-shadow:0 12px 36px rgba(0,40,90,.24);opacity:0;transform:translateY(12px);transition:.2s;pointer-events:none}.tp-toast.show{opacity:1;transform:none}
    .tp-selected{background:#075bbd!important;color:#fff!important;border-color:#075bbd!important}.tp-hidden{display:none!important}
    .tp-save{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:#19723b;color:#fff;border:0;padding:9px 16px;border-radius:9px;font-weight:600}.tp-empty{padding:38px;text-align:center;color:#667085;background:#fff;border:1px dashed #b8c4d4;border-radius:16px;margin:18px 0}
  `;
  document.head.appendChild(style);

  const toast = message => {
    let item = document.querySelector('.tp-toast');
    if (!item) { item = document.createElement('div'); item.className = 'tp-toast'; document.body.appendChild(item); }
    item.textContent = message;
    item.classList.add('show');
    clearTimeout(item._timer);
    item._timer = setTimeout(() => item.classList.remove('show'), 2200);
  };

  const activate = (button, group) => {
    group.forEach(item => item.classList.remove('tp-selected'));
    button.classList.add('tp-selected');
    button.setAttribute('aria-pressed', 'true');
    group.filter(item => item !== button).forEach(item => item.setAttribute('aria-pressed', 'false'));
  };

  const bindSearch = (input, items, route) => {
    if (!input) return;
    input.addEventListener('input', () => {
      const q = clean(input.value).toLowerCase();
      let shown = 0;
      items.forEach(item => { const match = !q || clean(item.textContent).toLowerCase().includes(q); item.classList.toggle('tp-hidden', !match); if (match) shown++; });
      let empty = document.querySelector('.tp-empty');
      if (!shown && q) { if (!empty) { empty = document.createElement('div'); empty.className = 'tp-empty'; empty.textContent = 'ไม่พบข้อมูลที่ตรงกับคำค้น ลองใช้คำอื่นหรือล้างตัวกรอง'; (items[0]?.parentElement || input.parentElement).appendChild(empty); } }
      else empty?.remove();
    });
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      localStorage.setItem('tonpao_query', input.value);
      if (route) go(route); else toast(`ค้นหา “${clean(input.value) || 'ทั้งหมด'}” แล้ว`);
    });
  };

  if (screen === 's02') {
    const search = document.querySelector('input[placeholder*="ค้นหา"]');
    search?.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      localStorage.setItem('tonpao_query', search.value);
      go('/search');
    });
    const categories = buttons().filter(b => /^(ทั้งหมด|หัตถกรรม|วัดและวัฒนธรรม|อาหารและคาเฟ่)$/.test(clean(b.textContent)));
    categories.forEach(button => button.addEventListener('click', () => { activate(button, categories); toast(`แสดงหมวด ${clean(button.textContent)}`); }));
    buttons().filter(b => ['ชั้นข้อมูล','จราจร','กิจกรรม'].includes(b.title)).forEach(button => button.addEventListener('click', () => { button.classList.toggle('tp-selected'); toast(`${button.title}: ${button.classList.contains('tp-selected') ? 'เปิด' : 'ปิด'}`); }));
  }

  if (screen === 's03') {
    const query = localStorage.getItem('tonpao_query');
    const mainSearch = document.querySelector('input[placeholder="ค้นหาสถานที่..."]');
    if (query && mainSearch) mainSearch.value = query;
    const cards = [...document.querySelectorAll('.group.cursor-pointer')].filter(el => el.querySelector('h4'));
    bindSearch(document.querySelector('input[placeholder*="ค้นหาในผลลัพธ์"]') || mainSearch, cards);
    const checks = [...document.querySelectorAll('input[type="checkbox"]')];
    checks.forEach(box => box.addEventListener('change', () => {
      const selected = checks.filter(item => item.checked).map(item => clean(item.closest('label')?.textContent));
      cards.forEach(card => card.classList.toggle('tp-hidden', selected.length > 0 && !selected.some(category => clean(card.textContent).includes(category.split('และ')[0]))));
      toast(`เลือก ${selected.length} หมวดหมู่`);
    }));
    byButton(/ล้างตัวกรองทั้งหมด/)?.addEventListener('click', () => { checks.forEach(box => { box.checked = false; }); cards.forEach(card => card.classList.remove('tp-hidden')); toast('ล้างตัวกรองแล้ว'); });
    document.querySelector('input[type="range"]')?.addEventListener('change', event => toast(`รัศมีการค้นหา ${event.target.value} กม.`));
  }

  if (screen === 's04') {
    const nav = byButton(/นำทาง|เปิดในแผนที่/);
    nav?.addEventListener('click', event => { event.stopImmediatePropagation(); window.open('https://www.google.com/maps/search/?api=1&query=Ton+Pao+Chiang+Mai', '_blank', 'noopener'); });
  }

  if (screen === 's05') {
    const cards = [...document.querySelectorAll('[onclick*="S-06"]')].filter(el => el.querySelector('h3'));
    bindSearch(document.querySelector('input[placeholder*="ค้นหากิจกรรม"]'), cards);
    const filters = buttons().filter(b => /^(ทั้งหมด|กำลังดำเนินอยู่|กำลังจะมาถึง)$/.test(clean(b.textContent)));
    filters.forEach(button => button.addEventListener('click', () => { activate(button, filters); const key = clean(button.textContent); cards.forEach((card, i) => card.classList.toggle('tp-hidden', key !== 'ทั้งหมด' && ((key === 'กำลังดำเนินอยู่' && i > 0) || (key === 'กำลังจะมาถึง' && i === 0)))); toast(`กรองกิจกรรม: ${key}`); }));
  }

  if (screen === 's06' || screen === 's07') {
    const nav = byButton(/นำทาง|เปิดแผนที่/);
    nav?.addEventListener('click', event => { event.stopImmediatePropagation(); window.open('https://www.google.com/maps/search/?api=1&query=Bo+Sang+Umbrella+Festival', '_blank', 'noopener'); });
  }

  if (screen === 's09') {
    const cards = [...document.querySelectorAll('article')];
    const filters = buttons().filter(b => /^(ทั้งหมด|ครึ่งวัน|เต็มวัน|วัฒนธรรม|อาหาร|ธรรมชาติ)/.test(clean(b.textContent)));
    filters.forEach(button => button.addEventListener('click', () => { activate(button, filters); const key = clean(button.textContent).split(' ')[0]; cards.forEach(card => card.classList.toggle('tp-hidden', key !== 'ทั้งหมด' && !clean(card.textContent).includes(key))); toast(`แสดงแผนเที่ยว: ${key}`); }));
    cards.forEach(card => {
      const templateName = clean(card.querySelector('h3')?.textContent);
      card.querySelector('[data-itinerary-action="view"]')?.addEventListener('click', event => {
        event.stopImmediatePropagation();
        localStorage.setItem('tonpao_selected_template', templateName);
        localStorage.setItem('tonpao_draft_trip', JSON.stringify(templateDraft(templateName)));
        go('/plan/result');
      });
      card.querySelector('[data-itinerary-action="use-template"]')?.addEventListener('click', event => {
        event.stopImmediatePropagation();
        localStorage.setItem('tonpao_selected_template', templateName);
        sessionStorage.setItem('tonpao_itinerary_preferences', JSON.stringify(templateDraft(templateName)));
        go('/plan/build');
      });
    });
    document.querySelector('[data-create-itinerary]')?.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      beginNewItinerary();
    }, true);
  }

  if (screen === 's10') {
    const date = document.querySelector('#trip-date');
    const startTime = document.querySelector('#trip-start-time');
    const endTime = document.querySelector('#trip-end-time');
    const customTimeFields = document.querySelector('#custom-time-fields');
    const timeSummary = document.querySelector('#time-summary');
    const interests = [...document.querySelectorAll('[data-interest-group] button')];
    const durations = [...document.querySelectorAll('[data-duration-group] button')];
    const transports = [...document.querySelectorAll('[data-transport-group] button')];
    const startPoint = document.querySelector('#start-point');
    const startPointText = document.querySelector('#start-point-text');
    const startPointDetail = document.querySelector('#start-point-detail');
    const constraints = [...document.querySelectorAll('[data-constraint-group] input[type="checkbox"]')];
    const selectedTemplate = localStorage.getItem('tonpao_selected_template');
    const restored = readJson(sessionStorage, 'tonpao_itinerary_preferences');
    if (date) date.value = restored.date || restored.start || new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0,10);
    if (startTime && restored.startTime) startTime.value = restored.startTime;
    if (endTime && restored.endTime) endTime.value = restored.endTime;
    if (startPoint) {
      const restoredPoint = restored.startPoint || '';
      if (['ตำแหน่งปัจจุบัน','เลือกบนแผนที่'].includes(restoredPoint)) startPoint.value = restoredPoint;
      else if (restoredPoint && !['เทศบาลเมืองต้นเปา','ศูนย์หัตถกรรมร่มบ่อสร้าง','ตลาดต้นเปา'].includes(restoredPoint)) {
        startPoint.value = 'ระบุสถานที่เอง';
        if (startPointText) startPointText.value = restoredPoint;
      } else startPoint.value = '';
    }
    const templateDefaults = selectedTemplate?.includes('ไหว้พระ')
      ? { interests:['วัฒนธรรม'], duration:'ครึ่งวันช่วงเช้า' }
      : selectedTemplate?.includes('ชิม')
        ? { interests:['อาหารและคาเฟ่'], duration:'เต็มวัน' }
        : selectedTemplate?.includes('ธรรมชาติ')
          ? { interests:['ธรรมชาติ'], duration:'เต็มวัน' }
          : { interests:[], duration:'ครึ่งวันช่วงเช้า' };
    const restoredInterests = restored.interests || templateDefaults.interests;
    interests.forEach(button => {
      const selected = restoredInterests.includes(clean(button.textContent));
      button.classList.toggle('tp-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const restoreSingleChoice = (group, value) => {
      const selected = group.find(button => button.dataset.value === value);
      if (selected) activate(selected, group);
      else group.forEach(button => button.setAttribute('aria-pressed', 'false'));
    };
    const restoredDuration = restored.duration === 'ครึ่งวัน' ? 'ครึ่งวันช่วงเช้า' : (restored.duration || templateDefaults.duration);
    restoreSingleChoice(durations, restoredDuration);
    restoreSingleChoice(transports, restored.transport || 'รถยนต์');
    constraints.forEach(input => { input.checked = (restored.constraints || []).includes(input.value); });
    const selectedDuration = () => durations.find(button => button.classList.contains('tp-selected'));
    const resolvedStartPoint = () => startPoint?.value === 'ระบุสถานที่เอง' ? startPointText?.value.trim() : startPoint?.value;
    const updateStartPoint = () => {
      startPointDetail?.classList.toggle('show', startPoint?.value === 'ระบุสถานที่เอง');
      if (startPoint?.value === 'เลือกบนแผนที่') toast('คุณจะเลือกจุดเริ่มต้นบนแผนที่ในขั้นตอนถัดไป');
    };
    const updateTimeControls = () => {
      const selected = selectedDuration();
      const isCustom = selected?.dataset.value === 'กำหนดเอง';
      customTimeFields?.classList.toggle('show', isCustom);
      const from = isCustom ? startTime?.value : selected?.dataset.start;
      const to = isCustom ? endTime?.value : selected?.dataset.end;
      if (timeSummary) timeSummary.innerHTML = `<span class="material-symbols-outlined">schedule</span> เวลา ${from || '--:--'}–${to || '--:--'} น. ระบบจะเผื่อเวลาเดินทาง เวลาพัก และเวลาสำรอง`;
    };
    const saveProgress = () => sessionStorage.setItem('tonpao_itinerary_preferences', JSON.stringify({
      date: date?.value || '',
      start: date?.value || '',
      end: date?.value || '',
      startTime: selectedDuration()?.dataset.value === 'กำหนดเอง' ? startTime?.value : selectedDuration()?.dataset.start,
      endTime: selectedDuration()?.dataset.value === 'กำหนดเอง' ? endTime?.value : selectedDuration()?.dataset.end,
      interests: interests.filter(button => button.classList.contains('tp-selected')).map(button => clean(button.textContent)),
      duration: durations.find(button => button.classList.contains('tp-selected'))?.dataset.value || '',
      transport: transports.find(button => button.classList.contains('tp-selected'))?.dataset.value || '',
      startPoint: resolvedStartPoint() || '',
      constraints: constraints.filter(input => input.checked).map(input => input.value),
      template: selectedTemplate || null
    }));
    const toggleChoice = button => {
      button.classList.toggle('tp-selected');
      button.setAttribute('aria-pressed', String(button.classList.contains('tp-selected')));
      saveProgress();
    };
    interests.forEach(button => button.addEventListener('click', event => { event.stopImmediatePropagation(); toggleChoice(button); }));
    const bindSingleChoice = group => group.forEach(button => button.addEventListener('click', event => { event.stopImmediatePropagation(); activate(button, group); updateTimeControls(); saveProgress(); }));
    bindSingleChoice(durations);
    bindSingleChoice(transports);
    [date, startTime, endTime, startPoint, startPointText, ...constraints].filter(Boolean).forEach(control => control.addEventListener('change', () => { updateTimeControls(); updateStartPoint(); saveProgress(); }));
    updateTimeControls();
    updateStartPoint();
    const generate = document.querySelector('[data-generate-itinerary]');
    generate?.addEventListener('click', event => {
      event.stopImmediatePropagation();
      if (!interests.some(button => button.classList.contains('tp-selected'))) { interests[0]?.focus(); toast('กรุณาเลือกความสนใจอย่างน้อย 1 รายการ'); return; }
      if (!durations.some(button => button.classList.contains('tp-selected'))) { durations[0]?.focus(); toast('กรุณาเลือกระยะเวลาของทริป'); return; }
      if (!date?.value) { date?.focus(); toast('กรุณาเลือกวันที่เดินทาง'); return; }
      if (!transports.some(button => button.classList.contains('tp-selected'))) { transports[0]?.focus(); toast('กรุณาเลือกวิธีเดินทาง'); return; }
      if (!startPoint?.value) { startPoint?.focus(); toast('กรุณาเลือกวิธีกำหนดจุดเริ่มต้น'); return; }
      if (startPoint.value === 'ระบุสถานที่เอง' && !startPointText?.value.trim()) { startPointText?.focus(); toast('กรุณาพิมพ์ชื่อที่พักหรือสถานที่'); return; }
      const durationButton = selectedDuration();
      const from = durationButton?.dataset.value === 'กำหนดเอง' ? startTime?.value : durationButton?.dataset.start;
      const to = durationButton?.dataset.value === 'กำหนดเอง' ? endTime?.value : durationButton?.dataset.end;
      if (!from || !to || to <= from) { startTime?.focus(); toast('กรุณากำหนดเวลาเริ่มต้นและสิ้นสุดให้ถูกต้อง'); return; }
      const selected = interests.filter(b => b.classList.contains('tp-selected')).map(b => clean(b.textContent));
      const draft = {
        name: `ทริป${selected[0] || 'เที่ยว'}ต้นเปา ${durationButton.dataset.value}`,
        date: date.value,
        start: date.value,
        end: date.value,
        startTime: from,
        endTime: to,
        interests: selected,
        duration: clean(durationButton?.dataset.value),
        transport: clean(transports.find(button => button.classList.contains('tp-selected'))?.dataset.value),
        startPoint: resolvedStartPoint(),
        constraints: constraints.filter(input => input.checked).map(input => input.value),
        template: selectedTemplate || null
      };
      sessionStorage.setItem('tonpao_itinerary_preferences', JSON.stringify(draft));
      localStorage.setItem('tonpao_draft_trip', JSON.stringify(draft));
      toast('กำลังจัดแผนการเดินทางที่เหมาะกับคุณ'); setTimeout(() => go('/plan/result'), 450);
    }, true);
  }

  if (screen === 's11') {
    const draft = readJson(localStorage, 'tonpao_draft_trip');
    const poiCatalog = [
      {name:'ศูนย์หัตถกรรมร่มบ่อสร้าง', categories:['หัตถกรรม','วัฒนธรรม','กิจกรรมชุมชน'], minutes:90, distance:2, lat:18.7682, lng:99.1195, indoor:true, accessible:true, family:true, open:true, icon:'palette', description:'ชมกระบวนการทำร่มกระดาษสาและงานเพ้นท์ลวดลายโดยช่างชุมชน'},
      {name:'วัดพระนอนแม่ปูคา', categories:['วัฒนธรรม'], minutes:75, distance:5, lat:18.7924, lng:99.1270, indoor:false, accessible:true, family:true, open:true, icon:'temple_buddhist', description:'สักการะพระนอนและชมสถาปัตยกรรมล้านนาของชุมชน'},
      {name:'ข้าวซอยเฮือนจันทร์', categories:['อาหารและคาเฟ่'], minutes:60, distance:4, lat:18.7734, lng:99.1145, indoor:true, accessible:true, family:true, open:true, icon:'restaurant', description:'พักรับประทานอาหารพื้นเมืองในตำแหน่งที่เชื่อมต่อเส้นทางได้สะดวก'},
      {name:'ชุมชนทำกระดาษสาสันกลาง', categories:['หัตถกรรม','กิจกรรมชุมชน'], minutes:90, distance:6, lat:18.7767, lng:99.1127, indoor:true, accessible:true, family:true, open:true, icon:'auto_stories', description:'เรียนรู้การทำกระดาษสาและเลือกชมผลิตภัณฑ์ของชุมชน'},
      {name:'วัดเชียงแสน', categories:['วัฒนธรรม'], minutes:60, distance:7, lat:18.7298, lng:99.1706, indoor:false, accessible:false, family:true, open:true, icon:'temple_buddhist', description:'เยี่ยมชมวัดเก่าแก่และเรียนรู้เรื่องราวทางวัฒนธรรมในพื้นที่'},
      {name:'คาเฟ่ชุมชนต้นเปา', categories:['อาหารและคาเฟ่','กิจกรรมชุมชน'], minutes:60, distance:3, lat:18.7820, lng:99.1177, indoor:true, accessible:true, family:true, open:true, icon:'local_cafe', description:'แวะพักพร้อมชิมเครื่องดื่มและผลิตภัณฑ์ที่เชื่อมโยงกับชุมชน'},
      {name:'อ่างเก็บน้ำห้วยลาน', categories:['ธรรมชาติ'], minutes:90, distance:12, lat:18.7008, lng:99.2127, indoor:false, accessible:false, family:true, open:true, icon:'landscape', description:'พักผ่อนและชมทิวทัศน์ธรรมชาติในพื้นที่อำเภอสันกำแพง'},
      {name:'ตลาดต้นเปา', categories:['อาหารและคาเฟ่','กิจกรรมชุมชน'], minutes:60, distance:2, lat:18.7696, lng:99.1217, indoor:true, accessible:true, family:true, open:true, icon:'storefront', description:'เลือกซื้ออาหารท้องถิ่นและผลิตภัณฑ์จากชุมชน'}
    ];
    const interestsWanted = draft.interests || [];
    const constraintsWanted = draft.constraints || [];
    const scorePoi = poi => {
      let score = poi.categories.filter(category => interestsWanted.includes(category)).length * 10;
      if (constraintsWanted.includes('เดินทางกับเด็ก') && poi.family) score += 3;
      if (constraintsWanted.includes('มีผู้สูงอายุ') && poi.accessible) score += 4;
      if (constraintsWanted.includes('ต้องการทางเข้าที่สะดวก') && poi.accessible) score += 5;
      if (constraintsWanted.includes('หลีกเลี่ยงกลางแจ้งเมื่อฝนตก')) score += poi.indoor ? 4 : -12;
      if (draft.transport === 'เดินเท้า' && poi.distance > 5) score -= 7;
      if (draft.transport === 'จักรยาน' && poi.distance > 10) score -= 3;
      return score;
    };
    const toMinutes = value => {
      const [hours, minutes] = String(value || '').split(':').map(Number);
      return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
    };
    const travelMinutes = draft.transport === 'เดินเท้า' ? 25 : draft.transport === 'จักรยาน' ? 20 : 15;
    const startClock = toMinutes(draft.startTime) ?? 9 * 60;
    const endClock = toMinutes(draft.endTime) ?? (draft.duration?.startsWith('ครึ่งวัน') ? startClock + 240 : startClock + 480);
    const timeBudget = Math.max(120, endClock - startClock);
    const maxStops = draft.duration?.startsWith('ครึ่งวัน') ? 3 : draft.duration === 'เต็มวัน' ? 5 : 4;
    const savedStops = Array.isArray(draft.stops)
      ? draft.stops.map(name => poiCatalog.find(poi => poi.name === name)).filter(Boolean)
      : [];
    const ranked = poiCatalog
      .filter(poi => poi.open)
      .map(poi => ({...poi, score:scorePoi(poi)}))
      .sort((a,b) => b.score - a.score || a.distance - b.distance);
    const fitToTimeBudget = candidates => {
      const selected = [];
      let used = 20;
      for (const poi of candidates) {
        const required = poi.minutes + (selected.length ? travelMinutes : 0);
        if (selected.length < maxStops && used + required <= timeBudget) { selected.push(poi); used += required; }
      }
      return selected.length ? selected : candidates.slice(0,1);
    };
    const recommendations = savedStops.length ? savedStops : fitToTimeBudget(ranked);
    const reasonFor = poi => {
      const reasons = [];
      const matches = poi.categories.filter(category => interestsWanted.includes(category));
      if (matches.length) reasons.push(`ตรงกับความสนใจด้าน${matches.join('และ')}`);
      if (constraintsWanted.includes('หลีกเลี่ยงกลางแจ้งเมื่อฝนตก') && poi.indoor) reasons.push('เป็นกิจกรรมในร่ม');
      if ((constraintsWanted.includes('มีผู้สูงอายุ') || constraintsWanted.includes('ต้องการทางเข้าที่สะดวก')) && poi.accessible) reasons.push('เข้าถึงได้สะดวก');
      if (draft.transport === 'เดินเท้า' && poi.distance <= 5) reasons.push('อยู่ในระยะที่เหมาะกับการเดิน');
      return reasons.length ? reasons.join(' และ ') : 'ช่วยให้เส้นทางต่อเนื่องและใช้เวลาเดินทางเหมาะสม';
    };
    const formatTime = minutes => `${String(Math.floor(minutes / 60)).padStart(2,'0')}:${String(minutes % 60).padStart(2,'0')}`;
    let clock = startClock;
    const renderRecommendedStop = poi => {
      const start = clock;
      const end = start + poi.minutes;
      clock = end + travelMinutes;
      const stop = document.createElement('div');
      stop.className = 'relative pl-8 mb-xl';
      stop.dataset.itineraryStop = '';
      stop.dataset.stopName = poi.name;
      stop.dataset.lat = String(poi.lat);
      stop.dataset.lng = String(poi.lng);
      stop.innerHTML = `<div class="absolute left-0 top-2 bottom-[-40px] w-[2px] bg-outline-variant"></div><div class="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-primary-container"></div><div class="font-label-md text-label-md text-primary mb-1">${formatTime(start)} - ${formatTime(end)}</div><div class="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-outline-variant/30 hover:shadow-md transition-shadow"><div class="flex items-start gap-sm"><div class="w-11 h-11 shrink-0 rounded-lg bg-primary-fixed flex items-center justify-center text-primary"><span class="material-symbols-outlined">${poi.icon}</span></div><div><h3 class="font-label-md text-label-md text-on-surface mb-xs">${poi.name}</h3><p class="font-body-md text-body-md text-on-surface-variant text-sm">${poi.description}</p></div></div><p class="mt-sm rounded-lg bg-primary-fixed/60 px-sm py-xs text-sm text-on-primary-fixed-variant"><strong>เหตุผลที่แนะนำ:</strong> ${reasonFor(poi)}</p><div class="mt-sm flex justify-end gap-xs" data-stop-actions><button data-move="up" class="p-xs rounded border border-outline-variant" aria-label="เลื่อนสถานที่ขึ้น"><span class="material-symbols-outlined text-[18px]">arrow_upward</span></button><button data-move="down" class="p-xs rounded border border-outline-variant" aria-label="เลื่อนสถานที่ลง"><span class="material-symbols-outlined text-[18px]">arrow_downward</span></button><button data-remove-stop class="p-xs rounded border border-error/40 text-error" aria-label="นำสถานที่ออก"><span class="material-symbols-outlined text-[18px]">delete</span></button></div></div>`;
      return stop;
    };
    const title = document.querySelector('#trip-result-title');
    const context = document.querySelector('#trip-result-context');
    const duration = document.querySelector('#trip-result-duration');
    const distance = document.querySelector('#trip-result-distance');
    const transport = document.querySelector('#trip-result-transport');
    const stopCount = document.querySelector('#trip-result-stop-count');
    if (title && draft.name) title.textContent = draft.name;
    if (duration && draft.duration) duration.textContent = draft.duration;
    if (distance) distance.textContent = `${Math.max(...recommendations.map(poi => poi.distance), 0)} กม. โดยประมาณ`;
    if (transport && draft.transport) transport.textContent = draft.transport;
    if (context) {
      const details = [draft.startPoint || 'ต้นเปา เชียงใหม่', ...(draft.interests || []).slice(0, 2)];
      context.textContent = details.join(' · ');
    }
    const ruleSummary = document.querySelector('#recommendation-rule-summary');
    if (ruleSummary) {
      const rules = [draft.duration || 'ระยะเวลาที่กำหนด', draft.transport || 'รูปแบบการเดินทาง', ...(draft.interests || []), ...(draft.constraints || [])];
      ruleSummary.textContent = savedStops.length
        ? 'แสดงลำดับสถานที่ตามแผนที่คุณบันทึกไว้'
        : `ระบบเลือกเฉพาะสถานที่ที่เปิดให้บริการ แล้วจัดลำดับจาก: ${rules.join(' · ')}`;
    }
    const list = document.querySelector('[data-itinerary-list]');
    const addStopControl = list?.querySelector('[data-add-stop]');
    list?.querySelectorAll('[data-itinerary-stop]').forEach(stop => stop.remove());
    recommendations.forEach(poi => list?.insertBefore(renderRecommendedStop(poi), addStopControl || null));
    localStorage.setItem('tonpao_last_recommendation', JSON.stringify({preferences:draft, stops:recommendations.map(poi => poi.name), generatedAt:new Date().toISOString()}));
    const stops = () => [...document.querySelectorAll('[data-itinerary-stop]')];
    const knownStartPoints = {
      'เทศบาลเมืองต้นเปา':[18.7756,99.1140],
      'ศูนย์หัตถกรรมร่มบ่อสร้าง':[18.7682,99.1195],
      'ตลาดต้นเปา':[18.7696,99.1217]
    };
    const startCoordinates = () => knownStartPoints[draft.startPoint] || (Number.isFinite(draft.startLat) && Number.isFinite(draft.startLng) ? [draft.startLat,draft.startLng] : null);
    const updateStops = () => {
      if (stopCount) stopCount.textContent = `${stops().length} จุดแวะ`;
      stops().forEach((stop, index) => {
        const time = stop.querySelector(':scope > .font-label-md');
        stop.dataset.order = String(index + 1);
        if (time) time.setAttribute('aria-label', `จุดแวะลำดับที่ ${index + 1}`);
      });
      window.TonPaoItineraryMap?.update(stops().map(stop => ({
        name:stop.dataset.stopName,
        lat:Number(stop.dataset.lat),
        lng:Number(stop.dataset.lng)
      })), {
        startName:draft.startPoint,
        startLat:startCoordinates()?.[0],
        startLng:startCoordinates()?.[1],
        returnToStart:constraintsWanted.includes('กลับจุดเริ่มต้น')
      });
    };
    const bindStop = stop => {
      const actions = stop.querySelector('[data-stop-actions]');
      if (actions && !actions.querySelector('[data-view-stop]')) {
        const view = document.createElement('button');
        view.dataset.viewStop = '';
        view.className = 'mr-auto px-sm py-xs rounded border border-primary text-primary font-label-sm';
        view.textContent = 'ดูบนแผนที่';
        view.addEventListener('click', event => { event.stopImmediatePropagation(); window.TonPaoItineraryMap?.focus(stop.dataset.stopName); }, true);
        actions.prepend(view);
      }
      stop.querySelector('[data-move="up"]')?.addEventListener('click', event => {
        event.stopImmediatePropagation();
        if (stop.previousElementSibling?.matches('[data-itinerary-stop]')) list.insertBefore(stop, stop.previousElementSibling);
        updateStops();
      }, true);
      stop.querySelector('[data-move="down"]')?.addEventListener('click', event => {
        event.stopImmediatePropagation();
        const next = stop.nextElementSibling;
        if (next?.matches('[data-itinerary-stop]')) list.insertBefore(next, stop);
        updateStops();
      }, true);
      stop.querySelector('[data-remove-stop]')?.addEventListener('click', event => {
        event.stopImmediatePropagation();
        if (stops().length <= 1) { toast('แผนการเดินทางต้องมีอย่างน้อย 1 สถานที่'); return; }
        stop.remove(); updateStops(); toast('นำสถานที่ออกจากแผนแล้ว');
      }, true);
    };
    stops().forEach(bindStop);
    updateStops();
    document.querySelector('[data-add-stop]')?.addEventListener('click', event => {
      event.stopImmediatePropagation();
      const sample = stops()[0]?.cloneNode(true);
      if (!sample) return;
      sample.dataset.stopName = 'ตลาดต้นเปา';
      const market = poiCatalog.find(poi => poi.name === 'ตลาดต้นเปา');
      sample.dataset.lat = String(market.lat);
      sample.dataset.lng = String(market.lng);
      const heading = sample.querySelector('h3'); if (heading) heading.textContent = 'ตลาดต้นเปา';
      const description = sample.querySelector('h3 + p'); if (description) description.textContent = 'แวะเลือกซื้ออาหารท้องถิ่นและผลิตภัณฑ์จากชุมชน';
      const reason = sample.querySelector('p strong')?.parentElement; if (reason) reason.innerHTML = '<strong>เหตุผลที่แนะนำ:</strong> อยู่ใกล้เส้นทางเดิมและเพิ่มจุดพักระหว่างการเดินทาง';
      sample.querySelectorAll('[data-view-stop]').forEach(button => button.remove());
      list.insertBefore(sample, event.currentTarget);
      bindStop(sample); updateStops(); toast('เพิ่มตลาดต้นเปาในแผนแล้ว');
    }, true);
    const setStartPoint = point => {
      draft.startPoint = point.name;
      draft.startLat = point.lat;
      draft.startLng = point.lng;
      localStorage.setItem('tonpao_draft_trip', JSON.stringify(draft));
      sessionStorage.setItem('tonpao_itinerary_preferences', JSON.stringify(draft));
      if (context) context.textContent = [draft.startPoint, ...(draft.interests || []).slice(0,2)].join(' · ');
      updateStops();
      toast('กำหนดจุดเริ่มต้นและคำนวณเส้นทางใหม่แล้ว');
    };
    if (draft.startPoint === 'เลือกบนแผนที่') window.TonPaoItineraryMap?.selectStart(setStartPoint);
    if (draft.startPoint === 'ตำแหน่งปัจจุบัน') {
      window.TonPaoItineraryMap?.selectStart(setStartPoint);
      window.TonPaoItineraryMap?.locate();
    }
    document.querySelector('[data-map-locate]')?.addEventListener('click', event => {
      event.stopImmediatePropagation();
      window.TonPaoItineraryMap?.selectStart(setStartPoint);
      window.TonPaoItineraryMap?.locate();
    }, true);
    document.addEventListener('tonpao:map-stop-selected', event => {
      const stop = stops().find(item => item.dataset.stopName === event.detail?.name);
      if (!stop) return;
      stop.scrollIntoView({ behavior:'smooth', block:'center' });
      stop.classList.add('ring-2','ring-primary','rounded-xl');
      setTimeout(() => stop.classList.remove('ring-2','ring-primary','rounded-xl'), 1400);
    });
    document.querySelector('[data-edit-itinerary]')?.addEventListener('click', event => { event.stopImmediatePropagation(); go('/plan/build'); }, true);
    document.querySelector('[data-save-itinerary]')?.addEventListener('click', event => {
      event.stopImmediatePropagation();
      const trips = readJson(localStorage, 'tonpao_saved_trips', []);
      trips.unshift({...draft, name:draft.name || title?.textContent || 'เที่ยวต้นเปา 1 วัน', stops:stops().map(stop => stop.dataset.stopName), savedAt:new Date().toISOString()});
      localStorage.setItem('tonpao_saved_trips', JSON.stringify(trips.slice(0,10)));
      toast('บันทึกไว้ในแผนของฉันแล้ว');
    }, true);
    document.querySelector('[data-share-itinerary]')?.addEventListener('click', async event => {
      event.stopImmediatePropagation();
      const shareData = {title:title?.textContent || 'แผนเที่ยว TonPao Map', text:'แผนการเดินทางในต้นเปา', url:window.parent.location.href};
      try {
        if (navigator.share) await navigator.share(shareData);
        else { await navigator.clipboard.writeText(shareData.url); toast('คัดลอกลิงก์แผนการเดินทางแล้ว'); }
      } catch (error) { if (error?.name !== 'AbortError') toast('ยังไม่สามารถแชร์ลิงก์ได้'); }
    }, true);
    document.querySelector('[data-export-itinerary]')?.addEventListener('click', event => { event.stopImmediatePropagation(); toast('เปิดหน้าต่างพิมพ์เพื่อบันทึกเป็น PDF'); setTimeout(() => window.print(), 350); }, true);
  }

  if (screen === 's42') {
    const input = document.querySelector('input[placeholder*="ค้นหาทริปของคุณ"]');
    const cards = [...document.querySelectorAll('article')];
    bindSearch(input, cards);
    buttons().filter(button => /สร้างทริปใหม่|เริ่มวางแผน/.test(clean(button.textContent))).forEach(create => {
      create.addEventListener('click', event => { event.stopImmediatePropagation(); beginNewItinerary(); }, true);
    });
    const saved = readJson(localStorage, 'tonpao_saved_trips', []);
    if (saved.length && cards[0]?.parentElement) {
      const latest = saved[0];
      const notice = document.createElement('button');
      notice.className = 'col-span-full text-left bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-green-900 hover:bg-green-100';
      const title = document.createElement('strong'); title.textContent = 'แผนที่บันทึกล่าสุด: ';
      const name = document.createTextNode(latest.name || 'เที่ยวต้นเปา 1 วัน');
      const open = document.createElement('span'); open.style.cssText = 'float:right;color:#075bbd'; open.textContent = 'เปิดแผน →';
      notice.append(title, name, open);
      notice.addEventListener('click', () => {
        localStorage.setItem('tonpao_draft_trip', JSON.stringify(latest));
        sessionStorage.setItem('tonpao_itinerary_preferences', JSON.stringify(latest));
        go('/plan/result');
      });
      cards[0].parentElement.prepend(notice);
    }
  }
})();
