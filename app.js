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

      const payload = {
        _subject: `[ĐƠN HÀNG MỚI] Nem Chả Mụ Ánh - Khách: ${safeName} (${safePhone})`,
        _template: 'table',
        _captcha: 'false',
        'Cơ sở': 'Nem Chả Mụ Ánh - 25/135 Đặng Văn Ngữ, An Cựu, Huế',
        'Họ và tên khách hàng': safeName,
        'Số điện thoại nhận hàng': safePhone,
        'Địa chỉ giao hàng': safeAddress,
        'Món chọn chính': prodText,
        'Số lượng': qty,
        'Ghi chú của khách': safeNote || 'Không có',
        'Các món trong giỏ hàng': cartSummary,
        'Thời gian đặt': new Date().toLocaleString('vi-VN')
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
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span class="btn-submit-text">Xác Nhận Đặt Hàng Ngay ➔</span>';
        }
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
});

// Interactive Wholesale Selection Helper (UX Booster)
window.selectWholesaleTier = function(tierName) {
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

