const PRODUCTS = [
  { id: 'p1', name: 'Organic Bananas', category: 'Produce', price: 1.99, inStock: true },
  { id: 'p2', name: 'Baby Spinach', category: 'Produce', price: 3.49, inStock: true },
  { id: 'p3', name: 'Avocados (4 pack)', category: 'Produce', price: 4.99, inStock: false },
  { id: 'p4', name: 'Whole Milk', category: 'Dairy', price: 3.29, inStock: true },
  { id: 'p5', name: 'Greek Yogurt', category: 'Dairy', price: 5.49, inStock: true },
  { id: 'p6', name: 'Sourdough Bread', category: 'Bakery', price: 4.29, inStock: true },
  { id: 'p7', name: 'Ground Coffee', category: 'Pantry', price: 10.99, inStock: true },
  { id: 'p8', name: 'Olive Oil', category: 'Pantry', price: 12.99, inStock: false },
  { id: 'p9', name: 'Frozen Berries', category: 'Frozen', price: 6.49, inStock: true },
];

const PROMO_CODES = {
  SAVE10: { type: 'percent', value: 10 },
  WELCOME5: { type: 'fixed', value: 5 },
};

const FREE_DELIVERY_THRESHOLD = 35;
const STANDARD_DELIVERY_FEE = 6.99;

const STORAGE_KEY = 'freshcart-state-v1';

const searchInput = document.querySelector('#search-input');
const categoryFilter = document.querySelector('#category-filter');
const stockToggle = document.querySelector('#stock-toggle');
const resultsCount = document.querySelector('#results-count');
const productList = document.querySelector('#product-list');
const emptyState = document.querySelector('#empty-state');
const productTemplate = document.querySelector('#product-item-template');

const cartList = document.querySelector('#cart-list');
const emptyCart = document.querySelector('#empty-cart');
const cartTemplate = document.querySelector('#cart-item-template');
const clearCartButton = document.querySelector('#clear-cart');

const promoInput = document.querySelector('#promo-input');
const applyPromoButton = document.querySelector('#apply-promo');
const removePromoButton = document.querySelector('#remove-promo');
const promoMessage = document.querySelector('#promo-message');

const subtotalValue = document.querySelector('#subtotal-value');
const discountValue = document.querySelector('#discount-value');
const deliveryValue = document.querySelector('#delivery-value');
const totalValue = document.querySelector('#total-value');
const deliveryNote = document.querySelector('#delivery-note');

let state = loadState();

initializeFilters();
attachEventListeners();
render();

function initializeFilters() {
  const categories = [...new Set(PRODUCTS.map((product) => product.category))].sort();
  for (const category of categories) {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  }

  searchInput.value = state.filters.search;
  categoryFilter.value = state.filters.category;
  stockToggle.checked = state.filters.inStockOnly;
}

function attachEventListeners() {
  searchInput.addEventListener('input', (event) => {
    state.filters.search = event.target.value;
    persistAndRender();
  });

  categoryFilter.addEventListener('change', (event) => {
    state.filters.category = event.target.value;
    persistAndRender();
  });

  stockToggle.addEventListener('change', (event) => {
    state.filters.inStockOnly = event.target.checked;
    persistAndRender();
  });

  clearCartButton.addEventListener('click', () => {
    state.cart = {};
    state.appliedPromo = null;
    promoInput.value = '';
    promoMessage.textContent = 'Cart cleared.';
    persistAndRender();
  });

  applyPromoButton.addEventListener('click', () => {
    const enteredCode = promoInput.value.trim().toUpperCase();
    if (!enteredCode) {
      promoMessage.textContent = 'Enter a promo code first.';
      return;
    }

    if (!PROMO_CODES[enteredCode]) {
      promoMessage.textContent = 'Invalid promo code.';
      return;
    }

    state.appliedPromo = enteredCode;
    promoMessage.textContent = `Promo applied: ${enteredCode}`;
    persistAndRender();
  });

  removePromoButton.addEventListener('click', () => {
    state.appliedPromo = null;
    promoInput.value = '';
    promoMessage.textContent = 'Promo removed.';
    persistAndRender();
  });

  document.querySelector('#checkout-btn').addEventListener('click', () => {
    if (Object.keys(state.cart).length === 0) {
      promoMessage.textContent = 'Add products to continue to checkout.';
      return;
    }

    promoMessage.textContent = 'Checkout ready. Review totals and place your order.';
  });
}

function loadState() {
  const fallback = {
    cart: {},
    appliedPromo: null,
    filters: {
      search: '',
      category: 'all',
      inStockOnly: false,
    },
  };

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      cart: sanitizeCart(parsed.cart),
      appliedPromo: PROMO_CODES[String(parsed.appliedPromo).toUpperCase()] ? String(parsed.appliedPromo).toUpperCase() : null,
      filters: {
        search: String(parsed?.filters?.search ?? ''),
        category: getValidCategory(parsed?.filters?.category),
        inStockOnly: Boolean(parsed?.filters?.inStockOnly),
      },
    };
  } catch {
    return fallback;
  }
}

function sanitizeCart(cart) {
  if (!cart || typeof cart !== 'object') {
    return {};
  }

  const entries = Object.entries(cart)
    .filter(([id, quantity]) => PRODUCTS.some((product) => product.id === id) && Number.isInteger(quantity) && quantity > 0)
    .map(([id, quantity]) => [id, quantity]);

  return Object.fromEntries(entries);
}

function getValidCategory(category) {
  const normalized = String(category ?? 'all');
  return normalized === 'all' || PRODUCTS.some((product) => product.category === normalized) ? normalized : 'all';
}

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function render() {
  const visibleProducts = getVisibleProducts();
  renderProducts(visibleProducts);
  renderCart();
}

function getVisibleProducts() {
  const searchTerm = state.filters.search.trim().toLowerCase();

  return PRODUCTS.filter((product) => {
    const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm);
    const matchesCategory = state.filters.category === 'all' || product.category === state.filters.category;
    const matchesStock = !state.filters.inStockOnly || product.inStock;

    return matchesSearch && matchesCategory && matchesStock;
  });
}

function renderProducts(products) {
  productList.innerHTML = '';

  for (const product of products) {
    const item = productTemplate.content.firstElementChild.cloneNode(true);
    item.querySelector('.name').textContent = product.name;
    item.querySelector('.meta').textContent = `${product.category} • ${product.inStock ? 'In stock' : 'Out of stock'}`;
    item.querySelector('.price').textContent = formatCurrency(product.price);

    const addButton = item.querySelector('.add-btn');
    addButton.disabled = !product.inStock;
    addButton.textContent = product.inStock ? 'Add to cart' : 'Out of stock';
    addButton.addEventListener('click', () => {
      incrementCart(product.id);
    });

    productList.appendChild(item);
  }

  resultsCount.textContent = `${products.length} product${products.length === 1 ? '' : 's'} shown`;
  emptyState.classList.toggle('hidden', products.length > 0);
}

function renderCart() {
  cartList.innerHTML = '';
  const lines = getCartLines();

  for (const line of lines) {
    const item = cartTemplate.content.firstElementChild.cloneNode(true);
    item.querySelector('.name').textContent = line.product.name;
    item.querySelector('.line-price').textContent = `${formatCurrency(line.product.price)} each`;
    item.querySelector('.qty').textContent = String(line.quantity);

    item.querySelector('.increase').addEventListener('click', () => incrementCart(line.product.id));
    item.querySelector('.decrease').addEventListener('click', () => decrementCart(line.product.id));

    cartList.appendChild(item);
  }

  emptyCart.classList.toggle('hidden', lines.length > 0);
  updatePricing(lines);
}

function getCartLines() {
  return Object.entries(state.cart)
    .map(([productId, quantity]) => ({
      product: PRODUCTS.find((product) => product.id === productId),
      quantity,
    }))
    .filter((line) => line.product && line.quantity > 0);
}

function incrementCart(productId) {
  state.cart[productId] = (state.cart[productId] || 0) + 1;
  persistAndRender();
}

function decrementCart(productId) {
  const currentQuantity = state.cart[productId] || 0;
  if (currentQuantity <= 1) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = currentQuantity - 1;
  }

  persistAndRender();
}

function updatePricing(lines) {
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const discount = calculateDiscount(subtotal);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : STANDARD_DELIVERY_FEE;
  const total = Math.max(subtotal - discount, 0) + deliveryFee;

  subtotalValue.textContent = formatCurrency(subtotal);
  discountValue.textContent = `-${formatCurrency(discount)}`;
  deliveryValue.textContent = formatCurrency(deliveryFee);
  totalValue.textContent = formatCurrency(total);

  if (subtotal === 0) {
    deliveryNote.textContent = 'Add items to estimate delivery.';
  } else if (deliveryFee === 0) {
    deliveryNote.textContent = `You unlocked free delivery at ${formatCurrency(FREE_DELIVERY_THRESHOLD)}.`;
  } else {
    const remaining = FREE_DELIVERY_THRESHOLD - subtotal;
    deliveryNote.textContent = `Add ${formatCurrency(remaining)} more for free delivery.`;
  }
}

function calculateDiscount(subtotal) {
  const code = state.appliedPromo;
  if (!code || subtotal <= 0) {
    return 0;
  }

  const promo = PROMO_CODES[code];
  if (!promo) {
    return 0;
  }

  if (promo.type === 'percent') {
    return subtotal * (promo.value / 100);
  }

  return Math.min(promo.value, subtotal);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
