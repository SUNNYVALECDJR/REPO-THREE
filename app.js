const products = [
  {
    id: 1,
    name: 'Bananas',
    category: 'Produce',
    description: 'Organic bunch (6 ct)',
    price: 2.49,
    inStock: true,
    image:
      'https://images.unsplash.com/photo-1574226516831-e1dff420e8f8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    name: 'Whole Milk',
    category: 'Dairy',
    description: '1 gallon, vitamin D fortified',
    price: 4.29,
    inStock: true,
    image:
      'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    name: 'Sourdough Bread',
    category: 'Bakery',
    description: 'Freshly baked artisan loaf',
    price: 5.5,
    inStock: false,
    image:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    name: 'Ground Coffee',
    category: 'Pantry',
    description: 'Medium roast, 12 oz',
    price: 8.99,
    inStock: true,
    image:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5,
    name: 'Chicken Breast',
    category: 'Meat',
    description: 'Boneless skinless, 1 lb',
    price: 7.25,
    inStock: true,
    image:
      'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 6,
    name: 'Frozen Pizza',
    category: 'Frozen',
    description: 'Four cheese, thin crust',
    price: 6.75,
    inStock: true,
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 7,
    name: 'Baby Spinach',
    category: 'Produce',
    description: 'Pre-washed, 5 oz clamshell',
    price: 3.49,
    inStock: true,
    image:
      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 8,
    name: 'Greek Yogurt',
    category: 'Dairy',
    description: 'Plain, 32 oz tub',
    price: 4.99,
    inStock: true,
    image:
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
  },
];

const cart = new Map();
const fees = {
  delivery: 3.99,
  service: 1.25,
  freeDeliveryThreshold: 35,
};

const promoCodes = {
  SAVE10: 0.1,
  WELCOME5: 0.05,
};

let activePromoCode = null;

const ui = {
  catalog: document.querySelector('#catalog'),
  catalogSummary: document.querySelector('#catalog-summary'),
  template: document.querySelector('#product-template'),
  search: document.querySelector('#search'),
  categoryFilter: document.querySelector('#category-filter'),
  inStockOnly: document.querySelector('#in-stock-only'),
  resetFilters: document.querySelector('#reset-filters'),
  cartItems: document.querySelector('#cart-items'),
  emptyCart: document.querySelector('#empty-cart'),
  subtotal: document.querySelector('#subtotal'),
  grandTotal: document.querySelector('#grand-total'),
  itemCount: document.querySelector('#item-count'),
  deliveryFee: document.querySelector('#delivery-fee'),
  serviceFee: document.querySelector('#service-fee'),
  discountRow: document.querySelector('#discount-row'),
  discount: document.querySelector('#discount'),
  promo: document.querySelector('#promo'),
  applyPromo: document.querySelector('#apply-promo'),
  promoStatus: document.querySelector('#promo-status'),
  checkoutBtn: document.querySelector('#checkout-btn'),
  orderStatus: document.querySelector('#order-status'),
  slot: document.querySelector('#slot'),
};

function money(value) {
  return `$${value.toFixed(2)}`;
}

function hydrateCategoryFilter() {
  const categories = [...new Set(products.map((product) => product.category))].sort();
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    ui.categoryFilter.append(option);
  });
}

function getVisibleProducts() {
  const search = ui.search.value.trim().toLowerCase();
  const selectedCategory = ui.categoryFilter.value;
  const inStockOnly = ui.inStockOnly.checked;

  return products.filter((product) => {
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStock = !inStockOnly || product.inStock;
    return matchesSearch && matchesCategory && matchesStock;
  });
}

function renderCatalog() {
  const visibleProducts = getVisibleProducts();
  ui.catalog.innerHTML = '';

  if (!visibleProducts.length) {
    ui.catalog.innerHTML = '<p class="empty-state">No products match your filters.</p>';
    ui.catalogSummary.textContent = 'Showing 0 items.';
    return;
  }

  const fragment = document.createDocumentFragment();
  visibleProducts.forEach((product) => {
    const node = ui.template.content.cloneNode(true);
    const img = node.querySelector('img');
    const badges = node.querySelector('.badges');
    const addButton = node.querySelector('button');

    img.src = product.image;
    img.alt = product.name;

    node.querySelector('h3').textContent = product.name;
    node.querySelector('.category').textContent = product.category;
    node.querySelector('.description').textContent = product.description;
    node.querySelector('.price').textContent = money(product.price);

    if (!product.inStock) {
      const badge = document.createElement('span');
      badge.className = 'badge out';
      badge.textContent = 'Out of stock';
      badges.append(badge);
      addButton.disabled = true;
      addButton.textContent = 'Unavailable';
    } else {
      const badge = document.createElement('span');
      badge.className = 'badge in';
      badge.textContent = 'In stock';
      badges.append(badge);
      addButton.addEventListener('click', () => addItem(product.id));
    }

    fragment.append(node);
  });

  ui.catalog.append(fragment);
  ui.catalogSummary.textContent = `Showing ${visibleProducts.length} of ${products.length} items.`;
}

function addItem(productId) {
  const qty = cart.get(productId) || 0;
  cart.set(productId, qty + 1);
  ui.orderStatus.textContent = '';
  renderCart();
}

function changeQty(productId, delta) {
  const current = cart.get(productId);
  if (!current) return;

  const next = current + delta;
  if (next <= 0) {
    cart.delete(productId);
  } else {
    cart.set(productId, next);
  }
  renderCart();
}

function getCartMetrics() {
  let itemCount = 0;
  let subtotal = 0;

  cart.forEach((qty, productId) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    itemCount += qty;
    subtotal += product.price * qty;
  });

  const delivery = subtotal >= fees.freeDeliveryThreshold ? 0 : fees.delivery;
  const promoRate = activePromoCode ? promoCodes[activePromoCode] : 0;
  const discount = subtotal * promoRate;
  const total = subtotal + delivery + fees.service - discount;

  return { itemCount, subtotal, delivery, discount, total };
}

function renderCart() {
  ui.cartItems.innerHTML = '';
  const entries = [...cart.entries()];

  entries.forEach(([productId, qty]) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    const item = document.createElement('li');
    item.className = 'cart-item';
    item.innerHTML = `
      <div>
        <strong>${product.name}</strong><br />
        <small>${money(product.price)} each</small>
      </div>
      <div class="quantity-controls">
        <button aria-label="Decrease ${product.name}">-</button>
        <span>${qty}</span>
        <button aria-label="Increase ${product.name}">+</button>
      </div>
    `;

    const [decreaseBtn, increaseBtn] = item.querySelectorAll('button');
    decreaseBtn.addEventListener('click', () => changeQty(productId, -1));
    increaseBtn.addEventListener('click', () => changeQty(productId, 1));

    ui.cartItems.append(item);
  });

  const { itemCount, subtotal, delivery, discount, total } = getCartMetrics();
  ui.itemCount.textContent = String(itemCount);
  ui.subtotal.textContent = money(subtotal);
  ui.deliveryFee.textContent = delivery === 0 ? 'FREE' : money(delivery);
  ui.serviceFee.textContent = money(fees.service);
  ui.discountRow.classList.toggle('hidden', discount <= 0);
  ui.discount.textContent = `-${money(discount)}`;
  ui.grandTotal.textContent = money(Math.max(total, 0));

  ui.emptyCart.style.display = entries.length ? 'none' : 'block';
  ui.checkoutBtn.disabled = entries.length === 0;
}

function applyPromoCode() {
  const code = ui.promo.value.trim().toUpperCase();
  if (!code) {
    ui.promoStatus.textContent = 'Enter a promo code to apply.';
    return;
  }

  if (!promoCodes[code]) {
    activePromoCode = null;
    ui.promoStatus.textContent = 'Invalid promo code.';
    renderCart();
    return;
  }

  activePromoCode = code;
  ui.promoStatus.textContent = `${code} applied.`;
  renderCart();
}

function checkout() {
  const { itemCount, subtotal, total } = getCartMetrics();
  if (!itemCount) return;

  const slotText = ui.slot.options[ui.slot.selectedIndex].text;
  const promoText = activePromoCode ? ` Promo code ${activePromoCode} saved you ${ui.discount.textContent}.` : '';
  ui.orderStatus.textContent = `Order confirmed! ${itemCount} item${
    itemCount > 1 ? 's' : ''
  } arriving ${slotText.toLowerCase()}. Subtotal ${money(subtotal)}, total ${money(total)}.${promoText}`;

  cart.clear();
  activePromoCode = null;
  ui.promo.value = '';
  ui.promoStatus.textContent = '';
  renderCart();
}

function resetFilters() {
  ui.search.value = '';
  ui.categoryFilter.value = 'all';
  ui.inStockOnly.checked = false;
  renderCatalog();
}

ui.search.addEventListener('input', renderCatalog);
ui.categoryFilter.addEventListener('change', renderCatalog);
ui.inStockOnly.addEventListener('change', renderCatalog);
ui.resetFilters.addEventListener('click', resetFilters);
ui.applyPromo.addEventListener('click', applyPromoCode);
ui.checkoutBtn.addEventListener('click', checkout);
ui.promo.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') applyPromoCode();
});

hydrateCategoryFilter();
renderCatalog();
renderCart();
