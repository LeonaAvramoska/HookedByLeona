/* Shared script for products, cart and order pages using localStorage cart */

(function () {
  // Utility: get cart from localStorage
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('cart')) || [];
    } catch (e) {
      return [];
    }
  }

  // Utility: save cart
  function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  // Format cart to readable text for email
  function cartToText(cart) {
    if (!cart || cart.length === 0) return 'Кошничката е празна.';
    let lines = [];
    let total = 0;
    cart.forEach((it, idx) => {
      const lineTotal = it.price * (it.quantity || 1);
      total += lineTotal;
      lines.push(`${idx + 1}. ${it.name} — ${it.price} ден x ${it.quantity} = ${lineTotal} ден`);
    });
    lines.push('---------------------------');
    lines.push(`Вкупно: ${total} ден`);
    return lines.join('\n');
  }

  // Calculate total
  function cartTotal(cart) {
    return cart.reduce((s, it) => s + (it.price * (it.quantity || 1)), 0);
  }

  // ---------- PRODUCTS PAGE: add-to-cart, sorting, search ----------
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.box-container');
    const sortPriceBtn = document.getElementById('sortPriceBtn');
    const sortNameBtn = document.getElementById('sortNameBtn');
    const searchInput = document.getElementById('searchInput');

    let priceAscending = true;
    let nameAscending = true;

    // Attach add-to-cart handlers (if on products page)
    document.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        const price = parseInt(btn.dataset.price, 10);

        let cart = getCart();
        const existing = cart.find(i => i.name === name);
        if (existing) {
          existing.quantity = (existing.quantity || 1) + 1;
        } else {
          cart.push({ name, price, quantity: 1, image: findImageForProduct(btn) });
        }
        saveCart(cart);
        alert('Додадено во кошничка!');
      });
    });

    // Sorting
    if (sortPriceBtn) {
      sortPriceBtn.addEventListener('click', () => {
        const boxes = Array.from(container.querySelectorAll('.box'));
        boxes.sort((a, b) => {
          const priceA = parseInt(a.querySelector('.price').dataset.price, 10);
          const priceB = parseInt(b.querySelector('.price').dataset.price, 10);
          return priceAscending ? priceA - priceB : priceB - priceA;
        });
        priceAscending = !priceAscending;
        boxes.forEach(b => container.appendChild(b));
      });
    }

    if (sortNameBtn) {
      sortNameBtn.addEventListener('click', () => {
        const boxes = Array.from(container.querySelectorAll('.box'));
        boxes.sort((a, b) => {
          const nameA = a.querySelector('h3').textContent.trim();
          const nameB = b.querySelector('h3').textContent.trim();
          return nameAscending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });
        nameAscending = !nameAscending;
        boxes.forEach(b => container.appendChild(b));
      });
    }

    // Live search
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        container.querySelectorAll('.box').forEach(box => {
          const name = box.querySelector('h3').textContent.toLowerCase();
          box.style.display = name.includes(q) ? 'inline-block' : 'none';
        });
      });
    }

    // If this is cart page, render the cart
    if (document.getElementById('cartItems')) {
      renderCartPage();
      const clearBtn = document.getElementById('clearCartBtn');
      clearBtn && clearBtn.addEventListener('click', () => {
        if (confirm('Дали сте сигурни дека сакате да ја исчистите кошничката?')) {
          localStorage.removeItem('cart');
          renderCartPage();
        }
      });
    }

    // If this is order page, populate summary & hidden field
    if (document.getElementById('orderForm')) {
      populateOrderForm();
    }
  });

  // Attempt to find the image url of the product by traversing DOM from button
  function findImageForProduct(btn) {
    try {
      const box = btn.closest('.box');
      const img = box.querySelector('img');
      return img ? img.getAttribute('src') : '';
    } catch (e) {
      return '';
    }
  }

  // Render cart page items
  function renderCartPage() {
    const cart = getCart();
    const container = document.getElementById('cartItems');
    container.innerHTML = '';

    if (!cart || cart.length === 0) {
      container.innerHTML = '<p>Кошничката е празна.</p>';
      document.getElementById('cartTotal').textContent = '0';
      return;
    }

    cart.forEach((item, idx) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <div class="left">
          ${ item.image ? `<img src="${item.image}" alt="${item.name}">` : '' }
          <div class="meta">
            <div class="name">${item.name}</div>
            <div class="price">${item.price} денари</div>
          </div>
        </div>
        <div class="right">
          <div class="qty">
            <button class="decrease" data-idx="${idx}">-</button>
            <span class="count">${item.quantity}</span>
            <button class="increase" data-idx="${idx}">+</button>
          </div>
          <div style="margin-top:8px;">
            <button class="remove-btn" data-idx="${idx}">Отстрани</button>
          </div>
        </div>
      `;
      container.appendChild(itemEl);
    });

    document.querySelectorAll('.increase').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.idx, 10);
        const cart = getCart();
        cart[idx].quantity = (cart[idx].quantity || 1) + 1;
        saveCart(cart);
        renderCartPage();
      });
    });

    document.querySelectorAll('.decrease').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.idx, 10);
        const cart = getCart();
        cart[idx].quantity = (cart[idx].quantity || 1) - 1;
        if (cart[idx].quantity <= 0) {
          if (confirm('Дали сакате да го отстраните производот?')) {
            cart.splice(idx, 1);
          } else {
            cart[idx].quantity = 1;
          }
        }
        saveCart(cart);
        renderCartPage();
      });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const cart = getCart();
        if (confirm('Дали сте сигурни дека сакате да го отстраните овој производ?')) {
          cart.splice(idx, 1);
          saveCart(cart);
          renderCartPage();
        }
      });
    });

    document.getElementById('cartTotal').textContent = String(cartTotal(cart));
  }

  // Populate order form summary and hidden field
  window.populateOrderForm = function populateOrderForm() {
    const cart = getCart();
    const summaryBox = document.getElementById('summaryBox');
    const hidden = document.getElementById('order_details');

    if (!summaryBox || !hidden) return;

    summaryBox.textContent = cartToText(cart);
    hidden.value = cartToText(cart);

    // also show a nicer summary with counts (if you want)
    // ensure it updates if cart changes while on order page
    // observe localStorage changes? simplest: refresh every 2s (lightweight)
    // but we'll also attach a visibilitychange to refresh when page becomes visible
    document.addEventListener('visibilitychange', () => {
      const c = getCart();
      summaryBox.textContent = cartToText(c);
      hidden.value = cartToText(c);
    });

    // If user tries to submit, update hidden field again
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
      orderForm.addEventListener('submit', () => {
        const c = getCart();
        document.getElementById('order_details').value = cartToText(c);
        // also append a simple timestamp
        const ts = new Date().toLocaleString();
        document.getElementById('order_details').value += `\n\nВреме на нарачката: ${ts}`;
        // FormSubmit will handle the POST
      });
    }
  };

})();
// Category filter functionality
const categoryButtons = document.querySelectorAll('.category-btn');
const productBoxes = document.querySelectorAll('.box');

categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active from all buttons
        categoryButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.dataset.category;

        productBoxes.forEach(box => {
            if (category === 'all' || box.dataset.category === category) {
                box.style.display = 'inline-block';
            } else {
                box.style.display = 'none';
            }
        });
    });
});
