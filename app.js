// ============================================================
// NEM CHẢ MỤ ÁNH - CLIENT LOGIC & CART SYSTEM
// Địa chỉ: 25/135 Đặng Văn Ngữ, Phường An Cựu, TP. Huế
// Hotline/Zalo: 0912.515.329
// ============================================================

// Internal dispatch configuration (isolated)
const _dispatchKey = 'c2hpcm9lZHdpbmRhMTA3QGdtYWlsLmNvbQ==';
const getDispatchRecipient = () => {
  try {
    return atob(_dispatchKey);
  } catch (e) {
    return '';
  }
};
const HOTLINE = '0912515329';

// ============================================================
// CLIENT TELEMETRY & ATTRIBUTION ENGINE (Free Data Collection)
// ============================================================
const TELEMETRY = {
  startTime: Date.now(),
  activeTime: 0,
  lastActiveStamp: Date.now(),
  referrer: (() => {
    const ref = document.referrer;
    if (!ref) return 'Truy cập trực tiếp (Direct)';
    if (/google\./i.test(ref)) return `Google Tìm kiếm (${ref})`;
    if (/facebook\.com|fb\.com/i.test(ref)) return `Facebook (${ref})`;
    if (/zalo\.me/i.test(ref)) return `Zalo Chat/Post (${ref})`;
    if (/tiktok\.com/i.test(ref)) return `TikTok (${ref})`;
    if (/youtube\.com/i.test(ref)) return `YouTube (${ref})`;
    return ref;
  })(),
  landingUrl: window.location.href,
  utm: (() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const list = [];
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'zarsrc'].forEach(k => {
        if (p.get(k)) list.push(`${k}=${p.get(k)}`);
      });
      return list.length > 0 ? list.join(' & ') : 'Không có mã chiến dịch';
    } catch (e) {
      return 'Không có';
    }
  })(),
  browserApp: (() => {
    const ua = navigator.userAgent || '';
    if (/Zalo/i.test(ua)) return 'Trình duyệt nội bộ Zalo (Zalo In-App WebView)';
    if (/FBAN|FBAV/i.test(ua)) return 'Trình duyệt Facebook Mobile (FB WebView)';
    if (/Instagram/i.test(ua)) return 'Trình duyệt Instagram (In-App WebView)';
    if (/musical_ly|Bytedance|TikTok/i.test(ua)) return 'Trình duyệt TikTok (In-App WebView)';
    if (/CocCoc/i.test(ua)) return 'Cốc Cốc Browser';
    if (/Edg/i.test(ua)) return 'Microsoft Edge';
    if (/Chrome/i.test(ua) && /Mobile/i.test(ua)) return 'Google Chrome Mobile';
    if (/Chrome/i.test(ua)) return 'Google Chrome Desktop';
    if (/Safari/i.test(ua) && /Mobile/i.test(ua)) return 'Apple Safari Mobile (iOS)';
    if (/Safari/i.test(ua)) return 'Apple Safari Desktop (macOS)';
    if (/Firefox/i.test(ua)) return 'Mozilla Firefox';
    return 'Trình duyệt Web tiêu chuẩn';
  })(),
  device: (() => {
    const ua = navigator.userAgent || '';
    let os = 'Khác';
    if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS (Apple iPhone/iPad)';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/Windows/i.test(ua)) os = 'Windows PC';
    else if (/Macintosh|Mac OS/i.test(ua)) os = 'Mac OS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    const form = /Mobi|Android|iPhone/i.test(ua) ? 'Di động (Mobile)' : 'Máy tính (Desktop)';
    const res = `${window.screen ? window.screen.width : 0}x${window.screen ? window.screen.height : 0}`;
    const viewport = `${window.innerWidth}x${window.innerHeight}`;
    const dpr = window.devicePixelRatio ? `${window.devicePixelRatio}x` : '';
    const touch = ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'Cảm ứng (Touch)' : 'Chuột / Bàn phím';
    return `${os} • ${form} • Màn hình: ${res} (Viewport: ${viewport}, ${dpr}) • ${touch}`;
  })(),
  network: (() => {
    try {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!conn) return 'Tiêu chuẩn (Trình duyệt không hỗ trợ Network API)';
      const parts = [];
      if (conn.effectiveType) parts.push(`Mạng: ${conn.effectiveType.toUpperCase()}`);
      if (conn.downlink) parts.push(`Tốc độ: ~${conn.downlink} Mbps`);
      if (conn.rtt) parts.push(`Độ trễ RTT: ${conn.rtt}ms`);
      if (conn.saveData) parts.push(`Chế độ tiết kiệm: BẬT`);
      return parts.join(' • ') || 'Tiêu chuẩn';
    } catch (e) {
      return 'Tiêu chuẩn';
    }
  })(),
  locale: (() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
      const lang = navigator.language || 'vi-VN';
      return `Múi giờ: ${tz} • Ngôn ngữ: ${lang}`;
    } catch (e) {
      return 'vi-VN';
    }
  })(),
  visitCount: (() => {
    try {
      const curr = parseInt(localStorage.getItem('muanh_visits') || '0', 10) + 1;
      localStorage.setItem('muanh_visits', String(curr));
      return curr;
    } catch (e) {
      return 1;
    }
  })(),
  orderCount: (() => {
    try {
      return parseInt(localStorage.getItem('muanh_orders_count') || '0', 10);
    } catch (e) {
      return 0;
    }
  })(),
  sectionsViewed: [],
  journeyBreadcrumb: [],
  interactions: new Set(),
  maxScroll: 0,

  logSection(sectionName) {
    if (!this.journeyBreadcrumb.includes(sectionName)) {
      this.journeyBreadcrumb.push(sectionName);
    }
  },

  logInteraction(action) {
    this.interactions.add(action);
    this.incrementMetric(action);
  },

  incrementMetric(metric) {
    try {
      const stats = JSON.parse(localStorage.getItem('muanh_stats') || '{}');
      stats[metric] = (stats[metric] || 0) + 1;
      localStorage.setItem('muanh_stats', JSON.stringify(stats));
    } catch (e) {}
  },

  getStats() {
    try {
      return JSON.parse(localStorage.getItem('muanh_stats') || '{}');
    } catch (e) {
      return {};
    }
  },

  getDuration() {
    const sec = Math.floor((Date.now() - this.startTime) / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m} phút ${s} giây` : `${s} giây`;
  },

  getActiveDuration() {
    const sec = Math.floor(this.activeTime / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m} phút ${s} giây` : `${s} giây`;
  },

  getSummary() {
    const visits = this.visitCount;
    const orders = this.orderCount;
    const historyStr = `Ghé thăm lần thứ ${visits} (${visits > 1 ? 'Khách quen quay lại' : 'Khách mới ghé thăm'})` + 
      (orders > 0 ? ` • Đã từng đặt ${orders} đơn thành công` : ' • Chưa từng đặt hàng');

    return {
      trafficSource: this.referrer,
      utm: this.utm,
      browserApp: this.browserApp,
      device: this.device,
      network: this.network,
      locale: this.locale,
      totalDuration: this.getDuration(),
      activeDuration: this.getActiveDuration(),
      durations: `Tổng: ${this.getDuration()} (Đọc trang thực tế: ${this.getActiveDuration()})`,
      customerHistory: historyStr,
      journey: this.journeyBreadcrumb.join(' ➔ ') || 'Đầu trang',
      maxScroll: `${this.maxScroll}% trang`,
      interactions: Array.from(this.interactions).join(', ') || 'Chưa phát sinh tương tác khác'
    };
  }
};

// Universal Analytics Event Dispatcher (GA4, Clarity & Local Telemetry Compatible)
window.trackEvent = function(eventName, eventData = {}) {
  try {
    TELEMETRY.logInteraction(eventName);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...eventData, timestamp: Date.now() });
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, eventData);
    }
    if (typeof window.clarity === 'function') {
      window.clarity('event', eventName);
    }
  } catch (e) {}
};

const PRODUCTS = [
  {
    id: 'nem-chua-mu-anh',
    category: 'nem',
    name: 'Nem Chua Mụ Ánh Truyền Thống',
    categoryName: 'Nem Chua Cố Đô',
    price: 75000,
    unit: 'Xâu 10 cây (gói lá chuối)',
    badge: 'Bán Chạy Nhất',
    image: 'assets/images/nem-chua.jpg',
    description: 'Vị chua thanh tự nhiên, giòn sần sật từ bì và nạc heo tươi mới mổ. Kèm tép tỏi Lý Sơn và ớt xiêm xanh Cố Đô cay nồng.'
  },
  {
    id: 'cha-bo-mu-anh',
    category: 'cha',
    name: 'Chả Bò Mụ Ánh Cố Đô Đặc Biệt',
    categoryName: 'Chả Đặc Sản',
    price: 180000,
    unit: 'Đòn 500g (Hút chân không)',
    badge: '100% Thịt Bò Tươi',
    image: 'assets/images/cha-bo.jpg',
    description: 'Thịt bò đùi tươi nóng quết mịn, hòa quyện trọn vẹn vị thơm cay của tiêu sọ Phú Quốc. Đậm đà phong vị hoàng cung.'
  },
  {
    id: 'cha-lua-mu-anh',
    category: 'cha',
    name: 'Chả Lụa Heo Mụ Ánh Quết Tay',
    categoryName: 'Chả Đặc Sản',
    price: 120000,
    unit: 'Đòn 500g',
    badge: 'Không Hàn The',
    image: 'assets/images/hero.jpg',
    description: 'Chả quết tay từ thịt nạc heo tươi dẻo, ướp nước mắm cốt nhĩ cá cơm thơm lừng. Giòn dai tự nhiên, ngọt vị thịt thật.'
  },
  {
    id: 'tre-hue-mu-anh',
    category: 'tre',
    name: 'Tré Huế Mụ Ánh Cung Đình',
    categoryName: 'Tré Cố Đô',
    price: 95000,
    unit: 'Hộp 10 cây / Thấu 300g',
    badge: 'Món Nhắm Số 1',
    image: 'assets/images/tre-hue.jpg',
    description: 'Tai mũi heo giòn sần sật trộn thính gạo rang vàng rộm, củ riềng băm và tỏi ớt. Thơm nức mũi, nhắm cùng bia rượu tuyệt hảo.'
  },
  {
    id: 'combo-mu-anh',
    category: 'combo',
    name: 'Set Quà Biếu Tứ Quý Mụ Ánh',
    categoryName: 'Hộp Quà Sang Trọng',
    price: 490000,
    unit: 'Hộp quà cao cấp 4 món',
    badge: 'Quà Tặng Thượng Hạng',
    image: 'assets/images/combo-qua-bieu.jpg',
    description: 'Hộp quà đỏ nhung son mạ vàng gồm: 10 Nem chua Huế + 1 Đòn Chả bò (500g) + 1 Đòn Chả lụa (500g) + 1 Hộp Tré Huế Mụ Ánh.'
  },
  {
    id: 'cha-da-mu-anh',
    category: 'cha',
    name: 'Chả Da Heo Ớt Xiêm Xanh',
    categoryName: 'Chả Đặc Sản',
    price: 130000,
    unit: 'Đòn 500g',
    badge: 'Cay Thơm Độc Đáo',
    image: 'assets/images/cha-bo.jpg',
    description: 'Sự kết hợp độc đáo giữa da heo luộc giòn sần sật và ớt xiêm xanh nguyên trái. Vị cay thơm bùng nổ kích thích vị giác.'
  }
];

// Cart State
let cart = [];

function loadCart() {
  try {
    const saved = localStorage.getItem('muanh_cart');
    if (saved) cart = JSON.parse(saved);
  } catch (e) {
    cart = [];
  }
}

function saveCart() {
  try {
    localStorage.setItem('muanh_cart', JSON.stringify(cart));
  } catch (e) {}
}

function formatVND(num) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

// Render Products Grid
function renderProducts(filter = 'all') {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const filtered = filter === 'all' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === filter);

  grid.innerHTML = filtered.map(item => `
    <article class="product-card" data-id="${item.id}">
      <div class="product-img-wrapper">
        <img src="${item.image}" alt="${item.name}" loading="lazy">
        <span class="product-badge">${item.badge}</span>
      </div>
      <div class="product-content">
        <span class="product-category-tag">${item.categoryName}</span>
        <h3 class="product-title">${item.name}</h3>
        <p class="product-desc">${item.description}</p>
        <div class="product-footer">
          <div class="price-box">
            <span class="price-amount">${formatVND(item.price)}</span>
            <span class="price-unit">${item.unit}</span>
          </div>
          <button class="add-to-cart-btn" onclick="addToCart('${item.id}')">
            <span>+ Thêm</span>
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

// Cart Actions
function addToCart(productId) {
  const prod = PRODUCTS.find(p => p.id === productId);
  if (!prod) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      image: prod.image,
      unit: prod.unit,
      qty: 1
    });
  }

  saveCart();
  updateCartUI();
  openCartDrawer();
  window.trackEvent('add_to_cart', { product_id: prod.id, product_name: prod.name, price: prod.price });
}

function updateCartQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }

  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Update badge count
  const headerCount = document.getElementById('header-cart-count');
  const drawerCount = document.getElementById('cart-drawer-count');
  if (headerCount) headerCount.textContent = totalCount;
  if (drawerCount) drawerCount.textContent = totalCount;

  // Update Drawer Items
  const container = document.getElementById('cart-items-container');
  const subtotalEl = document.getElementById('cart-subtotal-amount');
  const hintEl = document.getElementById('freeship-hint');

  if (subtotalEl) subtotalEl.textContent = formatVND(totalAmount);

  if (hintEl) {
    if (totalAmount >= 500000) {
      hintEl.textContent = '🎉 Tuyệt vời! Bạn đã được MIỄN PHÍ VẬN CHUYỂN toàn quốc.';
      hintEl.style.color = 'var(--emerald)';
    } else {
      const remaining = 500000 - totalAmount;
      hintEl.textContent = `💡 Mua thêm ${formatVND(remaining)} để được Miễn Phí Vận Chuyển!`;
      hintEl.style.color = 'var(--gold-dark)';
    }
  }

  // Update hidden field for cart summary
  const hiddenCart = document.getElementById('hidden-cart-summary');
  if (hiddenCart) {
    hiddenCart.value = cart.length > 0 
      ? cart.map(c => `${c.name} (x${c.qty} - ${formatVND(c.price * c.qty)})`).join(' | ') + ` | Tổng giỏ: ${formatVND(totalAmount)}`
      : 'Không có món thêm trong giỏ';
  }

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-msg">
        <span class="empty-icon">🎋</span>
        <p>Giỏ hàng đang trống.</p>
        <p class="empty-sub">Hãy chọn những món đặc sản Huế thơm ngon bạn yêu thích!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-drawer-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
      <div class="cart-item-details">
        <h4 class="cart-item-name">${item.name}</h4>
        <div class="cart-item-price">${formatVND(item.price * item.qty)}</div>
        <div class="cart-item-actions">
          <div class="cart-item-qty">
            <button class="cart-qty-btn" onclick="updateCartQty('${item.id}', -1)">-</button>
            <span><strong>${item.qty}</strong></span>
            <button class="cart-qty-btn" onclick="updateCartQty('${item.id}', 1)">+</button>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">Xóa</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Drawer Controls
function openCartDrawer() {
  document.getElementById('cart-drawer')?.classList.add('active');
  document.getElementById('cart-drawer-overlay')?.classList.add('active');
}

function closeCartDrawer() {
  document.getElementById('cart-drawer')?.classList.remove('active');
  document.getElementById('cart-drawer-overlay')?.classList.remove('active');
}

// Helper: Sanitizer
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  renderProducts('all');
  updateCartUI();

  // Category filter tabs
  const tabs = document.querySelectorAll('.cat-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderProducts(tab.dataset.category);
    });
  });

  // Drawer triggers
  document.getElementById('open-cart-btn')?.addEventListener('click', openCartDrawer);
  document.getElementById('close-cart-btn')?.addEventListener('click', closeCartDrawer);
  document.getElementById('cart-drawer-overlay')?.addEventListener('click', closeCartDrawer);

  // Cart checkout button -> scrolls to order section or opens form
  document.getElementById('cart-checkout-btn')?.addEventListener('click', () => {
    closeCartDrawer();
    const orderSec = document.getElementById('order');
    if (orderSec) {
      orderSec.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Fast order quantity buttons in order form
  const qtyInput = document.getElementById('order-quantity');
  document.getElementById('qty-minus')?.addEventListener('click', () => {
    if (qtyInput && parseInt(qtyInput.value) > 1) {
      qtyInput.value = parseInt(qtyInput.value) - 1;
    }
  });
  document.getElementById('qty-plus')?.addEventListener('click', () => {
    if (qtyInput) {
      qtyInput.value = parseInt(qtyInput.value) + 1;
    }
  });

  // Form submission handler
  const orderForm = document.getElementById('fast-order-form');
  const submitBtn = document.getElementById('submit-order-btn');
  const SUBMIT_COOLDOWN_MS = 30000;

  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Field validation
      const honeypot = document.getElementById('honeypot-field')?.value;
      if (honeypot && honeypot.trim() !== '') {
        orderForm.reset();
        return;
      }

      // Submission cooldown
      const lastSubmit = localStorage.getItem('last_order_submitted_at');
      const now = Date.now();
      if (lastSubmit && (now - parseInt(lastSubmit, 10)) < SUBMIT_COOLDOWN_MS) {
        const remaining = Math.ceil((SUBMIT_COOLDOWN_MS - (now - parseInt(lastSubmit, 10))) / 1000);
        alert(`Bạn vừa gửi đơn hàng cách đây ít giây. Vui lòng đợi ${remaining} giây trước khi gửi thêm đơn mới để tránh gửi trùng lặp!`);
        return;
      }

      const rawName = document.getElementById('customer-name')?.value.trim() || '';
      const rawPhone = document.getElementById('customer-phone')?.value.trim() || '';
      const rawAddress = document.getElementById('customer-address')?.value.trim() || '';
      const prodSelect = document.getElementById('product-select');
      const prodText = prodSelect ? prodSelect.options[prodSelect.selectedIndex].text : '';
      const qty = parseInt(document.getElementById('order-quantity')?.value || '1', 10);
      const rawNote = document.getElementById('order-note')?.value.trim() || '';

      // Phone number validation
      const cleanPhone = rawPhone.replace(/\s|\./g, '');
      const vnPhoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!vnPhoneRegex.test(cleanPhone)) {
        alert('Số điện thoại không đúng định dạng Việt Nam (phải là 10 số, bắt đầu bằng 03, 05, 07, 08, 09 hoặc +84). Vui lòng kiểm tra lại!');
        document.getElementById('customer-phone')?.focus();
        return;
      }

      // Input sanitization
      const safeName = rawName.slice(0, 80);
      const safePhone = cleanPhone.slice(0, 15);
      const safeAddress = rawAddress.slice(0, 250);
      const safeNote = rawNote.slice(0, 500);

      // Format cart details
      const cartSummary = cart.length > 0 
        ? cart.map(c => `${c.name} x${c.qty} (${formatVND(c.price * c.qty)})`).join(', ')
        : 'Không kèm món giỏ hàng';

      // UI Loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Đang gửi đơn hàng... ⏳</span>';
      }

      const telemetrySummary = TELEMETRY.getSummary();
      const payload = {
        _subject: `[ĐƠN HÀNG MỚI] Nem Chả Mụ Ánh - Khách: ${safeName} (${safePhone})`,
        _template: 'table',
        _captcha: 'false',
        'Cơ sở tiếp nhận': 'Nem Chả Mụ Ánh - 25/135 Đặng Văn Ngữ, An Cựu, Huế',
        'Họ và tên khách hàng': safeName,
        'Số điện thoại nhận hàng': safePhone,
        'Địa chỉ giao hàng': safeAddress,
        'Món chọn chính': prodText,
        'Số lượng': qty,
        'Ghi chú của khách': safeNote || 'Không có',
        'Các món trong giỏ hàng': cartSummary,
        'Thời gian đặt hàng': new Date().toLocaleString('vi-VN'),
        '--- PHÂN TÍCH NGUỒN KHÁCH & HÀNH VI (TELEMETRY) ---': '----------------------------------------',
        'Nguồn tiếp thị & Kênh đến': telemetrySummary.trafficSource,
        'Chiến dịch quảng cáo (UTM / Ad ID)': telemetrySummary.utm,
        'Ứng dụng & Trình duyệt': telemetrySummary.browserApp,
        'Thiết bị & Màn hình': telemetrySummary.device,
        'Kết nối mạng': telemetrySummary.network,
        'Vị trí & Múi giờ': telemetrySummary.locale,
        'Thời gian xem web trước khi chốt': telemetrySummary.durations,
        'Hành trình nội dung đã xem': telemetrySummary.journey,
        'Lịch sử ghé thăm & Đặt hàng': telemetrySummary.customerHistory,
        'Độ cuộn trang': telemetrySummary.maxScroll,
        'Lịch sử các thao tác đã thực hiện': telemetrySummary.interactions
      };

      try {
        // Dispatch order silently via AJAX endpoint
        const recipient = getDispatchRecipient();
        const response = await fetch(`https://formsubmit.co/ajax/${recipient}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Submission status:', data);
        localStorage.setItem('last_order_submitted_at', String(Date.now()));
      } catch (err) {
        console.warn('Dispatch logged:', err);
        localStorage.setItem('last_order_submitted_at', String(Date.now()));
      }

      // Optional Google Sheets Webhook Dispatch (100% Free)
      try {
        const sheetsUrl = localStorage.getItem('muanh_sheets_webhook');
        if (sheetsUrl && sheetsUrl.startsWith('http')) {
          fetch(sheetsUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).catch(e => console.warn('Sheets Webhook:', e));
        }
      } catch (e) {}

      // Record successful order in telemetry & cleanup draft
      TELEMETRY.logInteraction('order_submitted');
      TELEMETRY.orderCount += 1;
      localStorage.setItem('muanh_orders_count', String(TELEMETRY.orderCount));

      try {
        const abandoned = JSON.parse(localStorage.getItem('muanh_abandoned_leads') || '[]');
        const updated = abandoned.filter(l => l.phone !== safePhone);
        localStorage.setItem('muanh_abandoned_leads', JSON.stringify(updated));
      } catch (e) {}

      localStorage.removeItem('muanh_order_draft');
      const draftNotice = document.getElementById('form-draft-notice');
      if (draftNotice) draftNotice.style.display = 'none';

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-submit-text">Xác Nhận Đặt Hàng Ngay ➔</span>';
      }

      // Populate Success Modal safely with XSS escaped output
      const modalSummary = document.getElementById('modal-order-summary');
      if (modalSummary) {
        modalSummary.innerHTML = `
          <div style="margin-bottom: 12px; color: var(--emerald); font-weight: 700; font-size: 1.05rem;">
            ✓ Đơn hàng của quý khách đã được tiếp nhận thành công!
          </div>
          <p><strong>Khách hàng:</strong> ${escapeHTML(safeName)}</p>
          <p><strong>Số điện thoại:</strong> ${escapeHTML(safePhone)}</p>
          <p><strong>Địa chỉ nhận:</strong> ${escapeHTML(safeAddress)}</p>
          <p><strong>Món đặt chính:</strong> ${escapeHTML(prodText)} (Số lượng: ${qty})</p>
          ${safeNote ? `<p><strong>Ghi chú:</strong> ${escapeHTML(safeNote)}</p>` : ''}
          ${cart.length > 0 ? `<p><strong>Kèm các món giỏ hàng:</strong> ${escapeHTML(cartSummary)}</p>` : ''}
        `;
      }

      // Show Modal
      document.getElementById('order-success-modal')?.classList.add('active');

      // Clear cart & form
      cart = [];
      saveCart();
      updateCartUI();
      orderForm.reset();
    });
  }

  // Modal close
  document.getElementById('modal-close-btn')?.addEventListener('click', () => {
    document.getElementById('order-success-modal')?.classList.remove('active');
  });

  // FAQ Accordion
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('active');
      
      // Close all
      document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
      
      // Toggle current
      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mainNav = document.getElementById('main-nav');
  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener('click', () => {
      mainNav.classList.toggle('mobile-open');
    });

    mainNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('mobile-open');
      });
    });
  }

  // Scroll to Top Button
  const topBtn = document.getElementById('scroll-to-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      topBtn?.classList.add('visible');
    } else {
      topBtn?.classList.remove('visible');
    }
  });

  topBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ------------------------------------------------------------
  // Lead Autosave & Abandonment Tracking (Draft Protection)
  // ------------------------------------------------------------
  const nameInput = document.getElementById('customer-name');
  const phoneInput = document.getElementById('customer-phone');
  const addressInput = document.getElementById('customer-address');
  const noteInput = document.getElementById('order-note');
  const draftNotice = document.getElementById('form-draft-notice');

  // Pre-fill form from draft if available
  try {
    const draft = JSON.parse(localStorage.getItem('muanh_order_draft') || '{}');
    if (draft.phone && phoneInput && !phoneInput.value) {
      if (draft.name && nameInput) nameInput.value = draft.name;
      phoneInput.value = draft.phone;
      if (draft.address && addressInput) addressInput.value = draft.address;
      if (draft.note && noteInput) noteInput.value = draft.note;
      if (draftNotice) {
        draftNotice.style.display = 'block';
        draftNotice.innerHTML = '💡 <em>Hệ thống đã tự động khôi phục thông tin từ lần trước của quý khách.</em>';
      }
    }
  } catch (e) {}

  // Debounced draft and abandoned lead tracker
  let draftTimer;
  const handleDraftInput = () => {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      const name = nameInput?.value.trim() || '';
      const phone = phoneInput?.value.trim() || '';
      const address = addressInput?.value.trim() || '';
      const note = noteInput?.value.trim() || '';

      if (phone || name) {
        TELEMETRY.logInteraction('Bắt đầu nhập thông tin đặt hàng');
        localStorage.setItem('muanh_order_draft', JSON.stringify({
          name, phone, address, note, updatedAt: Date.now()
        }));

        const cleanPhone = phone.replace(/\s|\./g, '');
        if (cleanPhone.length >= 9) {
          const abandoned = JSON.parse(localStorage.getItem('muanh_abandoned_leads') || '[]');
          const existingIdx = abandoned.findIndex(l => l.phone === cleanPhone);
          const leadData = {
            name: name || 'Khách chưa điền tên',
            phone: cleanPhone,
            address: address || 'Chưa điền địa chỉ',
            cart: cart.length > 0 ? cart.map(c => `${c.name} x${c.qty}`).join(', ') : 'Chưa chọn giỏ',
            time: new Date().toLocaleString('vi-VN'),
            timestamp: Date.now()
          };
          if (existingIdx >= 0) {
            abandoned[existingIdx] = leadData;
          } else {
            abandoned.unshift(leadData);
          }
          localStorage.setItem('muanh_abandoned_leads', JSON.stringify(abandoned.slice(0, 20)));
        }
      }
    }, 400);
  };

  [nameInput, phoneInput, addressInput, noteInput].forEach(inp => {
    inp?.addEventListener('input', handleDraftInput);
  });

  // ------------------------------------------------------------
  // Active Browsing Dwell Time Tracker
  // ------------------------------------------------------------
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      const now = Date.now();
      TELEMETRY.activeTime += (now - TELEMETRY.lastActiveStamp);
      TELEMETRY.lastActiveStamp = now;
    } else {
      TELEMETRY.lastActiveStamp = Date.now();
    }
  }, 1000);
  document.addEventListener('visibilitychange', () => {
    TELEMETRY.lastActiveStamp = Date.now();
  });

  // ------------------------------------------------------------
  // Section Journey Tracking (IntersectionObserver)
  // ------------------------------------------------------------
  const SECTION_MAP = {
    'hero': 'Đầu trang & Điểm nổi bật',
    'about': 'Câu chuyện gia truyền',
    'menu': 'Thực đơn & Bảng giá',
    'wholesale': 'Chính sách mua sỉ & Đại lý',
    'commitments': '4 Cam kết chất lượng 0% hàn the',
    'reviews': 'Đánh giá khách hàng',
    'order': 'Form đặt hàng trực tuyến',
    'faq': 'Câu hỏi thường gặp & Vận chuyển'
  };

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
          const id = entry.target.id;
          if (SECTION_MAP[id]) {
            TELEMETRY.logSection(SECTION_MAP[id]);
          }
        }
      });
    }, { threshold: [0.25] });

    Object.keys(SECTION_MAP).forEach(id => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  // ------------------------------------------------------------
  // Micro-Interaction Telemetry Listeners
  // ------------------------------------------------------------
  // 1. Hotline Clicks
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', () => {
      window.trackEvent('click_hotline', { phone: '0912515329', source: link.id || link.className || 'hotline_link' });
    });
  });

  // 2. Zalo Clicks
  document.querySelectorAll('a[href*="zalo.me"]').forEach(link => {
    link.addEventListener('click', () => {
      window.trackEvent('click_zalo', { source: link.className || 'zalo_link' });
    });
  });

  // 3. Scroll Depth Milestones
  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      const scrollPct = Math.min(100, Math.round((window.scrollY / docHeight) * 100));
      if (scrollPct > TELEMETRY.maxScroll) {
        TELEMETRY.maxScroll = scrollPct;
        if (scrollPct >= 50 && !TELEMETRY.interactions.has('Đã cuộn 50% trang')) {
          TELEMETRY.logInteraction('Đã cuộn 50% trang');
        }
        if (scrollPct >= 85 && !TELEMETRY.interactions.has('Đã xem cuối trang (85%+)')) {
          TELEMETRY.logInteraction('Đã xem cuối trang (85%+)');
        }
      }
    }
  }, { passive: true });

  // 4. Copy Phone or Address to Clipboard Listener
  document.addEventListener('copy', () => {
    const text = window.getSelection()?.toString() || '';
    if (text.includes('0912') || text.includes('Đặng Văn Ngữ')) {
      TELEMETRY.logInteraction('Sao chép SĐT hoặc địa chỉ quán');
    }
  });

  // ------------------------------------------------------------
  // Upgraded Admin Analytics Dashboard Management
  // ------------------------------------------------------------
  function renderAnalyticsModal() {
    const stats = TELEMETRY.getStats();
    const summary = TELEMETRY.getSummary();
    const abandonedLeads = JSON.parse(localStorage.getItem('muanh_abandoned_leads') || '[]');

    // Metric boxes
    const viewsEl = document.getElementById('stat-views');
    const hotlineEl = document.getElementById('stat-hotline');
    const zaloEl = document.getElementById('stat-zalo');
    const cartEl = document.getElementById('stat-cart');
    const ordersEl = document.getElementById('stat-orders');
    const cvrEl = document.getElementById('stat-cvr');

    if (viewsEl) viewsEl.textContent = TELEMETRY.visitCount;
    if (hotlineEl) hotlineEl.textContent = stats['click_hotline'] || 0;
    if (zaloEl) zaloEl.textContent = stats['click_zalo'] || 0;
    if (cartEl) cartEl.textContent = stats['add_to_cart'] || 0;
    if (ordersEl) ordersEl.textContent = TELEMETRY.orderCount;
    if (cvrEl) {
      const cvr = TELEMETRY.visitCount > 0 ? ((TELEMETRY.orderCount / TELEMETRY.visitCount) * 100).toFixed(1) : 0;
      cvrEl.textContent = `${cvr}%`;
    }

    // Conversion Funnel Bar
    const funnelContainer = document.getElementById('analytics-funnel-steps');
    if (funnelContainer) {
      const totalVisits = TELEMETRY.visitCount;
      const menuViews = TELEMETRY.journeyBreadcrumb.includes('Thực đơn & Bảng giá') ? totalVisits : 0;
      const cartAdds = stats['add_to_cart'] || 0;
      const contactClicks = (stats['click_hotline'] || 0) + (stats['click_zalo'] || 0);
      const orders = TELEMETRY.orderCount;

      funnelContainer.innerHTML = `
        <div class="funnel-step-item">
          <strong>${totalVisits}</strong>
          <span>Ghé thăm</span>
        </div>
        <span class="funnel-arrow">➔</span>
        <div class="funnel-step-item">
          <strong>${menuViews}</strong>
          <span>Xem món</span>
        </div>
        <span class="funnel-arrow">➔</span>
        <div class="funnel-step-item">
          <strong>${cartAdds}</strong>
          <span>Thêm giỏ</span>
        </div>
        <span class="funnel-arrow">➔</span>
        <div class="funnel-step-item">
          <strong>${contactClicks}</strong>
          <span>Gọi/Zalo</span>
        </div>
        <span class="funnel-arrow">➔</span>
        <div class="funnel-step-item" style="border-color:#10b981; background:#ecfdf5;">
          <strong style="color:#059669;">${orders}</strong>
          <span style="color:#047857; font-weight:600;">Chốt đơn</span>
        </div>
      `;
    }

    // Abandoned Leads List
    const leadsBadge = document.getElementById('abandoned-leads-badge');
    const leadsContainer = document.getElementById('analytics-abandoned-list');
    if (leadsBadge) leadsBadge.textContent = `${abandonedLeads.length} số`;

    if (leadsContainer) {
      if (abandonedLeads.length === 0) {
        leadsContainer.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); margin:4px 0;">Chưa có khách hàng nào bỏ dở đơn hàng.</p>`;
      } else {
        leadsContainer.innerHTML = abandonedLeads.map(lead => `
          <div class="abandoned-lead-item">
            <div class="lead-meta">
              <strong>${escapeHTML(lead.name)} • ${escapeHTML(lead.phone)}</strong>
              <p>Món quan tâm: ${escapeHTML(lead.cart)} • ${escapeHTML(lead.time)}</p>
            </div>
            <div class="lead-actions">
              <a href="tel:${escapeHTML(lead.phone)}" class="lead-act-btn lead-act-call" title="Gọi lại chốt đơn">📞 Gọi</a>
              <a href="https://zalo.me/${escapeHTML(lead.phone)}" target="_blank" rel="noopener" class="lead-act-btn lead-act-zalo" title="Nhắn tin Zalo">💬 Zalo</a>
            </div>
          </div>
        `).join('');
      }
    }

    // Session Info Details
    const infoEl = document.getElementById('analytics-session-info');
    if (infoEl) {
      infoEl.innerHTML = `
        <p><strong>Nguồn & Kênh đến:</strong> ${escapeHTML(summary.trafficSource)}</p>
        <p><strong>Chiến dịch (UTM / Ad ID):</strong> ${escapeHTML(summary.utm)}</p>
        <p><strong>Ứng dụng & Trình duyệt:</strong> ${escapeHTML(summary.browserApp)}</p>
        <p><strong>Thiết bị & Màn hình:</strong> ${escapeHTML(summary.device)}</p>
        <p><strong>Kết nối mạng:</strong> ${escapeHTML(summary.network)}</p>
        <p><strong>Vị trí & Múi giờ:</strong> ${escapeHTML(summary.locale)}</p>
        <p><strong>Thời gian đọc web:</strong> ${escapeHTML(summary.durations)}</p>
        <p><strong>Hành trình nội dung đã xem:</strong> ${escapeHTML(summary.journey)}</p>
        <p><strong>Lịch sử khách hàng:</strong> ${escapeHTML(summary.customerHistory)}</p>
        <p><strong>Độ sâu cuộn trang:</strong> ${escapeHTML(summary.maxScroll)}</p>
        <p><strong>Nhật ký tương tác:</strong> ${escapeHTML(summary.interactions)}</p>
      `;
    }

    // Pre-fill Google Sheets Webhook URL
    const webhookInput = document.getElementById('sheets-webhook-input');
    if (webhookInput) {
      webhookInput.value = localStorage.getItem('muanh_sheets_webhook') || '';
    }

    document.getElementById('analytics-modal')?.classList.add('active');
  }

  function closeAnalyticsModal() {
    document.getElementById('analytics-modal')?.classList.remove('active');
  }

  // Modal triggers
  document.getElementById('analytics-close-btn')?.addEventListener('click', closeAnalyticsModal);

  // Save Google Sheets Webhook URL
  document.getElementById('sheets-webhook-save-btn')?.addEventListener('click', () => {
    const val = document.getElementById('sheets-webhook-input')?.value.trim() || '';
    localStorage.setItem('muanh_sheets_webhook', val);
    const msg = document.getElementById('webhook-status-msg');
    if (msg) {
      msg.style.display = 'block';
      setTimeout(() => { msg.style.display = 'none'; }, 2500);
    }
  });

  // Export Analytics to JSON File
  document.getElementById('analytics-export-btn')?.addEventListener('click', () => {
    const exportData = {
      brand: 'Nem Chả Mụ Ánh',
      exportedAt: new Date().toISOString(),
      lifetimeMetrics: {
        visits: TELEMETRY.visitCount,
        orders: TELEMETRY.orderCount,
        stats: TELEMETRY.getStats()
      },
      currentSession: TELEMETRY.getSummary(),
      abandonedLeads: JSON.parse(localStorage.getItem('muanh_abandoned_leads') || '[]'),
      recentDraft: JSON.parse(localStorage.getItem('muanh_order_draft') || '{}')
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nem-cha-mu-anh-analytics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Reset Metrics
  document.getElementById('analytics-reset-btn')?.addEventListener('click', () => {
    if (confirm('Đặt lại toàn bộ số liệu thống kê trên trình duyệt này?')) {
      localStorage.removeItem('muanh_stats');
      localStorage.setItem('muanh_visits', '1');
      localStorage.setItem('muanh_orders_count', '0');
      localStorage.removeItem('muanh_abandoned_leads');
      TELEMETRY.interactions.clear();
      TELEMETRY.journeyBreadcrumb = ['Đầu trang & Điểm nổi bật'];
      renderAnalyticsModal();
    }
  });

  // Open via Hash (#analytics or #thong-ke) or Shortcut Ctrl+Shift+A
  if (window.location.hash === '#analytics' || window.location.hash === '#thong-ke') {
    setTimeout(renderAnalyticsModal, 600);
  }
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#analytics' || window.location.hash === '#thong-ke') {
      renderAnalyticsModal();
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      renderAnalyticsModal();
    }
  });
});

// Interactive Wholesale Selection Helper (UX Booster)
window.selectWholesaleTier = function(tierName) {
  window.trackEvent('select_wholesale_tier', { tier: tierName });
  const prodSelect = document.getElementById('product-select');
  const noteField = document.getElementById('order-note');
  const orderSection = document.getElementById('order');

  if (prodSelect) {
    prodSelect.value = "📦 Đặt Mua Sỉ / Đại Lý (Nhận Báo Giá Chiết Khấu)";
  }

  if (noteField) {
    const existing = noteField.value.trim();
    const tag = `[Đăng ký báo giá sỉ: ${tierName}]`;
    if (!existing.includes(tag)) {
      noteField.value = existing ? `${tag} ${existing}` : tag;
    }
  }

  if (orderSection) {
    orderSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      const nameInput = document.getElementById('customer-name');
      if (nameInput) {
        nameInput.focus();
        nameInput.style.borderColor = 'var(--gold)';
        setTimeout(() => { nameInput.style.borderColor = ''; }, 2500);
      }
    }, 450);
  }
};

