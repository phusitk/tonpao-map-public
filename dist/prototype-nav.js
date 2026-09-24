(() => {
  const go = route => { window.parent.location.hash = route; };
  const screen = location.pathname.match(/\/screens\/(s\d+)\//)?.[1] || '';

  // Stitch exports some brand marks as plain text instead of links.
  // Normalize every header brand so TonPao Map always returns home.
  [...document.querySelectorAll('header a, header span, header div')]
    .filter(element => (element.textContent || '').trim() === 'TonPao Map')
    .forEach(element => {
      element.style.cursor = 'pointer';
      element.setAttribute('aria-label', 'กลับหน้าแรก TonPao Map');
      if (element.tagName === 'A') {
        element.setAttribute('href', '/#/');
      } else {
        element.setAttribute('role', 'link');
        element.setAttribute('tabindex', '0');
        element.addEventListener('click', () => go('/'));
        element.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); go('/'); }
        });
      }
    });

  // Use one shared desktop Top Menu across every public screen.
  const topHeader = document.querySelector('header');
  const topNav = topHeader?.querySelector('nav');
  if (topHeader && topNav) {
    const headerInner = topHeader.firstElementChild;
    const activeRoute =
      screen === 's01' ? '/' :
      ['s02', 's03', 's04', 's19', 's20', 's21', 's22', 's23'].includes(screen) ? '/map' :
      ['s05', 's06', 's07', 's08'].includes(screen) ? '/events' :
      ['s09', 's10', 's11', 's42'].includes(screen) ? '/plan/templates' :
      screen === 's12' ? '/about' : '';
    const menuItems = [
      ['/', 'หน้าแรก'],
      ['/map', 'สำรวจแผนที่'],
      ['/events', 'กิจกรรม'],
      ['/plan/templates', 'แผนเที่ยว'],
      ['/about', 'เกี่ยวกับเรา']
    ];

    topHeader.classList.add('tonpao-site-header');
    headerInner?.classList.add('tonpao-header-inner');
    topNav.className = 'tonpao-primary-nav';
    topNav.setAttribute('aria-label', 'เมนูหลัก');
    topNav.innerHTML = menuItems.map(([route, label]) => {
      const active = route === activeRoute;
      return `<a href="/#${route}" class="tonpao-nav-link${active ? ' is-active' : ''}"${active ? ' aria-current="page"' : ''}>${label}</a>`;
    }).join('');

    const brand = [...topHeader.querySelectorAll('a, span, div')]
      .find(element => (element.textContent || '').trim() === 'TonPao Map');
    brand?.classList.add('tonpao-standard-brand');

    // Search belongs in Explore Map, not in the shared global navigation.
    const headerSearch = topHeader.querySelector('input[placeholder*="ค้นหา"]');
    if (headerSearch && headerInner) {
      let searchBlock = headerSearch;
      while (searchBlock.parentElement && searchBlock.parentElement !== headerInner) {
        searchBlock = searchBlock.parentElement;
      }
      if (searchBlock !== headerInner) searchBlock.style.display = 'none';
    }

    const style = document.createElement('style');
    style.textContent = `
      .tonpao-site-header {
        height: 64px !important;
        min-height: 64px !important;
        background: rgba(249, 249, 255, 0.96) !important;
        border-bottom: 1px solid rgba(0, 66, 142, 0.10) !important;
        box-shadow: 0 2px 8px rgba(0, 66, 142, 0.06) !important;
        backdrop-filter: blur(12px);
      }
      .tonpao-header-inner {
        position: relative !important;
        width: 100% !important;
        max-width: 1440px !important;
        height: 64px !important;
        min-height: 64px !important;
        margin: 0 auto !important;
        padding-left: 32px !important;
        padding-right: 32px !important;
        display: flex !important;
        align-items: center !important;
      }
      .tonpao-standard-brand {
        color: #00428e !important;
        font-family: "Plus Jakarta Sans", "Be Vietnam Pro", sans-serif !important;
        font-size: 30px !important;
        line-height: 1 !important;
        font-weight: 800 !important;
        letter-spacing: -0.03em !important;
        white-space: nowrap !important;
      }
      .tonpao-primary-nav {
        position: absolute !important;
        left: 50% !important;
        top: 0 !important;
        transform: translateX(-50%) !important;
        height: 64px !important;
        display: flex !important;
        align-items: center !important;
        gap: 28px !important;
        white-space: nowrap !important;
      }
      .tonpao-nav-link {
        position: relative;
        display: inline-flex;
        height: 64px;
        align-items: center;
        color: #4f5663 !important;
        font-family: "Be Vietnam Pro", sans-serif !important;
        font-size: 16px !important;
        line-height: 1.3 !important;
        font-weight: 600 !important;
        text-decoration: none !important;
        transition: color 160ms ease;
      }
      .tonpao-nav-link:hover,
      .tonpao-nav-link.is-active {
        color: #00428e !important;
      }
      .tonpao-nav-link.is-active::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 9px;
        height: 2px;
        border-radius: 999px;
        background: #0059bb;
      }
      @media (max-width: 1100px) {
        .tonpao-primary-nav { gap: 18px !important; }
        .tonpao-nav-link { font-size: 14px !important; }
        .tonpao-standard-brand { font-size: 27px !important; }
      }
      @media (max-width: 767px) {
        .tonpao-primary-nav { display: none !important; }
        .tonpao-header-inner {
          padding-left: 16px !important;
          padding-right: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Contextual travel-decision information for the desktop public prototype.
  // Values are labelled as prototype data until live providers are connected.
  const decisionData = {
    s01: {
      title: 'สถานการณ์ท่องเที่ยววันนี้',
      summary: '31°C · การจราจรคล่องตัว',
      items: [
        ['☀️', 'อากาศ', '31°C มีเมฆบางส่วน · โอกาสฝน 30%'],
        ['🚗', 'การจราจร', 'เส้นทางหลักคล่องตัว ใช้เวลาเพิ่มประมาณ 5 นาที'],
        ['🎪', 'กิจกรรม', 'มีเทศกาลร่มบ่อสร้างช่วง 15–17 มกราคม'],
        ['⚠️', 'ประกาศ', 'ยังไม่มีประกาศปิดสถานที่หรือถนนสายหลัก']
      ]
    },
    s02: {
      title: 'ข้อมูลช่วยตัดสินใจบนแผนที่',
      summary: 'อากาศ · จราจร · ที่จอดรถ',
      items: [
        ['🌦️', 'อากาศและฝน', '31°C · โอกาสฝน 40% ช่วง 15:00–17:00 น.'],
        ['🚦', 'การจราจร', 'ถนนเชียงใหม่–สันกำแพงชะลอตัวบางช่วง'],
        ['🅿️', 'ที่จอดรถ', 'เปิดแสดงจุดจอดรถใกล้สถานที่บนแผนที่ได้'],
        ['🌫️', 'คุณภาพอากาศ', 'AQI 54 ระดับปานกลาง'],
        ['⚠️', 'ประกาศพื้นที่', 'ไม่มีประกาศปิดสถานที่ในขณะนี้']
      ]
    },
    s03: {
      title: 'ข้อมูลสำหรับเปรียบเทียบสถานที่',
      summary: 'เวลาเปิด · ระยะทาง · ความเหมาะสม',
      items: [
        ['🕘', 'สถานะบริการ', 'ตรวจสอบ “เปิดอยู่” และเวลาปิดก่อนเลือกสถานที่'],
        ['🚗', 'เวลาเดินทาง', 'ผลลัพธ์เรียงตามระยะทางและเวลาเดินทางได้'],
        ['🅿️', 'ที่จอดรถ', 'เปรียบเทียบสถานที่ที่มีที่จอดรถก่อนเปิดรายละเอียด'],
        ['♿', 'การเข้าถึง', 'เลือกสถานที่ที่รองรับรถเข็นและมีห้องน้ำได้'],
        ['🌦️', 'สภาพอากาศ', 'สถานที่ในร่มเหมาะกว่าในช่วงที่มีฝน']
      ]
    },
    s04: {
      title: 'ข้อมูลก่อนเดินทางไปสถานที่',
      summary: 'เปิดวันนี้ · เดินทางสะดวก',
      items: [
        ['🕘', 'เวลาเปิด–ปิด', 'เปิดวันนี้ 08:30–17:00 น. · เข้าชมฟรี'],
        ['🌤️', 'อากาศ', '32°C แจ่มใส · เหมาะกับการเดินชมกลางแจ้ง'],
        ['🅿️', 'ที่จอดรถ', 'มีที่จอดรถยนต์และรถจักรยานยนต์ด้านหน้า'],
        ['♿', 'สิ่งอำนวยความสะดวก', 'มีห้องน้ำ จุดพัก และทางลาดบางพื้นที่'],
        ['🧭', 'การเดินทาง', 'ประมาณ 20 นาทีจากตัวเมืองเชียงใหม่'],
        ['⚠️', 'ข้อควรทราบ', 'ควรติดต่อสถานที่ก่อนเข้าชมเป็นหมู่คณะ']
      ]
    },
    s05: {
      title: 'ข้อมูลประกอบการเลือกกิจกรรม',
      summary: 'วันจัดงาน · อากาศ · การเดินทาง',
      items: [
        ['📅', 'สถานะกิจกรรม', 'ตรวจสอบวัน เวลา และสถานะก่อนออกเดินทาง'],
        ['🌦️', 'อากาศ', 'กิจกรรมกลางแจ้งอาจได้รับผลกระทบจากฝนช่วงบ่าย'],
        ['🚧', 'การจราจร', 'งานขนาดใหญ่อาจมีการปิดถนนหรือเปลี่ยนเส้นทาง'],
        ['🅿️', 'ที่จอดรถ', 'เปิดรายละเอียดกิจกรรมเพื่อดูจุดจอดและจุดรับ–ส่ง'],
        ['♿', 'การเข้าถึง', 'ตรวจสอบพื้นที่สำหรับรถเข็นและห้องน้ำในงาน']
      ]
    },
    s06: {
      title: 'ความพร้อมสำหรับกิจกรรมนี้',
      summary: 'มีฝนบางช่วง · ควรมาก่อนเวลา',
      items: [
        ['🌦️', 'อากาศ', 'อาจมีฝนปรอยช่วงบ่าย ควรเตรียมร่มหรือเสื้อกันฝน'],
        ['🚧', 'ถนนและจราจร', 'ถนนสายหลักรอบงานอาจปิด 17:00–22:00 น.'],
        ['🅿️', 'ที่จอดรถ', 'มีจุดจอดรถ 3 แห่งและจุดรับ–ส่งใกล้พื้นที่งาน'],
        ['🚌', 'การเดินทาง', 'แนะนำมาถึงก่อนเริ่มกิจกรรมอย่างน้อย 45 นาที'],
        ['♿', 'สิ่งอำนวยความสะดวก', 'มีห้องน้ำ จุดปฐมพยาบาล และพื้นที่พัก'],
        ['☎️', 'กรณีฉุกเฉิน', 'ติดต่อศูนย์ประสานงานเทศบาลหรือหมายเลข 1669']
      ]
    },
    s07: {
      title: 'ข้อมูลเลือกที่จอดรถ',
      summary: 'ตำแหน่ง · ระยะเดิน · การเข้าถึง',
      items: [
        ['📍', 'ตำแหน่งจุดจอด', 'จุดจอดรถเป็นตำแหน่งที่ผู้ดูแลกิจกรรมปักหมุดไว้'],
        ['🧭', 'การนำทาง', 'เลือกจุดจอดแล้วเปิด Google Maps เพื่อนำทางต่อได้'],
        ['♿', 'ช่องจอดพิเศษ', 'ลาน A มีช่องจอดสำหรับผู้ใช้รถเข็นใกล้ทางเข้า'],
        ['🚌', 'จุดรับ–ส่ง', 'มีรถรับ–ส่งจากลาน C ทุก 20 นาที'],
        ['🌧️', 'ข้อควรระวัง', 'ลานกลางแจ้งอาจมีพื้นโคลนหลังฝนตก']
      ]
    },
    s08: {
      title: 'วางแผนเข้าร่วมตามกำหนดการ',
      summary: 'เลือกช่วงเวลา · เผื่อการเดินทาง',
      items: [
        ['🕘', 'เวลาที่ควรมาถึง', 'ควรมาถึงก่อนกิจกรรมที่เลือก 30–45 นาที'],
        ['🌦️', 'อากาศ', 'ช่วงบ่ายมีโอกาสฝน ควรเลือกกิจกรรมในร่มสำรอง'],
        ['🚗', 'เวลาเดินทาง', 'เผื่อเวลาเพิ่ม 20 นาทีในช่วง 16:00–19:00 น.'],
        ['🅿️', 'ที่จอดรถ', 'ตรวจสอบลานจอดก่อนออกเดินทาง'],
        ['📢', 'การเปลี่ยนแปลง', 'กำหนดการอาจเปลี่ยนตามสภาพอากาศ']
      ]
    },
    s09: {
      title: 'ข้อมูลสำหรับเลือกแผนเที่ยว',
      summary: 'เวลา · อากาศ · การเข้าถึง',
      items: [
        ['⏱️', 'ระยะเวลา', 'เลือกแผนครึ่งวันหรือเต็มวันตามเวลาที่มี'],
        ['🌦️', 'สภาพอากาศ', 'แผนที่มีสถานที่ในร่มเหมาะกับวันที่ฝนตก'],
        ['🚗', 'การเดินทาง', 'พิจารณาระยะทางรวมและช่วงรถติดของแต่ละเส้นทาง'],
        ['♿', 'การเข้าถึง', 'ตรวจสอบสถานที่ที่รองรับรถเข็นก่อนเลือกแผน'],
        ['📅', 'กิจกรรม', 'เลือกแผนให้ตรงกับวันจัดกิจกรรมในพื้นที่']
      ]
    },
    s10: {
      title: 'เงื่อนไขที่ควรกำหนดก่อนสร้างแผน',
      summary: 'การเดินทาง · อากาศ · ความต้องการพิเศษ',
      items: [
        ['🚗', 'รูปแบบการเดินทาง', 'เลือกรถยนต์ รถสาธารณะ จักรยาน หรือเดินเท้า'],
        ['🌧️', 'สภาพอากาศ', 'กำหนดให้หลีกเลี่ยงสถานที่กลางแจ้งเมื่อฝนตกได้'],
        ['🅿️', 'ที่จอดรถ', 'เลือกเฉพาะสถานที่ที่มีที่จอดรถได้'],
        ['♿', 'การเข้าถึง', 'ระบุความต้องการทางลาด ห้องน้ำ และระยะเดินสูงสุด'],
        ['🍽️', 'ข้อจำกัดส่วนบุคคล', 'ระบุอาหาร เวลาเปิด และกิจกรรมที่ต้องจอง']
      ]
    },
    s11: {
      title: 'ตรวจความพร้อมของแผนนี้',
      summary: 'พร้อมเดินทาง · มีคำแนะนำ 2 รายการ',
      items: [
        ['🌡️', 'อากาศ', '35°C อากาศร้อน ควรพกหมวก น้ำดื่ม หรือร่ม'],
        ['🚦', 'การจราจร', 'เส้นทางรวมคล่องตัว เผื่อเวลาเพิ่มประมาณ 15 นาที'],
        ['🅿️', 'ที่จอดรถ', 'จุดที่ 1 และ 3 มีที่จอดรถ จุดที่ 2 จอดริมถนน'],
        ['♿', 'สิ่งอำนวยความสะดวก', 'มีห้องน้ำที่จุดที่ 1 และจุดพักที่จุดที่ 2'],
        ['📅', 'การยืนยัน', 'ตรวจสอบเวลาเปิดและการจองก่อนเริ่มเดินทาง'],
        ['⚠️', 'ประกาศ', 'ไม่มีถนนปิดบนเส้นทางที่แนะนำ']
      ]
    },
    s19: {
      title: 'ข้อมูลเลือกแหล่งหัตถกรรม',
      summary: 'เวลาเปิด · เวิร์กชอป · ที่จอดรถ',
      items: [
        ['🕘', 'เวลาให้บริการ', 'ตรวจสอบเวลาเปิดและรอบสาธิตของแต่ละแห่ง'],
        ['🎨', 'เวิร์กชอป', 'บางกิจกรรมต้องจองล่วงหน้าและจำกัดจำนวนผู้เข้าร่วม'],
        ['🅿️', 'ที่จอดรถ', 'กรองสถานที่ที่รองรับรถยนต์หรือรถบัสได้'],
        ['♿', 'การเข้าถึง', 'ตรวจสอบทางลาด ห้องน้ำ และระยะเดินภายในพื้นที่']
      ]
    },
    s20: {
      title: 'ข้อมูลก่อนเยี่ยมชมวัดและแหล่งวัฒนธรรม',
      summary: 'เวลาเปิด · การแต่งกาย · การเข้าถึง',
      items: [
        ['🕘', 'เวลาเข้าชม', 'ตรวจสอบเวลาเปิดและช่วงที่มีพิธีกรรม'],
        ['🙏', 'ข้อปฏิบัติ', 'แต่งกายสุภาพและปฏิบัติตามข้อกำหนดของสถานที่'],
        ['🅿️', 'ที่จอดรถ', 'พื้นที่จอดอาจจำกัดในวันพระและวันจัดกิจกรรม'],
        ['♿', 'การเข้าถึง', 'อาคารเก่าบางส่วนอาจมีบันไดและไม่มีทางลาด'],
        ['🌦️', 'อากาศ', 'ควรเตรียมร่มสำหรับพื้นที่กลางแจ้ง']
      ]
    },
    s21: {
      title: 'ข้อมูลเลือกร้านอาหารและคาเฟ่',
      summary: 'เปิดอยู่ · ที่จอดรถ · ความต้องการอาหาร',
      items: [
        ['🕘', 'เปิดให้บริการ', 'ตรวจสอบเวลาครัวปิดและวันหยุดของร้าน'],
        ['🅿️', 'ที่จอดรถ', 'กรองร้านที่มีที่จอดรถหรืออยู่ในระยะเดินได้'],
        ['🥗', 'ข้อมูลอาหาร', 'ตรวจสอบอาหารมังสวิรัติ อาหารฮาลาล และสารก่อภูมิแพ้'],
        ['🚦', 'ช่วงเวลาหนาแน่น', 'ควรหลีกเลี่ยงเส้นทางหลักในช่วงเย็น'],
        ['☎️', 'การจอง', 'ร้านขนาดเล็กควรโทรสอบถามก่อนเดินทางเป็นกลุ่ม']
      ]
    },
    s22: {
      title: 'ข้อมูลเลือกแหล่งเรียนรู้',
      summary: 'รอบกิจกรรม · การจอง · การเข้าถึง',
      items: [
        ['📅', 'รอบกิจกรรม', 'ตรวจสอบวัน เวลา และระยะเวลาของเวิร์กชอป'],
        ['☎️', 'การจอง', 'บางแห่งรับเฉพาะคณะที่จองล่วงหน้า'],
        ['🅿️', 'การเดินทาง', 'ตรวจสอบที่จอดรถบัสและจุดรับ–ส่ง'],
        ['♿', 'การเข้าถึง', 'เลือกสถานที่ที่รองรับผู้สูงอายุและรถเข็น'],
        ['🌦️', 'สภาพอากาศ', 'กิจกรรมกลางแจ้งอาจเลื่อนเมื่อฝนตก']
      ]
    },
    s23: {
      title: 'ข้อมูลประกอบการเลือกที่พัก',
      summary: 'เช็กอิน · ที่จอดรถ · ระยะทาง',
      items: [
        ['🕘', 'เช็กอิน–เช็กเอาต์', 'ตรวจสอบเวลาและเงื่อนไขการมาถึงล่าช้า'],
        ['🅿️', 'ที่จอดรถ', 'ตรวจสอบจำนวนที่จอดและข้อจำกัดของรถขนาดใหญ่'],
        ['♿', 'การเข้าถึง', 'ตรวจสอบลิฟต์ ห้องพักชั้นล่าง และห้องน้ำที่เหมาะสม'],
        ['🧭', 'ทำเล', 'เปรียบเทียบระยะทางจากสถานที่ในแผนเที่ยว'],
        ['☎️', 'การยืนยัน', 'ยืนยันห้องพักและช่องทางติดต่อก่อนเดินทาง']
      ]
    },
    s42: {
      title: 'ตรวจแผนที่บันทึกไว้ก่อนออกเดินทาง',
      summary: 'ข้อมูลอาจเปลี่ยน · ควรตรวจอีกครั้ง',
      items: [
        ['🌦️', 'อากาศวันเดินทาง', 'ตรวจพยากรณ์อีกครั้งก่อนออกเดินทาง'],
        ['🚦', 'เส้นทาง', 'ตรวจการจราจร ถนนปิด และเวลาเดินทางล่าสุด'],
        ['🕘', 'สถานที่', 'ยืนยันเวลาเปิด การจอง และกิจกรรมในแผน'],
        ['🅿️', 'ที่จอดรถ', 'ตรวจสถานะและจุดจอดสำรอง'],
        ['⚠️', 'ประกาศ', 'ระบบจะแสดงคำเตือนเมื่อข้อมูลในแผนเปลี่ยนแปลง']
      ]
    }
  };

  if (innerWidth >= 768 && decisionData[screen]) {
    const data = decisionData[screen];
    const widget = document.createElement('details');
    widget.className = 'travel-decision-widget';
    if (screen === 's02') widget.classList.add('map-decision-widget');
    widget.innerHTML = `
      <summary>
        <span class="decision-summary-icon" aria-hidden="true">🧭</span>
        <span><strong>ข้อมูลก่อนเดินทาง</strong><small>${data.summary}</small></span>
        <span class="decision-chevron" aria-hidden="true">⌃</span>
      </summary>
      <section class="decision-panel" aria-label="${data.title}">
        <div class="decision-heading">
          <div><h2>${data.title}</h2><p>ข้อมูลตัวอย่างสำหรับต้นแบบ · อัปเดต 10:30 น.</p></div>
          <span>Prototype data</span>
        </div>
        <div class="decision-list">
          ${data.items.map(([icon, label, value]) => `
            <article>
              <span class="decision-item-icon" aria-hidden="true">${icon}</span>
              <div><h3>${label}</h3><p>${value}</p></div>
            </article>
          `).join('')}
        </div>
        <p class="decision-source">เวอร์ชันใช้งานจริงควรแสดงแหล่งข้อมูลและเวลาปรับปรุงล่าสุดของแต่ละรายการ</p>
      </section>
    `;
    document.body.appendChild(widget);

    const decisionStyle = document.createElement('style');
    decisionStyle.textContent = `
      .travel-decision-widget {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 70;
        width: min(420px, calc(100vw - 48px));
        font-family: "Be Vietnam Pro", sans-serif;
        color: #172033;
      }
      .travel-decision-widget > summary {
        margin-left: auto;
        width: fit-content;
        max-width: 100%;
        min-height: 58px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 9px 14px;
        border: 1px solid rgba(0,66,142,.18);
        border-radius: 18px;
        background: rgba(255,255,255,.97);
        box-shadow: 0 12px 32px rgba(0,48,104,.18);
        cursor: pointer;
        list-style: none;
      }
      .travel-decision-widget > summary::-webkit-details-marker { display: none; }
      .decision-summary-icon {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        background: #e7f0ff;
        font-size: 20px;
      }
      .travel-decision-widget summary strong,
      .travel-decision-widget summary small { display: block; }
      .travel-decision-widget summary strong { color: #00428e; font-size: 15px; }
      .travel-decision-widget summary small { margin-top: 2px; color: #626b7a; font-size: 12px; }
      .decision-chevron { margin-left: 6px; color: #0059bb; transition: transform .18s ease; }
      .travel-decision-widget[open] .decision-chevron { transform: rotate(180deg); }
      .decision-panel {
        margin-top: 10px;
        max-height: min(650px, calc(100vh - 120px));
        overflow-y: auto;
        border: 1px solid rgba(0,66,142,.15);
        border-radius: 20px;
        background: rgba(255,255,255,.98);
        box-shadow: 0 18px 48px rgba(0,48,104,.20);
        padding: 18px;
      }
      .decision-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
      .decision-heading h2 { margin: 0; color: #173f6d; font-size: 18px; line-height: 1.35; font-weight: 800; }
      .decision-heading p { margin: 4px 0 0; color: #717989; font-size: 12px; }
      .decision-heading > span {
        flex: none;
        padding: 4px 8px;
        border-radius: 999px;
        background: #fff4d9;
        color: #755300;
        font-size: 10px;
        font-weight: 700;
      }
      .decision-list { display: grid; gap: 9px; margin-top: 14px; }
      .decision-list article {
        display: flex;
        gap: 11px;
        padding: 11px;
        border-radius: 13px;
        background: #f6f8fd;
        border: 1px solid #e7ebf3;
      }
      .decision-item-icon { width: 27px; flex: 0 0 27px; font-size: 18px; text-align: center; }
      .decision-list h3 { margin: 0; color: #24466f; font-size: 13px; line-height: 1.35; font-weight: 800; }
      .decision-list p { margin: 2px 0 0; color: #555f6f; font-size: 13px; line-height: 1.5; }
      .decision-source {
        margin: 12px 0 0;
        padding-top: 10px;
        border-top: 1px solid #e8ebf1;
        color: #70798a;
        font-size: 11px;
        line-height: 1.5;
      }
      .travel-decision-widget.map-decision-widget {
        right: 88px;
        bottom: 132px;
      }
      @media (max-height: 650px) {
        .travel-decision-widget.map-decision-widget {
          right: 88px;
          bottom: 116px;
        }
      }
    `;
    document.head.appendChild(decisionStyle);
  }

  const routeFor = text => {
    const value = text.replace(/\s+/g, ' ').trim();
    if (/TonPao Map|หน้าแรก/.test(value)) return '/';
    if (/เริ่มสำรวจแผนที่|สำรวจบนแผนที่/.test(value) || value === 'สำรวจ' || value === 'สำรวจแผนที่' || value === 'Explore' || value === 'แผนที่') return '/map';
    if (value === 'กิจกรรม' || value === 'Events' || /กิจกรรมและเทศกาล/.test(value)) return '/events';
    if (/สร้างแผนเที่ยว|แผนเที่ยว|Itineraries/.test(value)) return '/plan/templates';
    if (/แผนของฉัน|ทริปที่บันทึก/.test(value)) return '/my-itineraries';
    if (/เกี่ยวกับเรา|เกี่ยวกับโครงการ|About/.test(value)) return '/about';
    if (/ช่วยเหลือ|คำถามที่พบบ่อย|FAQ|Help/.test(value)) return '/help';
    if (/นโยบายความเป็นส่วนตัว|Privacy/.test(value)) return '/privacy';
    if (/ข้อกำหนดการใช้งาน|Terms/.test(value)) return '/terms';
    if (value === 'โปรไฟล์') return '/my-itineraries';
    if (/ผลการค้นหา|แสดงรายการ|มุมมองรายการ/.test(value) || value === 'รายการ') return '/search';
    if (screen === 's05' && /ดูรายละเอียด/.test(value)) return '/events/umbrella-festival';
    if (screen === 's06' && /ที่จอดรถ/.test(value)) return '/events/umbrella-festival/parking';
    if (screen === 's06' && /กำหนดการ/.test(value)) return '/events/umbrella-festival/schedule';
    if (screen === 's06' && /หมู่บ้านทำร่มบ่อสร้าง/.test(value)) return '/poi/umbrella-center';
    if (screen === 's01' && /เทศกาลร่มบ่อสร้าง|เวิร์กชอปทำกระดาษสา|งานสืบสานวัฒนธรรม/.test(value)) return '/events/umbrella-festival';
    if (screen === 's04' && /ดูกิจกรรมที่จัดที่นี่/.test(value)) return '/events';
    if (screen === 's09' && /ดูรายละเอียด|เริ่ม/.test(value)) return '/plan/build';
    if (screen === 's10' && /arrow_forward|ถัดไป|สร้างแผน|ยืนยัน/.test(value)) return '/plan/result';
    if (screen === 's42' && /ดูรายละเอียด/.test(value)) return '/plan/result';
    if (screen === 's42' && /สร้างแผนการเดินทางใหม่/.test(value)) return '/plan/build';
    if (screen === 's11' && /ศูนย์หัตถกรรมร่มบ่อสร้าง|วัดพระนอนแม่ปูคา/.test(value)) return '/poi/umbrella-center';
    if (/วัดและวัฒนธรรม/.test(value)) return '/category/temples-culture';
    if (/อาหารและคาเฟ่/.test(value)) return '/category/food-cafe';
    if (/แหล่งเรียนรู้ชุมชน/.test(value)) return '/category/community-learning';
    if (/ที่พัก/.test(value)) return '/category/accommodation';
    if (/ดูรายละเอียด/.test(value)) return '/poi/umbrella-center';
    if (/หัตถกรรมและร่มบ่อสร้าง|ดูทั้งหมดในหมวด/.test(value)) return '/category/handicraft';
    return null;
  };

  document.addEventListener('click', event => {
    const control = event.target.closest('a, button, [onclick], [role="button"]');
    if (!control) return;
    // Controls inside the interactive map update map state; they are not page navigation.
    if (screen === 's02' && control.matches('[data-map-filter], [data-map-layer], [data-map-control]')) return;
    if (screen === 's05' && control.matches('[data-event-filter], [data-event-date], [data-event-select], [data-event-control]')) return;
    if (screen === 's07' && control.matches('[data-parking-control]')) return;
    // Builder choices are form controls, never category or navigation links.
    if (screen === 's10' && (control.closest('[data-interest-group], [data-duration-group], [data-transport-group], [data-constraint-group], details') || control.matches('[data-generate-itinerary]'))) return;
    const label = (control.textContent || '').replace(/\s+/g, ' ').trim();
    const ariaLabel = (control.getAttribute('aria-label') || '').trim();
    // Desktop itinerary builder validates and stores the form before routing.
    if (screen === 's10' && /แนะนำแผนการเดินทาง|สร้างแผนเที่ยวให้ฉัน/.test(label)) return;
    // Explicit routes win over label heuristics, so "กลับหน้าแรก" links (brand, error pages) go home instead of history.back().
    // Match app routes with or without a deploy prefix (e.g. GitHub Pages rewrites them to /tonpao-map-public/#/…).
    const explicit = (control.getAttribute('href') || '').match(/^(?:\/[\w.-]+)*\/#(\/[^#]*)?$/);
    if (explicit) {
      event.preventDefault();
      event.stopImmediatePropagation();
      go(explicit[1] || '/');
      return;
    }
    // "ปรับเงื่อนไข" carries a "กลับไป…" aria-label but must open the builder, not step back.
    if (screen === 's11' && control.matches('[data-edit-itinerary]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      go('/plan/build');
      return;
    }
    // Header sign-in buttons lead to the contributor login.
    if (control.closest('header') && /^(เข้าสู่ระบบ|Sign In)$/.test(label)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      go('/contributor/login');
      return;
    }
    if (/ย้อนกลับ|กลับไป/.test(label) || /กลับ/.test(ariaLabel) || ariaLabel === 'Back') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (screen === 's07' || screen === 's08') {
        go('/events/umbrella-festival');
      } else if (screen === 's06') {
        go('/events');
      } else {
        window.parent.history.back();
      }
      return;
    }
    if (/ลองอีกครั้ง|Retry/.test(label) && (screen === 's16' || screen === 's18')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      go('/');
      return;
    }
    const route = routeFor(label);
    if (!route) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    go(route);
  }, true);
})();
