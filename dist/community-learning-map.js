(function () {
  var mapElement = document.getElementById("communityLearningMap");
  if (!mapElement || typeof window.L === "undefined") return;

  var places = [
    { id: "umbrella-learning", name: "ศูนย์เรียนรู้การทำร่มบ่อสร้าง", lat: 18.7682, lng: 99.1195, type: "หัตถกรรมและอาชีพ" },
    { id: "sa-paper-learning", name: "ศูนย์เรียนรู้การทำกระดาษสา", lat: 18.7767, lng: 99.1127, type: "หัตถกรรมและอาชีพ" },
    { id: "community-museum", name: "พิพิธภัณฑ์หัตถกรรมชุมชน", lat: 18.7739, lng: 99.1224, type: "ประวัติศาสตร์ท้องถิ่น" },
    { id: "community-agriculture", name: "แหล่งเรียนรู้เกษตรชุมชนต้นเปา", lat: 18.7821, lng: 99.1168, type: "เกษตรและสิ่งแวดล้อม" }
  ];

  var map = L.map(mapElement, {
    zoomControl: false,
    scrollWheelZoom: false,
    attributionControl: true
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  var markerIcon = L.divIcon({
    className: "",
    html: '<div style="width:30px;height:30px;border-radius:50%;background:#0062c7;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,26,64,.35);display:flex;align-items:center;justify-content:center"><span class="material-symbols-outlined" style="color:#fff;font-size:17px;font-variation-settings:\'FILL\' 1">school</span></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -17]
  });

  var markers = {};
  places.forEach(function (place) {
    markers[place.id] = L.marker([place.lat, place.lng], { icon: markerIcon, title: place.name })
      .addTo(map)
      .bindPopup(
        '<div style="min-width:170px;line-height:1.45"><strong>' + place.name + '</strong><br><span>' + place.type + '</span><br><small>ข้อมูลตำแหน่งตัวอย่าง</small></div>',
        { autoPan: false, keepInView: false }
      );
  });

  map.fitBounds(L.latLngBounds(places.map(function (place) {
    return [place.lat, place.lng];
  })), { paddingTopLeft: [28, 28], paddingBottomRight: [28, 72], maxZoom: 15 });

  L.control.zoom({ position: "topright" }).addTo(map);

  document.querySelectorAll("[data-community-map-focus]").forEach(function (button) {
    var id = button.dataset.communityMapFocus;
    button.className = "w-full py-sm bg-white text-primary border border-primary rounded-lg font-bold flex items-center justify-center gap-xs hover:bg-primary/5 transition-colors";
    var actions = document.createElement("div");
    actions.className = "mt-md grid grid-cols-2 gap-sm";
    button.parentNode.insertBefore(actions, button);
    actions.appendChild(button);
    var detail = document.createElement("a");
    detail.className = "w-full py-sm bg-primary text-white rounded-lg font-bold flex items-center justify-center gap-xs hover:bg-primary-container transition-colors";
    detail.href = "/#/poi/" + id;
    detail.innerHTML = '<span class="material-symbols-outlined text-[18px]">info</span>ดูรายละเอียด';
    actions.appendChild(detail);
  });

  document.querySelectorAll("[data-community-map-focus]").forEach(function (button) {
    button.addEventListener("click", function () {
      var place = places.find(function (item) { return item.id === button.dataset.communityMapFocus; });
      var marker = markers[button.dataset.communityMapFocus];
      if (!place || !marker) return;
      map.setView([place.lat, place.lng], 17, { animate: true });
      marker.openPopup();
      map.panTo([place.lat, place.lng], { animate: false });
      mapElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    });
  });

  window.setTimeout(function () { map.invalidateSize(); }, 150);
})();
