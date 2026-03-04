const STORAGE_KEY = 'store-manager-products-v1';
const LOW_STOCK_THRESHOLD = 5;

const form = document.querySelector('#product-form');
const nameInput = document.querySelector('#product-name');
const priceInput = document.querySelector('#product-price');
const stockInput = document.querySelector('#product-stock');
const tableBody = document.querySelector('#product-table-body');
const rowTemplate = document.querySelector('#row-template');
const emptyState = document.querySelector('#empty-state');
const clearAllButton = document.querySelector('#clear-all');

const totalProducts = document.querySelector('#total-products');
const totalStock = document.querySelector('#total-stock');
const outOfStock = document.querySelector('#out-of-stock');
const inventoryValue = document.querySelector('#inventory-value');

let products = loadProducts();

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const product = {
    id: crypto.randomUUID(),
    name: nameInput.value.trim(),
    price: Number(priceInput.value),
    stock: Number(stockInput.value),
  };

  if (!product.name || product.price < 0 || product.stock < 0) {
    return;
  }

  products.push(product);
  persistAndRender();
  form.reset();
  stockInput.value = '0';
});

clearAllButton.addEventListener('click', () => {
  products = [];
  persistAndRender();
});

function loadProducts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        id: String(item.id ?? crypto.randomUUID()),
        name: String(item.name ?? '').trim(),
        price: Number(item.price ?? 0),
        stock: Number(item.stock ?? 0),
      }))
      .filter((item) => item.name.length > 0 && item.price >= 0 && item.stock >= 0);
  } catch {
    return [];
  }
}

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  render();
}

function render() {
  tableBody.innerHTML = '';

  for (const product of products) {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector('.name').textContent = product.name;
    row.querySelector('.price').textContent = toCurrency(product.price);
    row.querySelector('.stock').textContent = String(product.stock);

    const sellButton = row.querySelector('.sell-btn');
    sellButton.disabled = product.stock <= 0;
    sellButton.addEventListener('click', () => {
      adjustStock(product.id, -1);
    });

    const restockInput = row.querySelector('.restock-qty');
    const restockButton = row.querySelector('.restock-btn');
    restockButton.addEventListener('click', () => {
      const quantity = Number(restockInput.value);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return;
      }
      adjustStock(product.id, quantity);
      restockInput.value = '1';
    });

    row.querySelector('.status').appendChild(createStatusChip(product.stock));

    tableBody.appendChild(row);
  }

  emptyState.classList.toggle('hidden', products.length > 0);
  updateSummary();
}

function createStatusChip(stock) {
  const chip = document.createElement('span');
  chip.className = 'status-chip';

  if (stock <= 0) {
    chip.classList.add('out');
    chip.textContent = 'Out of stock';
  } else if (stock <= LOW_STOCK_THRESHOLD) {
    chip.classList.add('low');
    chip.textContent = 'Low stock';
  } else {
    chip.classList.add('ok');
    chip.textContent = 'In stock';
  }

  return chip;
}

function adjustStock(id, amount) {
  products = products.map((product) => {
    if (product.id !== id) {
      return product;
    }

    return {
      ...product,
      stock: Math.max(0, product.stock + amount),
    };
  });

  persistAndRender();
}

function updateSummary() {
  const productCount = products.length;
  const stockCount = products.reduce((total, product) => total + product.stock, 0);
  const outCount = products.filter((product) => product.stock === 0).length;
  const value = products.reduce((total, product) => total + (product.price * product.stock), 0);

  totalProducts.textContent = String(productCount);
  totalStock.textContent = String(stockCount);
  outOfStock.textContent = String(outCount);
  inventoryValue.textContent = toCurrency(value);
}

function toCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

render();
