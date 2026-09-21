(function () {
  if (typeof window.L === "undefined") return;

  var configs = {
    "หัตถกรรมและร่มบ่อสร้าง": {
      color: "#007a3d", icon: "palette", places: [
        ["ศูนย์อุตสาหกรรมทำร่มบ่อสร้าง", 18.7682, 99.1195, "หัตถกรรมและอาชีพ", "umbrella-center"],
        ["ศูนย์สาธิตการทำกระดาษสา", 18.7767, 99.1127, "หัตถกรรมและอาชีพ", "sa-paper-demo"],
        ["พิพิธภัณฑ์หัตถกรรมไม้แกะสลัก", 18.7739, 99.1224, "พิพิธภัณฑ์ชุมชน", "woodcraft-museum"],
        ["ร้านผ้าทอเมืองล้านนา", 18.7812, 99.1172, "ผลิตภัณฑ์ชุมชน", "lanna-textile-shop"]
      ]
    },
    "วัดและวัฒนธรรม": {
      color: "#8b4c00", icon: "temple_buddhist", places: [
        ["วัดต้นเปา", 18.7791, 99.1099, "วัดและศาสนสถาน", "wat-tonpao"],
        ["วัดบ่อสร้าง", 18.7668, 99.1212, "วัดและศาสนสถาน", "wat-borsang"],
        ["ศูนย์วัฒนธรรมชุมชนต้นเปา", 18.7754, 99.1158, "ศิลปวัฒนธรรม", "tonpao-cultural-center"],
        ["ชุมชนวัฒนธรรมบ้านต้นเปา", 18.7822, 99.1201, "วิถีชุมชน", "tonpao-cultural-community"]
      ]
    },
    "อาหารและคาเฟ่": {
      color: "#c2410c", icon: "restaurant", places: [
        ["เสน่ห์คาเฟ่ ต้นเปา", 18.7820, 99.1177, "คาเฟ่", "tonpao-cafe"],
        ["ครัวเมืองต้นเปา", 18.7734, 99.1145, "อาหารพื้นเมือง", "tonpao-kitchen"],
        ["ตลาดของกินชุมชนต้นเปา", 18.7696, 99.1217, "ตลาดชุมชน", "tonpao-food-market"],
        ["บ้านขนมและกาแฟต้นเปา", 18.7785, 99.1123, "ขนมและเครื่องดื่ม", "tonpao-coffee-house"]
      ]
    },
    "ที่พัก": {
      color: "#6d28d9", icon: "bed", places: [
        ["บ้านต้นเปาโฮมสเตย์", 18.7834, 99.1222, "โฮมสเตย์", "tonpao-homestay"],
        ["บ่อสร้างการ์เดนรีสอร์ต", 18.7698, 99.1240, "รีสอร์ต", "borsang-garden-resort"],
        ["เรือนล้านนาเกสต์เฮาส์", 18.7761, 99.1136, "เกสต์เฮาส์", "lanna-guesthouse"],
        ["บ้านสวนต้นเปา", 18.7861, 99.1164, "ที่พักชุมชน", "tonpao-garden-house"]
      ]
    }
  };

  var pageTitle = document.querySelector("main h1");
  var config = pageTitle && configs[pageTitle.textContent.trim()];
  var mapHolder = document.querySelector("aside [data-location]");
  if (!config || !mapHolder) return;

  mapHolder.innerHTML = "";
  mapHolder.id = "categoryMiniMap";
  mapHolder.setAttribute("aria-label", "แผนที่" + pageTitle.textContent.trim());

  var cardTitles = Array.from(document.querySelectorAll("article h3.line-clamp-1"));
  cardTitles.forEach(function (title) {
    title.className = "flex-1 min-w-0 text-[18px] leading-6 font-bold text-on-surface";
    if (title.nextElementSibling) title.nextElementSibling.classList.add("shrink-0", "ml-sm");
  });

  var map = L.map(mapHolder, { zoomControl: false, scrollWheelZoom: false, attributionControl: true });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  var markerIcon = L.divIcon({
    className: "",
    html: '<div style="width:30px;height:30px;border-radius:50%;background:' + config.color + ';border:3px solid #fff;box-shadow:0 2px 8px rgba(0,26,64,.35);display:flex;align-items:center;justify-content:center"><span class="material-symbols-outlined" style="color:#fff;font-size:17px;font-variation-settings:\'FILL\' 1">' + config.icon + '</span></div>',
    iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -17]
  });

  var markers = config.places.map(function (place) {
    return L.marker([place[1], place[2]], { icon: markerIcon, title: place[0] })
      .addTo(map)
      .bindPopup('<div style="min-width:170px;line-height:1.45"><strong>' + place[0] + '</strong><br><span>' + place[3] + '</span><br><small>ข้อมูลตำแหน่งตัวอย่าง</small></div>', { autoPan: false, keepInView: false });
  });

  map.fitBounds(L.latLngBounds(config.places.map(function (place) { return [place[1], place[2]]; })), {
    paddingTopLeft: [28, 28], paddingBottomRight: [28, 72], maxZoom: 15
  });
  L.control.zoom({ position: "topright" }).addTo(map);

  var cards = Array.from(document.querySelectorAll("article"));
  cards.slice(0, config.places.length).forEach(function (card, index) {
    var button = Array.from(card.querySelectorAll("a, button")).find(function (element) {
      var label = element.textContent.trim();
      return label.indexOf("ดูบนแผนที่") !== -1 || label.indexOf("ดูรายละเอียด") !== -1;
    });
    if (!button) return;
    button.innerHTML = '<span class="material-symbols-outlined text-[18px]">location_on</span>ดูบนแผนที่';
    button.className = "w-full py-sm bg-white text-primary border border-primary rounded-lg font-bold flex items-center justify-center gap-xs hover:bg-primary/5 transition-colors";
    var actions = document.createElement("div");
    actions.className = "mt-md grid grid-cols-2 gap-sm";
    button.parentNode.insertBefore(actions, button);
    actions.appendChild(button);
    var detail = document.createElement("a");
    detail.className = "w-full py-sm bg-primary text-white rounded-lg font-bold flex items-center justify-center gap-xs hover:bg-primary-container transition-colors";
    detail.href = "/#/poi/" + config.places[index][4];
    detail.innerHTML = '<span class="material-symbols-outlined text-[18px]">info</span>ดูรายละเอียด';
    actions.appendChild(detail);
    button.setAttribute("href", "#category-map");
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      var place = config.places[index];
      map.setView([place[1], place[2]], 17, { animate: true });
      markers[index].openPopup();
      map.panTo([place[1], place[2]], { animate: false });
      mapHolder.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    });
  });

  var overlay = mapHolder.parentElement.querySelector(".absolute.bottom-3");
  if (overlay) {
    overlay.style.zIndex = "500";
    var largeMapLink = overlay.querySelector("a");
    if (largeMapLink) largeMapLink.href = "/#/map";
  }
  window.setTimeout(function () { map.invalidateSize(); }, 150);
})();
