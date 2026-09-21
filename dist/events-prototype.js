(() => {
  const mapNode = document.getElementById('eventMap');
  if (!mapNode || !window.L) return;

  const events = [
    {
      id: 'umbrella-festival', name: 'เทศกาลร่มบ่อสร้างและหัตถกรรมสันกำแพง',
      status: 'ongoing', period: 'today', date: '16–20 กันยายน 2569', time: '09:00–21:00 น.',
      venue: 'ศูนย์อุตสาหกรรมทำร่มบ่อสร้าง', distance: '1.2 กม.', lat: 18.7682, lng: 99.1195,
      type: 'เทศกาลและหัตถกรรม', description: 'ชมการสาธิตร่มกระดาษสา เลือกซื้อผลิตภัณฑ์ชุมชน และร่วมกิจกรรมเชิงสร้างสรรค์',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBztzVOxpzy8_yHgs3_QD6qplZInQo_2_NUivuMjajY7bf5srAJl9P_DBSMaWPFbps7_i70K_dq_41EvaQLV3wTj_0trhFVowfVxAKQWu9Om9QIcOXPLDVmSRoTerKqmTW1cpIxwltdGq7xKXcopQkl8-IQuumeJkTxsz--wrkBBR93v1gCiYUXNQwXZ5g0Q6nFJnqXB6JAAphCzbzWAitc5LgzC9CH3jvANg4HCHn8iF97-6YAPmeT'
    },
    {
      id: 'walking-street', name: 'ถนนคนเดินวิถีชุมชนต้นเปา',
      status: 'upcoming', period: 'weekend', date: '19–20 กันยายน 2569', time: '16:00–21:00 น.',
      venue: 'ลานอเนกประสงค์เทศบาลเมืองต้นเปา', distance: '3.5 กม.', lat: 18.7772, lng: 99.1154,
      type: 'ตลาดชุมชน', description: 'พบอาหารพื้นถิ่น งานทำมือ ดนตรีชุมชน และสินค้าจากผู้ประกอบการในพื้นที่',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyf5BUQPvxNSoVSRO3G0PMy6ipf1lJEMFK2lfhmXMzBzDmEu8C6OvKO4JRo6E-chg1m5hwDcO563NUrC89jdp2qqZem5fDXO-Uo-jp9qOLzb_zmYVuUU0JU18XXkiIYTmNaHOWZnUyMPHLhgnZuvAZLsJzh3k1d7mFZ8sGxLJHqOgFwfu3dU4T0_C493NiwIiLNmZghCDVWObNaI7p7ovM2cNKTlFlWBTafDLg1cw9UH0gERAX0bh4'
    },
    {
      id: 'sa-paper-workshop', name: 'เวิร์กชอปทำกระดาษสาและของที่ระลึก',
      status: 'upcoming', period: 'month', date: '26 กันยายน 2569', time: '10:00–15:30 น.',
      venue: 'ศูนย์เรียนรู้กระดาษสาบ้านต้นเปา', distance: '900 ม.', lat: 18.7767, lng: 99.1127,
      type: 'เวิร์กชอป', description: 'ทดลองทำกระดาษสาและออกแบบของที่ระลึกด้วยตนเอง เหมาะสำหรับครอบครัวและกลุ่มเรียนรู้', image: ''
    }
  ];

  const map = L.map(mapNode, { zoomControl: false }).setView([18.7744, 99.1165], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const markerLayer = L.layerGroup().addTo(map);
  const markers = new Map();
  let statusFilter = 'all';
  let dateFilter = 'all';
  let searchTerm = '';
  let selectedId = events[0].id;

  const statusMeta = status => status === 'ongoing'
    ? { label: 'กำลังดำเนินอยู่', color: '#08783f', icon: '★' }
    : { label: 'กำลังจะมาถึง', color: '#0059bb', icon: '●' };

  const cardHtml = event => {
    const meta = statusMeta(event.status);
    const image = event.image
      ? `<img src="${event.image}" alt="${event.name}" class="w-[220px] min-h-[210px] object-cover">`
      : `<div class="w-[220px] min-h-[210px] bg-gradient-to-br from-[#dce8ff] to-[#f7e8c7] grid place-items-center"><span class="material-symbols-outlined text-primary text-[58px]">palette</span></div>`;
    return `<article data-event-id="${event.id}" class="event-card ${event.id === selectedId ? 'is-selected' : ''} bg-white rounded-2xl border border-line overflow-hidden shadow-sm transition-all">
      <div class="flex">${image}<div class="p-5 flex-1 min-w-0">
        <div class="flex items-start justify-between gap-3"><span class="rounded-full px-3 py-1 text-xs font-semibold" style="background:${meta.color}15;color:${meta.color}">${meta.label}</span><span class="text-xs font-semibold text-muted bg-soft px-2.5 py-1 rounded-lg">${event.distance}</span></div>
        <p class="text-xs text-primary font-semibold mt-3">${event.type}</p><h3 class="font-headline text-xl font-bold mt-1 leading-7">${event.name}</h3>
        <p class="text-sm text-muted mt-2 line-clamp-2">${event.description}</p>
        <div class="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-sm"><p class="flex gap-2"><span class="material-symbols-outlined text-primary text-[19px]">calendar_today</span>${event.date}</p><p class="flex gap-2"><span class="material-symbols-outlined text-primary text-[19px]">schedule</span>${event.time}</p><p class="col-span-2 flex gap-2 text-muted"><span class="material-symbols-outlined text-primary text-[19px]">location_on</span>${event.venue}</p></div>
        <div class="grid grid-cols-2 gap-3 mt-4"><button data-event-select="${event.id}" class="rounded-xl border border-primary/20 py-2.5 text-primary font-semibold text-sm hover:bg-soft">ดูบนแผนที่</button><a href="/#/events/umbrella-festival" class="rounded-xl bg-primary py-2.5 text-center text-white font-semibold text-sm hover:bg-primary2">ดูรายละเอียด</a></div>
      </div></div></article>`;
  };

  function visibleEvents() {
    return events.filter(event => {
      const statusMatch = statusFilter === 'all' || event.status === statusFilter;
      const dateMatch = dateFilter === 'all' || event.period === dateFilter || (dateFilter === 'month' && ['today','weekend','month'].includes(event.period));
      const text = `${event.name} ${event.venue} ${event.type} ${event.description}`.toLowerCase();
      return statusMatch && dateMatch && text.includes(searchTerm);
    });
  }

  function selectEvent(id, scroll = false) {
    const event = events.find(item => item.id === id); if (!event) return;
    selectedId = id;
    document.querySelectorAll('.event-card').forEach(card => card.classList.toggle('is-selected', card.dataset.eventId === id));
    map.setView([event.lat, event.lng], 16, { animate: true });
    markers.get(id)?.openPopup();
    if (scroll) document.querySelector(`[data-event-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function render() {
    const visible = visibleEvents();
    const list = document.getElementById('eventList');
    list.innerHTML = visible.length ? visible.map(cardHtml).join('') : '<div class="rounded-2xl border border-line bg-white p-10 text-center"><span class="material-symbols-outlined text-primary text-[44px]">event_busy</span><h3 class="font-bold text-lg mt-2">ไม่พบกิจกรรม</h3><p class="text-sm text-muted mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกช่วงวันอื่น</p></div>';
    document.getElementById('eventCount').textContent = visible.length;
    document.getElementById('eventResultSummary').textContent = `พบ ${visible.length} กิจกรรม · ข้อมูลตัวอย่าง`;
    markerLayer.clearLayers(); markers.clear();
    visible.forEach(event => {
      const meta = statusMeta(event.status);
      const icon = L.divIcon({ className: 'event-marker', html: `<span style="background:${meta.color}">${meta.icon}</span>`, iconSize: [38,38], iconAnchor: [19,19], popupAnchor: [0,-20] });
      const marker = L.marker([event.lat,event.lng], { icon, title: event.name })
        .bindPopup(`<div class="map-popup"><h3>${event.name}</h3><p>${meta.label}<br>${event.date} · ${event.time}<br>${event.venue}</p><a href="/#/events/umbrella-festival">ดูรายละเอียดกิจกรรม →</a></div>`)
        .on('click', () => selectEvent(event.id, true)).addTo(markerLayer);
      markers.set(event.id, marker);
    });
    if (visible.length) {
      if (!visible.some(event => event.id === selectedId)) selectedId = visible[0].id;
      const bounds = L.latLngBounds(visible.map(event => [event.lat,event.lng]));
      map.fitBounds(bounds, { padding: [45,45], maxZoom: 15 });
    }
  }

  document.querySelectorAll('[data-event-filter]').forEach(button => button.addEventListener('click', () => {
    statusFilter = button.dataset.eventFilter;
    document.querySelectorAll('[data-event-filter]').forEach(item => item.classList.toggle('is-active', item === button)); render();
  }));
  document.querySelectorAll('[data-event-date]').forEach(button => button.addEventListener('click', () => {
    dateFilter = button.dataset.eventDate;
    document.querySelectorAll('[data-event-date]').forEach(item => item.classList.toggle('is-active', item === button)); render();
  }));
  document.getElementById('eventSearch').addEventListener('input', event => { searchTerm = event.target.value.trim().toLowerCase(); render(); });
  document.getElementById('eventList').addEventListener('click', event => { const button = event.target.closest('[data-event-select]'); if (button) selectEvent(button.dataset.eventSelect); });
  document.getElementById('showAllEvents').addEventListener('click', () => {
    statusFilter = dateFilter = 'all'; searchTerm = ''; document.getElementById('eventSearch').value = '';
    document.querySelectorAll('[data-event-filter],[data-event-date]').forEach(button => button.classList.toggle('is-active', button.dataset.eventFilter === 'all' || button.dataset.eventDate === 'all')); render();
  });
  document.getElementById('openEventsOnMap').addEventListener('click', () => {
    sessionStorage.setItem('tonpao-map-focus-layer','event'); window.parent.location.hash = '/map';
  });
  render(); setTimeout(() => map.invalidateSize(), 150);
})();
