const stores = [
  {
    id: 's1',
    name: 'Downtown Fresh Market',
    eta: '25-35 min',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    blurb: 'Seasonal produce and everyday essentials.',
    inventory: [
      { id: 'a1', name: 'Organic Apples', price: 3.99 },
      { id: 'a2', name: 'Whole Grain Bread', price: 4.5 },
      { id: 'a3', name: 'Free-Range Eggs (12)', price: 5.75 }
    ]
  },
  {
    id: 's2',
    name: 'Riverside Grocery Co.',
    eta: '30-45 min',
    image: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818?auto=format&fit=crop&w=800&q=80',
    blurb: 'Pantry staples and fresh dairy picks.',
    inventory: [
      { id: 'b1', name: 'Almond Milk', price: 3.25 },
      { id: 'b2', name: 'Greek Yogurt', price: 6.2 },
      { id: 'b3', name: 'Baby Spinach', price: 2.8 }
    ]
  },
  {
    id: 's3',
    name: 'Corner Pantry',
    eta: '15-25 min',
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
    blurb: 'Quick meal favorites close to home.',
    inventory: [
      { id: 'c1', name: 'Pasta Fusilli', price: 2.3 },
      { id: 'c2', name: 'Tomato Sauce', price: 3.1 },
      { id: 'c3', name: 'Parmesan Cheese', price: 4.9 }
    ]
  }
];

let selectedStore = stores[0];
const cart = [];

const storeList = document.getElementById('storeList');
const inventoryList = document.getElementById('inventoryList');
const selectedStoreLabel = document.getElementById('selectedStoreLabel');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const emptyCart = document.getElementById('emptyCart');
const checkoutForm = document.getElementById('checkoutForm');
const formMessage = document.getElementById('formMessage');
const mobileCartBar = document.getElementById('mobileCartBar');
const mobileCartCount = document.getElementById('mobileCartCount');
const mobileCartTotal = document.getElementById('mobileCartTotal');
const reviewOrderButton = document.getElementById('reviewOrderButton');
const checkoutSection = document.getElementById('checkoutSection');

function money(amount) {
  return `$${amount.toFixed(2)}`;
}

function renderStores() {
  storeList.innerHTML = '';
  stores.forEach((store) => {
    const button = document.createElement('button');
    button.className = `store-tile ${selectedStore.id === store.id ? 'active' : ''}`;
    button.type = 'button';
    button.innerHTML = `
      <img src="${store.image}" alt="${store.name}" loading="lazy" />
      <div class="store-tile-content">
        <strong>${store.name}</strong>
        <small>${store.blurb}</small>
        <span>Delivery ${store.eta}</span>
      </div>
    `;
    button.addEventListener('click', () => {
      selectedStore = store;
      renderStores();
      renderInventory();
    });
    storeList.appendChild(button);
  });
}

function renderInventory() {
  inventoryList.innerHTML = '';
  selectedStoreLabel.textContent = `${selectedStore.name} inventory`;

  selectedStore.inventory.forEach((item) => {
    const itemCard = document.createElement('article');
    itemCard.className = 'item-card';

    const inCart = cart.find((entry) => entry.id === item.id);

    itemCard.innerHTML = `
      <p><strong>${item.name}</strong></p>
      <p>${money(item.price)}</p>
      <p class="muted">${inCart ? `In cart: ${inCart.quantity}` : 'Not in cart'}</p>
    `;

    const addButton = document.createElement('button');
    addButton.textContent = 'Add to Cart';
    addButton.type = 'button';
    addButton.addEventListener('click', () => addToCart(item));

    itemCard.appendChild(addButton);
    inventoryList.appendChild(itemCard);
  });
}

function addToCart(item) {
  const entry = cart.find((cartItem) => cartItem.id === item.id);
  if (entry) entry.quantity += 1;
  else cart.push({ ...item, quantity: 1 });

  renderInventory();
  renderCart();
}

function removeFromCart(itemId) {
  const index = cart.findIndex((entry) => entry.id === itemId);
  if (index === -1) return;

  if (cart[index].quantity > 1) cart[index].quantity -= 1;
  else cart.splice(index, 1);

  renderInventory();
  renderCart();
}

function renderCart() {
  cartItems.innerHTML = '';
  emptyCart.style.display = cart.length ? 'none' : 'block';

  let total = 0;
  cart.forEach((item) => {
    total += item.price * item.quantity;
    const row = document.createElement('li');
    row.className = 'cart-item';
    row.innerHTML = `<span>${item.name} x${item.quantity} — ${money(item.price * item.quantity)}</span>`;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => removeFromCart(item.id));

    row.appendChild(removeButton);
    cartItems.appendChild(row);
  });

  cartTotal.textContent = money(total);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  mobileCartCount.textContent = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
  mobileCartTotal.textContent = `${money(total)} total`;
  mobileCartBar.style.display = itemCount ? 'flex' : 'none';
}

checkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formMessage.className = '';

  if (!cart.length) {
    formMessage.textContent = 'Add at least one item before paying.';
    formMessage.classList.add('error');
    return;
  }

  if (!checkoutForm.checkValidity()) {
    formMessage.textContent = 'Please complete all delivery and payment fields correctly.';
    formMessage.classList.add('error');
    checkoutForm.reportValidity();
    return;
  }

  const data = new FormData(checkoutForm);
  const firstName = (data.get('fullName') || '').toString().split(' ')[0] || 'Customer';
  const orderTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  formMessage.textContent = `Thanks ${firstName}! Your payment of ${money(orderTotal)} was processed and your order is on the way.`;
  formMessage.classList.add('success');

  cart.length = 0;
  renderInventory();
  renderCart();
  checkoutForm.reset();
});

reviewOrderButton.addEventListener('click', () => {
  checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

renderStores();
renderInventory();
renderCart();
