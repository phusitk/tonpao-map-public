# TonPao Map — Public Prototype

ต้นแบบหน้าจอ (clickable prototype) ของ **TonPao Map** แผนที่ท่องเที่ยวชุมชนตำบลต้นเปา อ.สันกำแพง จ.เชียงใหม่ ครอบคลุมการสำรวจแผนที่ สถานที่ กิจกรรม/เทศกาล แผนเที่ยว และพื้นที่ผู้ร่วมให้ข้อมูล (Contributor)

**เว็บที่ deploy แล้ว:** https://phusitk.github.io/tonpao-map-public/

> สถานะ: เป็นต้นแบบสำหรับสาธิตและทดสอบกับผู้ใช้ ข้อมูลทั้งหมดเขียนไว้ในโค้ด ไม่มี backend และการล็อกอินเป็นแบบจำลอง ดูผลการตรวจความสมบูรณ์ได้ที่ [`AUDIT_REPORT.md`](AUDIT_REPORT.md) และรายงานผลการทดสอบฉบับ Word ที่ [`docs/TonPao-Map-Test-Report.docx`](docs/TonPao-Map-Test-Report.docx)

## เปิดใช้งานบนเครื่อง

เว็บเป็นไฟล์ static ในโฟลเดอร์ `dist/` ไม่ต้อง build แต่ต้องเปิดผ่าน web server ที่ **ชี้ `dist/` เป็น root** เพราะไฟล์อ้างถึงกันด้วย path แบบ absolute (เช่น `/router.js`)

```bash
npx http-server dist -p 8080 -c-1
# หรือ
python3 -m http.server 8080 --directory dist
```

แล้วเปิด http://localhost:8080/ (การเปิดไฟล์ตรงแบบ `file://` จะใช้ไม่ได้)

ต้องต่ออินเทอร์เน็ต เพราะโหลด Tailwind (`cdn.tailwindcss.com`), Leaflet (`unpkg.com`), Google Fonts, แผนที่ OpenStreetMap และรูปภาพจากภายนอกขณะเปิดหน้า

## Deploy

- **GitHub Pages:** push เข้า `main` แล้ว workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) จะรัน [`scripts/prepare-github-pages.py`](scripts/prepare-github-pages.py) เพื่อคัดลอก `dist/` ไปที่ `pages-dist/` พร้อมเติม prefix `/tonpao-map-public` ให้ path แบบ absolute แล้ว deploy อัตโนมัติ (ต้องตั้ง Settings → Pages → Source เป็น **GitHub Actions**)
- **ChatGPT Sites:** ตั้งค่าไว้ใน [`.openai/hosting.json`](.openai/hosting.json) ให้เสิร์ฟ `dist/` ที่ root ของโดเมน

ทดสอบ build ของ Pages บนเครื่องได้ด้วย `python3 scripts/prepare-github-pages.py` แล้วเสิร์ฟ `pages-dist/` ใต้ path `/tonpao-map-public/` (อย่า commit โฟลเดอร์ `pages-dist/`)

## รูปภาพ

รูปประกอบเดิมโหลดจากภายนอก (`lh3.googleusercontent.com/aida-public/…` ที่เครื่องมือ AI ของ Google สร้างไว้ และ Unsplash) ซึ่งอาจหมดอายุได้ สคริปต์ [`scripts/localize-images.py`](scripts/localize-images.py) จะดาวน์โหลดรูปมาเก็บที่ `dist/assets/images/` (ตั้งชื่อตาม hash ของ URL และบันทึก URL ต้นทางไว้ใน `manifest.json`) แล้วเปลี่ยนลิงก์ในไฟล์ให้ชี้ไปที่รูปในเครื่องแบบ path สัมพัทธ์

- รันบน GitHub: workflow [`localize-images.yml`](.github/workflows/localize-images.yml) รันเองเมื่อ push สคริปต์เข้า branch `claude/**` หรือกดรันเองที่แท็บ Actions แล้วจะ commit ผลกลับเข้า branch นั้น
- รันบนเครื่อง: `python3 scripts/localize-images.py` (ใส่ `--dry-run` เพื่อดูรายการก่อน)
- รูปที่ดาวน์โหลดไม่ได้จะคงลิงก์เดิมไว้ และรันซ้ำได้โดยไม่ดาวน์โหลดรูปที่มีอยู่แล้ว

## โครงสร้าง

```
dist/
├── index.html              หน้าเปล่าที่มี iframe + router
├── router.js               hash router: แปลง #/route → screens/sXX/desktop.html
├── prototype-nav.js        เมนูหลักร่วม และการนำทางของปุ่ม/ลิงก์ (รวมการเดาปลายทางจากข้อความปุ่ม)
├── desktop-prototype.js    พฤติกรรมเฉพาะหน้า (ฟอร์มสร้างแผนเที่ยว, ตัวเลือก ฯลฯ)
├── prototype-actions.js    ปุ่มที่หน้าจอต้นฉบับไม่ได้ผูกไว้: ตัวกรอง/เรียงลำดับหมวดหมู่, บันทึกสถานที่, แชร์, ลิงก์ติดต่อ ฯลฯ (router ใส่ให้ทุกหน้าอัตโนมัติ)
├── responsive-shell.css/js ปรับหน้าจอให้ใช้ได้บนมือถือ และเพิ่มเมนูแถบล่าง (router ใส่ให้ทุกหน้าอัตโนมัติ)
├── *-map.js, *-prototype.js แผนที่ Leaflet ของแต่ละหน้า
├── poi-detail-dynamic.js   เปลี่ยนเนื้อหาหน้า POI ตาม ?poi=<id>
├── favicon.svg, favicon-32.png, apple-touch-icon.png
├── contributor/            แอปพื้นที่ผู้ร่วมให้ข้อมูล (หน้าเดียว เลือก view ด้วย ?view=)
└── screens/sXX/
    ├── desktop.html        หน้าจอที่ใช้งานจริง (ทุกขนาดจอ)
    └── mobile.html         แบบร่างมือถือเดิม เก็บไว้อ้างอิง router ไม่ได้ใช้แล้ว
```

การทำงาน: `index.html` อ่าน hash ใน URL → `router.js` เลือกหน้าจอแล้วโหลดเข้า iframe → หน้าจอเรียก `window.parent.location.hash = …` เพื่อเปลี่ยนหน้า

## หน้าจอและ route

| Route | หน้าจอ | เนื้อหา |
|---|---|---|
| `#/` | s01 | หน้าแรก |
| `#/map`, `#/explore` | s02 | สำรวจแผนที่ |
| `#/search` | s03 | ผลการค้นหา |
| `#/poi/<id>` | s04 | รายละเอียดสถานที่ (เช่น `umbrella-center`) |
| `#/category/handicraft` | s19 | หมวดหัตถกรรมและร่มบ่อสร้าง |
| `#/category/temples-culture` | s20 | หมวดวัดและวัฒนธรรม |
| `#/category/food-cafe` | s21 | หมวดอาหารและคาเฟ่ |
| `#/category/community-learning` | s22 | หมวดแหล่งเรียนรู้ชุมชน |
| `#/category/accommodation` | s23 | หมวดที่พัก |
| `#/events` | s05 | กิจกรรมและเทศกาล |
| `#/events/umbrella-festival` | s06 | รายละเอียดกิจกรรม |
| `#/events/umbrella-festival/parking` | s07 | ที่จอดรถกิจกรรม |
| `#/events/umbrella-festival/schedule` | s08 | กำหนดการกิจกรรม |
| `#/plan/templates` | s09 | แผนเที่ยวแนะนำ |
| `#/plan/build` | s10 | สร้างแผนการเดินทาง |
| `#/plan/result` | s11 | ผลลัพธ์แผนเที่ยว |
| `#/my-itineraries` | s42 | แผนการเดินทางของฉัน |
| `#/about` | s12 | เกี่ยวกับเรา |
| `#/help` | s13 | ศูนย์ช่วยเหลือและคำถามที่พบบ่อย |
| `#/privacy` | s14 | นโยบายความเป็นส่วนตัว |
| `#/terms` | s15 | ข้อกำหนดการใช้งาน |
| `#/offline` | s16 | ไม่มีการเชื่อมต่ออินเทอร์เน็ต (หน้าตัวอย่าง) |
| `#/404` และ route ที่ไม่รู้จัก | s17 | ไม่พบหน้า |
| `#/500` | s18 | ระบบขัดข้อง |

**พื้นที่ผู้ร่วมให้ข้อมูล** (`contributor/index.html?view=…`): `#/contributor` (intro), `/login`, `/register`, `/verify`, `/application-status`, `/forgot-password`, `/reset-password`, `/dashboard`, `/pois`, `/pois/new`, `/pois/edit`, `/profile`, `/notifications`

## การเพิ่มหรือแก้หน้าจอ

1. สร้างหรือแก้ `dist/screens/sXX/desktop.html` และใส่ `<script src="/prototype-nav.js"></script>` ท้าย `<body>`
2. เพิ่ม route ใน `routes` ของ `dist/router.js`
3. ลิงก์ภายในให้เขียนเป็น `href="/#/route"` (สคริปต์ Pages จะเติม prefix ให้เอง) หลีกเลี่ยง `href="#"` และชื่อไฟล์ตรง ๆ
4. ถ้าเขียนโค้ดที่ตรวจ href ใน JavaScript อย่าเขียนสตริง `'/#` ตรง ๆ เพราะสคริปต์ Pages จะแก้สตริงนั้นด้วย ให้ใช้ regex แบบใน `prototype-nav.js` แทน

## ข้อจำกัดที่ทราบ

- ใช้ Tailwind Play CDN ที่ไม่ได้ออกแบบมาสำหรับ production
- ไม่มี backend: สถานที่ที่กด “บันทึก” เก็บไว้ในเบราว์เซอร์เครื่องนั้นเท่านั้น (`localStorage`) และปุ่ม “โทร” ของสถานที่ยังไม่มีเบอร์จริง
- ตารางกิจกรรมมีข้อมูลเฉพาะวันแรก และยังใช้ปี 2567
- ยังใช้งานออฟไลน์ไม่ได้ (ไม่มี service worker)
- รายละเอียดและข้อเสนอแนะอยู่ใน [`AUDIT_REPORT.md`](AUDIT_REPORT.md)
