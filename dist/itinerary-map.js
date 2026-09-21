(() => {
  const mapNode = document.getElementById('itineraryMap');
  if (!mapNode || !window.L) return;

  const map = L.map(mapNode, { zoomControl: true, attributionControl: true }).setView([18.7758, 99.1167], 14);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const stopLayer = L.layerGroup().addTo(map);
  const routeLayer = L.layerGroup().addTo(map);
  const markerByName = new Map();
  const distanceLabel = document.getElementById('trip-result-distance');
  const hint = document.getElementById('itinerary-map-hint');
  let routePoints = [];
  let lastStops = [];
  let lastOptions = {};
  let startMarker = null;
  let selectionHandler = null;

  const numberedIcon = number => L.divIcon({
    className: 'itinerary-marker',
    html: `<span aria-hidden="true">${number}</span>`,
    iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -19]
  });
  const startIcon = L.divIcon({
    className: 'itinerary-start-marker',
    html: '<span aria-hidden="true"><span class="material-symbols-outlined" style="font-size:19px">flag</span></span>',
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20]
  });
  const popupContent = (name, subtitle) => {
    const content = document.createElement('div');
    const heading = document.createElement('strong');
    const detail = document.createElement('div');
    heading.textContent = name;
    detail.textContent = subtitle;
    detail.style.marginTop = '4px';
    detail.style.color = '#424752';
    content.append(heading, detail);
    return content;
  };
  const haversineKm = (a, b) => {
    const radians = value => value * Math.PI / 180;
    const earthRadius = 6371;
    const dLat = radians(b[0] - a[0]);
    const dLng = radians(b[1] - a[1]);
    const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a[0])) * Math.cos(radians(b[0])) * Math.sin(dLng / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  };
  const routeDistance = points => points.slice(1).reduce((sum, point, index) => sum + haversineKm(points[index], point), 0);
  const fitRoute = () => {
    if (!routePoints.length) return;
    if (routePoints.length === 1) map.setView(routePoints[0], 16, { animate: true });
    else map.fitBounds(L.latLngBounds(routePoints), { paddingTopLeft: [56, 90], paddingBottomRight: [56, 56], maxZoom: 16, animate: true });
  };

  const update = (stops, options = {}) => {
    lastStops = stops.filter(stop => Number.isFinite(stop.lat) && Number.isFinite(stop.lng));
    lastOptions = options;
    stopLayer.clearLayers();
    routeLayer.clearLayers();
    markerByName.clear();
    if (startMarker) { map.removeLayer(startMarker); startMarker = null; }

    const start = Number.isFinite(options.startLat) && Number.isFinite(options.startLng)
      ? [options.startLat, options.startLng]
      : null;
    if (start) {
      startMarker = L.marker(start, { icon: startIcon, title: options.startName || 'จุดเริ่มต้น' })
        .bindPopup(popupContent(options.startName || 'จุดเริ่มต้น', 'จุดเริ่มการเดินทาง'))
        .addTo(map);
    }

    lastStops.forEach((stop, index) => {
      const marker = L.marker([stop.lat, stop.lng], { icon: numberedIcon(index + 1), title: stop.name })
        .bindPopup(popupContent(stop.name, `จุดแวะลำดับที่ ${index + 1}`))
        .on('click', () => document.dispatchEvent(new CustomEvent('tonpao:map-stop-selected', { detail: { name: stop.name } })))
        .addTo(stopLayer);
      markerByName.set(stop.name, marker);
    });

    routePoints = [...(start ? [start] : []), ...lastStops.map(stop => [stop.lat, stop.lng])];
    if (options.returnToStart && start && routePoints.length > 1) routePoints.push(start);
    if (routePoints.length > 1) {
      L.polyline(routePoints, { color: '#00428e', weight: 5, opacity: .88, dashArray: '10 8', lineCap: 'round', lineJoin: 'round' }).addTo(routeLayer);
    }
    if (distanceLabel) {
      const km = routeDistance(routePoints);
      distanceLabel.textContent = km < 1 ? `${Math.round(km * 1000)} ม. โดยประมาณ` : `${km.toFixed(1)} กม. โดยประมาณ`;
    }
    fitRoute();
    setTimeout(() => map.invalidateSize(), 0);
  };

  const focus = name => {
    const marker = markerByName.get(name);
    if (!marker) return;
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 16), { animate: true });
    marker.openPopup();
  };
  const setStartSelection = handler => {
    selectionHandler = handler;
    mapNode.style.cursor = handler ? 'crosshair' : '';
    if (hint) hint.textContent = handler
      ? 'คลิกตำแหน่งบนแผนที่เพื่อกำหนดจุดเริ่มต้น แล้วระบบจะคำนวณเส้นทางใหม่'
      : 'คลิกหมุดเพื่อดูสถานที่ หรือปรับลำดับจากรายการด้านซ้าย';
  };
  const useStart = (lat, lng, name) => {
    if (selectionHandler) selectionHandler({ lat, lng, name });
  };

  map.on('click', event => {
    if (!selectionHandler) return;
    useStart(event.latlng.lat, event.latlng.lng, 'จุดเริ่มต้นที่เลือกบนแผนที่');
    setStartSelection(null);
  });
  map.on('locationfound', event => {
    useStart(event.latlng.lat, event.latlng.lng, 'ตำแหน่งปัจจุบัน');
    setStartSelection(null);
  });
  map.on('locationerror', () => {
    if (hint) hint.textContent = 'ไม่สามารถอ่านตำแหน่งปัจจุบันได้ กรุณาเลือกจุดเริ่มต้นบนแผนที่';
    setStartSelection(selectionHandler);
  });
  document.querySelector('[data-map-fit]')?.addEventListener('click', fitRoute);
  window.TonPaoItineraryMap = {
    update,
    focus,
    selectStart: setStartSelection,
    locate: () => map.locate({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 })
  };
})();
