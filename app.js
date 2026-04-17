const STORE_DATA = [
  {
    id: 'fresh-mart',
    name: 'Fresh Mart',
    products: [
      { id: 'apples', name: 'Apples', price: 1.49 },
      { id: 'milk', name: 'Whole Milk', price: 3.29 },
      { id: 'bread', name: 'Bread Loaf', price: 2.59 },
      { id: 'eggs', name: 'Eggs (12)', price: 2.99 },
    ],
  },
  {
    id: 'green-grocery',
    name: 'Green Grocery',
    products: [
      { id: 'spinach', name: 'Spinach', price: 2.19 },
      { id: 'tomatoes', name: 'Tomatoes', price: 2.49 },
      { id: 'rice', name: 'Brown Rice', price: 4.39 },
      { id: 'olive-oil', name: 'Olive Oil', price: 8.99 },
    ],
  },
  {
    id: 'neighborhood-market',
    name: 'Neighborhood Market',
    products: [
      { id: 'chicken', name: 'Chicken Breast', price: 7.29 },
      { id: 'pasta', name: 'Pasta', price: 1.89 },
      { id: 'yogurt', name: 'Greek Yogurt', price: 4.59 },
      { id: 'coffee', name: 'Ground Coffee', price: 9.49 },
    ],
  },
];

const state = {
  selectedStoreId: STORE_DATA[0].id,
  cart: [],
};

const elements = {
  storeList: document.querySelector('#store-list'),
  productsTitle: document.querySelector('#products-title'),
  productList: document.querySelector('#product-list'),
  cartList: document.querySelector('#cart-list'),
  cartEmpty: document.querySelector('#cart-empty'),
  cartCount: document.querySelector('#cart-count'),
  cartTotal: document.querySelector('#cart-total'),
  checkoutForm: document.querySelector('#checkout-form'),
  checkoutMessage: document.querySelector('#checkout-message'),
};

function getSelectedStore() {
  return STORE_DATA.find((store) => store.id === state.selectedStoreId);
}

function getCartCount() {
  return state.cart.reduce((count, item) => count + item.quantity, 0);
}

function getCartTotal() {
  return state.cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function setSelectedStore(storeId) {
  state.selectedStoreId = storeId;
  render();
}

function addItemToCart(product) {
  const existingItem = state.cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }

  renderCart();
}

function removeItemFromCart(productId) {
  const existingItem = state.cart.find((item) => item.id === productId);
  if (!existingItem) {
    return;
  }

  if (existingItem.quantity > 1) {
    existingItem.quantity -= 1;
  } else {
    state.cart = state.cart.filter((item) => item.id !== productId);
  }

  renderCart();
}

function renderStores() {
  elements.storeList.innerHTML = '';

  for (const store of STORE_DATA) {
    const listItem = document.createElement('li');
    const button = document.createElement('button');

    button.type = 'button';
    button.textContent = store.name;
    button.classList.toggle('is-active', store.id === state.selectedStoreId);
    button.addEventListener('click', () => setSelectedStore(store.id));

    listItem.appendChild(button);
    elements.storeList.appendChild(listItem);
  }
}

function renderProducts() {
  const selectedStore = getSelectedStore();
  elements.productList.innerHTML = '';

  elements.productsTitle.textContent = `${selectedStore.name} Products`;

  for (const product of selectedStore.products) {
    const listItem = document.createElement('li');
    listItem.className = 'product-item';

    const info = document.createElement('div');

    const name = document.createElement('p');
    name.className = 'item-name';
    name.textContent = product.name;

    const price = document.createElement('p');
    price.className = 'item-price';
    price.textContent = formatCurrency(product.price);

    info.append(name, price);

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Add to cart';
    button.addEventListener('click', () => addItemToCart(product));

    listItem.append(info, button);
    elements.productList.appendChild(listItem);
  }
}

function renderCart() {
  elements.cartList.innerHTML = '';

  for (const item of state.cart) {
    const listItem = document.createElement('li');
    listItem.className = 'cart-item';

    const info = document.createElement('div');

    const name = document.createElement('p');
    name.className = 'item-name';
    name.textContent = item.name;

    const qtyAndPrice = document.createElement('p');
    qtyAndPrice.className = 'item-qty';
    qtyAndPrice.textContent = `${item.quantity} × ${formatCurrency(item.price)}`;

    info.append(name, qtyAndPrice);

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Remove';
    button.addEventListener('click', () => removeItemFromCart(item.id));

    listItem.append(info, button);
    elements.cartList.appendChild(listItem);
  }

  const count = getCartCount();
  const total = getCartTotal();

  elements.cartCount.textContent = String(count);
  elements.cartTotal.textContent = formatCurrency(total);
  elements.cartEmpty.classList.toggle('hidden', count > 0);
}

function handleCheckoutSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.checkoutForm);
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const address = String(formData.get('address') || '').trim();

  if (!name || !email || !address) {
    elements.checkoutMessage.textContent = 'Please complete all checkout fields.';
    return;
  }

  if (getCartCount() === 0) {
    elements.checkoutMessage.textContent = 'Add at least one item to the cart before checkout.';
    return;
  }

  elements.checkoutMessage.textContent = `Order placed for ${name}.`;

  state.cart = [];
  elements.checkoutForm.reset();
  renderCart();
}

function bindEvents() {
  elements.checkoutForm.addEventListener('submit', handleCheckoutSubmit);
}

function render() {
  renderStores();
  renderProducts();
  renderCart();
}

function init() {
  bindEvents();
  render();
}

init();
