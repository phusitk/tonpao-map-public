(() => {
  const mapNode = document.getElementById('tonpaoMap');
  if (!mapNode || !window.L) return;

  const categories = {
    handicraft: { label: 'หัตถกรรม', color: '#007a3d', icon: '☂' },
    temple: { label: 'วัดและวัฒนธรรม', color: '#8b4c00', icon: '⌂' },
    food: { label: 'อาหารและคาเฟ่', color: '#c2410c', icon: '☕' },
    community: { label: 'แหล่งเรียนรู้ชุมชน', color: '#0062c7', icon: '●' },
    accommodation: { label: 'ที่พัก', color: '#6d28d9', icon: '◆' }
  };

  const pois = [
    { id: 'umbrella-center', name: 'ศูนย์อุตสาหกรรมทำร่มบ่อสร้าง', category: 'handicraft', lat: 18.7682, lng: 99.1195, rating: 4.8, open: 'เปิดถึง 17:00 น.', distance: '1.8 กม.', description: 'ชมขั้นตอนทำร่มกระดาษสาและเลือกซื้อผลิตภัณฑ์ชุมชน' },
    { id: 'sa-paper', name: 'ศูนย์เรียนรู้กระดาษสาบ้านต้นเปา', category: 'handicraft', lat: 18.7767, lng: 99.1127, rating: 4.7, open: 'เปิดถึง 16:30 น.', distance: '900 ม.', description: 'เรียนรู้การทำกระดาษสาและงานหัตถกรรมจากภูมิปัญญาท้องถิ่น' },
    { id: 'handicraft-village', name: 'หมู่บ้านหัตถกรรมบ่อสร้าง', category: 'handicraft', lat: 18.7701, lng: 99.1221, rating: 4.6, open: 'เปิดอยู่', distance: '2.1 กม.', description: 'ย่านร้านค้าหัตถกรรม ร่ม พัด และของที่ระลึกจากชุมชน' },
    { id: 'wat-tonpao', name: 'วัดต้นเปา', category: 'temple', lat: 18.7791, lng: 99.1099, rating: 4.9, open: 'เปิดถึง 18:00 น.', distance: '800 ม.', description: 'วัดเก่าแก่และศูนย์รวมจิตใจของชาวต้นเปาในบรรยากาศล้านนา' },
    { id: 'wat-borsang', name: 'วัดบ่อสร้าง', category: 'temple', lat: 18.7668, lng: 99.1212, rating: 4.6, open: 'เปิดอยู่', distance: '2.2 กม.', description: 'วัดชุมชนใกล้แหล่งหัตถกรรมร่มบ่อสร้าง' },
    { id: 'wat-maepuka', name: 'วัดพระนอนแม่ปูคา', category: 'temple', lat: 18.7924, lng: 99.1270, rating: 4.7, open: 'เปิดถึง 17:30 น.', distance: '3.7 กม.', description: 'แหล่งศรัทธาและสถาปัตยกรรมทางศาสนาใกล้ต้นเปา' },
    { id: 'local-kitchen', name: 'ครัวต้นเปาพื้นเมือง', category: 'food', lat: 18.7734, lng: 99.1145, rating: 4.5, open: 'เปิดถึง 20:00 น.', distance: '650 ม.', description: 'อาหารเหนือและเมนูพื้นบ้าน เหมาะสำหรับแวะพักระหว่างเที่ยว' },
    { id: 'tonpao-cafe', name: 'เสน่ห์คาเฟ่ ต้นเปา', category: 'food', lat: 18.7820, lng: 99.1177, rating: 4.6, open: 'เปิดถึง 18:00 น.', distance: '1.5 กม.', description: 'เครื่องดื่มและของว่างในบรรยากาศชุมชนต้นเปา' },
    { id: 'community-center', name: 'ศูนย์เรียนรู้ชุมชนต้นเปา', category: 'community', lat: 18.7760, lng: 99.1160, rating: 4.7, open: 'กรุณานัดหมาย', distance: '1.1 กม.', description: 'เรื่องราวชุมชน ภูมิปัญญาท้องถิ่น และกิจกรรมเรียนรู้' },
    { id: 'homestay', name: 'ต้นเปาโฮมสเตย์', category: 'accommodation', lat: 18.7834, lng: 99.1222, rating: 4.5, open: 'มีห้องว่างตัวอย่าง', distance: '2.0 กม.', description: 'ที่พักชุมชนสำหรับผู้ที่ต้องการสัมผัสวิถีชีวิตท้องถิ่น' }
  ];

  const map = L.map(mapNode, { zoomControl: false, attributionControl: true }).setView([18.7758, 99.1167], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const markerLayer = L.layerGroup().addTo(map);
  let currentCategory = 'all';
  let searchTerm = '';
  let userLocationLayer = null;

  const markerIcon = poi => {
    const category = categories[poi.category];
    return L.divIcon({
      className: 'poi-map-marker',
      html: `<span style="background:${category.color}" aria-hidden="true">${category.icon}</span>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18]
    });
  };

  const popupHtml = poi => `<div class="poi-popup"><h3>${poi.name}</h3><p>${categories[poi.category].label} · ★ ${poi.rating}<br>${poi.open} · ${poi.distance}<br>${poi.description}</p><a href="/#/poi/umbrella-center">ดูหน้ารายละเอียดตัวอย่าง →</a></div>`;

  const poiCard = poi => `
    <article class="bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-outline-variant/20 transition-all">
      <div class="p-md">
        <div class="flex justify-between items-start gap-2 mb-2">
          <span class="text-label-sm px-2 py-1 rounded-full" style="color:${categories[poi.category].color};background:${categories[poi.category].color}14">${categories[poi.category].label}</span>
          <span class="text-label-sm text-on-surface-variant">★ ${poi.rating}</span>
        </div>
        <h3 class="font-bold text-[16px] leading-6 mb-1">${poi.name}</h3>
        <p class="text-label-sm text-on-surface-variant mb-2">${poi.open} · ${poi.distance}</p>
        <p class="text-label-sm text-on-surface-variant line-clamp-2 mb-md">${poi.description}</p>
        <div class="grid grid-cols-2 gap-2">
          <button data-map-control data-focus-poi="${poi.id}" class="py-2 text-primary border border-primary/20 rounded-xl font-label-md hover:bg-primary/5">ดูบนแผนที่</button>
          <a class="py-2 bg-primary text-white rounded-xl font-label-md text-center" href="/#/poi/umbrella-center">รายละเอียด</a>
        </div>
      </div>
    </article>`;

  function filteredPois() {
    return pois.filter(poi => {
      const matchesCategory = currentCategory === 'all' || poi.category === currentCategory;
      const haystack = `${poi.name} ${categories[poi.category].label} ${poi.description}`.toLowerCase();
      return matchesCategory && haystack.includes(searchTerm);
    });
  }

  function render({ fit = true } = {}) {
    const visible = filteredPois();
    markerLayer.clearLayers();
    visible.forEach(poi => {
      L.marker([poi.lat, poi.lng], { icon: markerIcon(poi), title: poi.name })
        .bindPopup(popupHtml(poi), { maxWidth: 280 })
        .addTo(markerLayer);
    });

    const list = document.getElementById('poiList');
    const summary = document.getElementById('poiResultSummary');
    summary.textContent = visible.length ? `พบ ${visible.length} สถานที่ · ข้อมูล POI ตัวอย่าง` : 'ไม่พบสถานที่ที่ตรงกับการค้นหา';
    list.innerHTML = visible.length ? visible.map(poiCard).join('') : '<div class="rounded-2xl bg-white p-6 text-center text-on-surface-variant">ลองเปลี่ยนคำค้นหาหรือเลือก “ทั้งหมด”</div>';

    if (fit && visible.length) {
      const bounds = L.latLngBounds(visible.map(poi => [poi.lat, poi.lng]));
      map.fitBounds(bounds, { paddingTopLeft: [90, 120], paddingBottomRight: [90, 170], maxZoom: 15 });
    }
  }

  document.querySelectorAll('[data-map-filter]').forEach(button => {
    button.addEventListener('click', () => {
      currentCategory = button.dataset.mapFilter;
      document.querySelectorAll('[data-map-filter]').forEach(item => item.classList.toggle('is-active', item === button));
      render();
    });
  });

  document.getElementById('poiSearch').addEventListener('input', event => {
    searchTerm = event.target.value.trim().toLowerCase();
    render();
  });

  document.getElementById('poiList').addEventListener('click', event => {
    const button = event.target.closest('[data-focus-poi]');
    if (!button) return;
    const poi = pois.find(item => item.id === button.dataset.focusPoi);
    if (!poi) return;
    map.setView([poi.lat, poi.lng], 17);
    markerLayer.eachLayer(layer => {
      if (layer.getLatLng().lat === poi.lat && layer.getLatLng().lng === poi.lng) layer.openPopup();
    });
  });

  const panel = document.getElementById('poiPanel');
  const mapView = document.getElementById('mapViewButton');
  const listView = document.getElementById('listViewButton');
  function setListMode(listMode) {
    panel.style.width = listMode ? '520px' : '360px';
    [mapView, listView].forEach((button, index) => {
      const active = listMode ? index === 1 : index === 0;
      button.classList.toggle('bg-white', active);
      button.classList.toggle('shadow-sm', active);
      button.classList.toggle('text-primary', active);
    });
    setTimeout(() => map.invalidateSize(), 320);
  }
  mapView.addEventListener('click', () => setListMode(false));
  listView.addEventListener('click', () => setListMode(true));

  const layers = {
    rain: L.layerGroup([
      L.circle([18.784, 99.108], { radius: 1800, color: '#2563eb', weight: 2, fillColor: '#60a5fa', fillOpacity: .15 }).bindPopup('พื้นที่ฝนตัวอย่าง · มีโอกาสฝน 40% ช่วง 15:00–17:00 น.')
    ]),
    traffic: L.layerGroup([
      L.polyline([[18.760, 99.098], [18.769, 99.108], [18.776, 99.121], [18.785, 99.133]], { color: '#ef4444', weight: 7, opacity: .7 }).bindPopup('การจราจรชะลอตัว · ข้อมูลตัวอย่าง')
    ]),
    parking: L.layerGroup([
      L.marker([18.7688, 99.1186], { icon: L.divIcon({ className: 'poi-map-marker', html: '<span style="background:#2563eb">P</span>', iconSize: [34,34] }) }).bindPopup('จุดจอดรถบ่อสร้าง · ว่าง 18 คัน (ข้อมูลตัวอย่าง)'),
      L.marker([18.7784, 99.1108], { icon: L.divIcon({ className: 'poi-map-marker', html: '<span style="background:#2563eb">P</span>', iconSize: [34,34] }) }).bindPopup('จุดจอดรถวัดต้นเปา · ว่าง 9 คัน (ข้อมูลตัวอย่าง)')
    ]),
    aqi: L.layerGroup([
      L.circleMarker([18.776, 99.116], { radius: 24, color: '#059669', fillColor: '#34d399', fillOpacity: .7 }).bindPopup('AQI 54 · ระดับปานกลาง (ข้อมูลตัวอย่าง)')
    ]),
    event: L.layerGroup([
      L.marker([18.7696, 99.1204], { icon: L.divIcon({ className: 'poi-map-marker', html: '<span style="background:#9333ea">★</span>', iconSize: [34,34] }) }).bindPopup('พื้นที่จัดกิจกรรมชุมชน · โปรดตรวจสอบวันและเวลา (ข้อมูลตัวอย่าง)')
    ])
  };

  document.querySelectorAll('[data-map-layer]').forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.mapLayer;
      const layer = layers[name];
      if (!layer) return;
      const turnOn = !map.hasLayer(layer);
      if (turnOn) layer.addTo(map); else map.removeLayer(layer);
      document.querySelectorAll(`[data-map-layer="${name}"]`).forEach(item => item.classList.toggle('is-active', turnOn));
    });
  });

  const layerToggle = document.getElementById('mapLayersToggle');
  layerToggle.addEventListener('click', () => {
    const layerPanel = document.getElementById('mapLayerPanel');
    layerPanel.classList.toggle('hidden');
    layerToggle.setAttribute('aria-expanded', String(!layerPanel.classList.contains('hidden')));
  });

  document.getElementById('mapZoomIn').addEventListener('click', () => map.zoomIn());
  document.getElementById('mapZoomOut').addEventListener('click', () => map.zoomOut());
  document.getElementById('mapLocate').addEventListener('click', () => map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true }));
  map.on('locationfound', event => {
    if (userLocationLayer) map.removeLayer(userLocationLayer);
    userLocationLayer = L.layerGroup([
      L.circle(event.latlng, { radius: event.accuracy, color: '#0059bb', fillOpacity: .08 }),
      L.circleMarker(event.latlng, { radius: 8, color: '#fff', weight: 3, fillColor: '#0059bb', fillOpacity: 1 }).bindPopup('ตำแหน่งโดยประมาณของคุณ').openPopup()
    ]).addTo(map);
  });
  map.on('locationerror', () => window.alert('ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาอนุญาตการใช้ตำแหน่งในเบราว์เซอร์'));

  render();
  if (sessionStorage.getItem('tonpao-map-focus-layer') === 'event') {
    sessionStorage.removeItem('tonpao-map-focus-layer');
    layers.event.addTo(map);
    document.querySelectorAll('[data-map-layer="event"]').forEach(item => item.classList.add('is-active'));
    map.setView([18.7696, 99.1204], 16);
  }
  setTimeout(() => map.invalidateSize(), 200);
})();
