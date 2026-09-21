(() => {
  const host = document.getElementById('parkingMapHost');
  if (!host || !window.L) return;

  const parking = [
    { id:'p1', code:'P1', name:'ลานเทศบาล', lat:18.7688, lng:99.1186, walk:'500 ม. · เดินประมาณ 5 นาที', vehicles:'รถยนต์และรถจักรยานยนต์', hours:'08:00–22:00 น.', fee:'จอดฟรี', note:'มีจุดรับ–ส่งและทางเดินพื้นราบ' },
    { id:'p2', code:'P2', name:'ลานวัดพระนอน', lat:18.7668, lng:99.1212, walk:'800 ม. · เดินประมาณ 10 นาที', vehicles:'รถยนต์และรถจักรยานยนต์', hours:'08:00–22:00 น.', fee:'จอดฟรี', note:'กรุณาจอดตามพื้นที่ที่วัดกำหนด' },
    { id:'p3', code:'P3', name:'ลานโรงเรียน', lat:18.7629, lng:99.1240, walk:'1.2 กม. · มีรถรับ–ส่ง', vehicles:'รถยนต์และรถบัส', hours:'08:00–22:30 น.', fee:'ตามประกาศผู้จัดงาน', note:'มีรถรับ–ส่งไปยังพื้นที่จัดงาน' }
  ];
  const eventPoint = { lat:18.7682, lng:99.1195 };

  host.innerHTML = `<div id="parkingMapCanvas" aria-label="แผนที่จุดจอดรถสำหรับงานเทศกาล"></div>
    <div class="absolute bottom-4 left-4 z-[500] max-w-[390px] rounded-xl border border-white/40 bg-white/95 p-4 shadow-lg backdrop-blur flex gap-3">
      <span class="material-symbols-outlined text-[#8b4c00]">warning</span><div><p class="font-semibold text-sm">ข้อควรระวัง</p><p class="text-xs text-on-surface-variant mt-1">ลานกลางแจ้งอาจมีดินโคลนหลังฝนตก โปรดตรวจสภาพพื้นที่ก่อนเข้าจอด</p></div>
    </div>
    <div class="absolute top-4 right-4 z-[500] flex flex-col gap-2">
      <button id="parkingLocate" data-parking-control class="w-11 h-11 rounded-full bg-white text-primary shadow-lg" aria-label="แสดงตำแหน่งของฉัน"><span class="material-symbols-outlined">my_location</span></button>
      <button id="parkingFitAll" data-parking-control class="w-11 h-11 rounded-full bg-white text-primary shadow-lg" aria-label="แสดงทุกจุด"><span class="material-symbols-outlined">zoom_out_map</span></button>
    </div>`;

  const map = L.map('parkingMapCanvas', { zoomControl:false }).setView([18.7670,99.1203],15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, attribution:'&copy; OpenStreetMap contributors' }).addTo(map);
  L.control.zoom({ position:'bottomright' }).addTo(map);

  const parkingIcon = code => L.divIcon({ className:'parking-map-marker', html:`<span>${code}</span>`, iconSize:[38,38], iconAnchor:[19,19], popupAnchor:[0,-20] });
  const eventIcon = L.divIcon({ className:'parking-map-marker event-map-marker', html:'<span>งาน</span>', iconSize:[42,42], iconAnchor:[21,21], popupAnchor:[0,-22] });
  const markerById = new Map();
  const bounds = L.latLngBounds([[eventPoint.lat,eventPoint.lng], ...parking.map(item => [item.lat,item.lng])]);

  function googleUrl(item) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${item.lat},${item.lng}`)}&travelmode=driving&dir_action=navigate`;
  }
  function popup(item) {
    return `<div class="parking-popup"><h3>${item.code} ${item.name}</h3><p>${item.walk}<br>${item.vehicles}<br>${item.fee} · ${item.hours}<br>${item.note}</p><a href="${googleUrl(item)}" target="_blank" rel="noopener noreferrer">นำทางด้วย Google Maps →</a></div>`;
  }
  function selectParking(id, openPopup=true) {
    const item = parking.find(point => point.id === id); if (!item) return;
    document.querySelectorAll('[data-parking-card]').forEach(card => card.classList.toggle('parking-card-selected', card.dataset.parkingCard === id));
    map.setView([item.lat,item.lng],17,{animate:true});
    if (openPopup) markerById.get(id)?.openPopup();
  }

  parking.forEach(item => {
    const marker = L.marker([item.lat,item.lng], { icon:parkingIcon(item.code), title:`${item.code} ${item.name}` }).bindPopup(popup(item),{maxWidth:290}).on('click',()=>selectParking(item.id,false)).addTo(map);
    markerById.set(item.id,marker);
  });
  L.marker([eventPoint.lat,eventPoint.lng], { icon:eventIcon, title:'พื้นที่จัดงาน' }).bindPopup('<div class="parking-popup"><h3>พื้นที่จัดงานเทศกาล</h3><p>เทศกาลร่มบ่อสร้างและหัตถกรรมสันกำแพง</p></div>').addTo(map);
  map.fitBounds(bounds,{padding:[70,70],maxZoom:16});

  [...document.querySelectorAll('.sidebar-scroll > div')].slice(0,3).forEach((card,index) => {
    const item=parking[index]; card.dataset.parkingCard=item.id; card.setAttribute('role','button'); card.setAttribute('tabindex','0');
    card.addEventListener('click',event=>{ if(event.target.closest('a')) return; selectParking(item.id); });
    card.addEventListener('keydown',event=>{ if(event.key==='Enter'||event.key===' '){event.preventDefault();selectParking(item.id);} });
  });
  document.getElementById('parkingFitAll').addEventListener('click',()=>map.fitBounds(bounds,{padding:[70,70],maxZoom:16}));
  document.getElementById('parkingLocate').addEventListener('click',()=>map.locate({setView:true,maxZoom:16}));
  map.on('locationfound',event=>L.circleMarker(event.latlng,{radius:8,color:'#fff',weight:3,fillColor:'#0059bb',fillOpacity:1}).bindPopup('ตำแหน่งโดยประมาณของคุณ').addTo(map).openPopup());
  map.on('locationerror',()=>window.alert('ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาอนุญาตการใช้ตำแหน่งในเบราว์เซอร์'));
  setTimeout(()=>map.invalidateSize(),150);
})();
