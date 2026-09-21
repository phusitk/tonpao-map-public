(function () {
  var mapElement = document.getElementById("eventDetailMap");
  if (!mapElement || typeof window.L === "undefined") return;

  var eventLocation = [18.7682, 99.1195];
  var map = L.map(mapElement, {
    zoomControl: false,
    scrollWheelZoom: false,
    attributionControl: true
  }).setView(eventLocation, 16);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  L.circle(eventLocation, {
    radius: 95,
    color: "#0059bb",
    weight: 2,
    fillColor: "#acc7ff",
    fillOpacity: 0.22
  }).addTo(map);

  var eventIcon = L.divIcon({
    className: "",
    html: '<div style="width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#00428e;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,26,64,.35);display:flex;align-items:center;justify-content:center"><span class="material-symbols-outlined" style="transform:rotate(45deg);color:#fff;font-size:21px;font-variation-settings:\'FILL\' 1">festival</span></div>',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  });

  L.marker(eventLocation, { icon: eventIcon, title: "เทศกาลร่มบ่อสร้าง" })
    .addTo(map)
    .bindPopup(
      '<div style="min-width:190px;line-height:1.45"><strong>เทศกาลร่มบ่อสร้าง</strong><br><span>16–20 กันยายน 2569</span><br><span>หมู่บ้านทำร่มบ่อสร้าง</span><br><a href="https://www.google.com/maps/dir/?api=1&destination=18.7682%2C99.1195&travelmode=driving&dir_action=navigate" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:6px;color:#00428e;font-weight:600">นำทางด้วย Google Maps ↗</a></div>'
    );

  L.control.zoom({ position: "bottomright" }).addTo(map);
  window.setTimeout(function () { map.invalidateSize(); }, 150);
})();
