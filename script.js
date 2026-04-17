const STORAGE_KEYS = {
  stops: 'delivery-driver-stops-v1',
  inventory: 'store-admin-inventory-v1',
  orders: 'store-admin-orders-v1',
};

const LOW_STOCK_THRESHOLD = 5;

function loadCollection(key, normalizer) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizer).filter(Boolean);
  } catch {
    return [];
  }
}

function saveCollection(key, collection) {
  localStorage.setItem(key, JSON.stringify(collection));
}

function toCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function initViewSwitcher() {
  const customerButton = document.querySelector('#show-customer-view');
  const adminButton = document.querySelector('#show-admin-view');
  const customerApp = document.querySelector('#customer-app');
  const adminApp = document.querySelector('#admin-app');

  function activate(view) {
    const isCustomer = view === 'customer';
    customerApp.classList.toggle('hidden', !isCustomer);
    adminApp.classList.toggle('hidden', isCustomer);
    customerButton.classList.toggle('active', isCustomer);
    adminButton.classList.toggle('active', !isCustomer);
  }

  customerButton.addEventListener('click', () => activate('customer'));
  adminButton.addEventListener('click', () => activate('admin'));
}

function initCustomerDispatch() {
  const form = document.querySelector('#delivery-form');
  const customerInput = document.querySelector('#customer-name');
  const addressInput = document.querySelector('#delivery-address');
  const notesInput = document.querySelector('#delivery-notes');
  const deliveryList = document.querySelector('#delivery-list');
  const emptyState = document.querySelector('#empty-state');
  const clearAllButton = document.querySelector('#clear-all');
  const listTemplate = document.querySelector('#delivery-item-template');

  const totalStops = document.querySelector('#total-stops');
  const pendingStops = document.querySelector('#pending-stops');
  const deliveredStops = document.querySelector('#delivered-stops');

  const mapFrame = document.querySelector('#map-frame');
  const mapsLink = document.querySelector('#maps-link');

  let stops = loadCollection(STORAGE_KEYS.stops, (item) => {
    const normalized = {
      id: String(item.id ?? crypto.randomUUID()),
      customer: String(item.customer ?? '').trim(),
      address: String(item.address ?? '').trim(),
      notes: String(item.notes ?? '').trim(),
      delivered: Boolean(item.delivered),
    };

    return normalized.customer && normalized.address ? normalized : null;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const stop = {
      id: crypto.randomUUID(),
      customer: customerInput.value.trim(),
      address: addressInput.value.trim(),
      notes: notesInput.value.trim(),
      delivered: false,
    };

    if (!stop.customer || !stop.address) {
      return;
    }

    stops.push(stop);
    persistAndRender();
    form.reset();
  });

  clearAllButton.addEventListener('click', () => {
    stops = [];
    persistAndRender();
    setMapLocation('New York, NY');
  });

  function persistAndRender() {
    saveCollection(STORAGE_KEYS.stops, stops);
    render();
  }

  function render() {
    deliveryList.innerHTML = '';

    for (const stop of stops) {
      const item = listTemplate.content.firstElementChild.cloneNode(true);

      item.querySelector('.customer').textContent = stop.customer;
      item.querySelector('.address').textContent = stop.address;
      item.querySelector('.notes').textContent = stop.notes || 'No delivery notes.';

      const statusChip = item.querySelector('.status-chip');
      statusChip.textContent = stop.delivered ? 'Delivered' : 'Pending';
      statusChip.classList.add(stop.delivered ? 'delivered' : 'pending');

      const toggleButton = item.querySelector('.toggle-btn');
      toggleButton.textContent = stop.delivered ? 'Mark Pending' : 'Mark Delivered';
      toggleButton.addEventListener('click', () => {
        toggleDelivered(stop.id);
      });

      const mapButton = item.querySelector('.map-btn');
      mapButton.addEventListener('click', () => {
        setMapLocation(stop.address);
      });

      deliveryList.appendChild(item);
    }

    if (stops.length > 0) {
      const firstPending = stops.find((stop) => !stop.delivered) ?? stops[0];
      setMapLocation(firstPending.address);
    }

    emptyState.classList.toggle('hidden', stops.length > 0);
    updateSummary();
  }

  function toggleDelivered(id) {
    stops = stops.map((stop) => (stop.id === id ? { ...stop, delivered: !stop.delivered } : stop));
    persistAndRender();
  }

  function updateSummary() {
    const total = stops.length;
    const delivered = stops.filter((stop) => stop.delivered).length;

    totalStops.textContent = String(total);
    deliveredStops.textContent = String(delivered);
    pendingStops.textContent = String(total - delivered);
  }

  function setMapLocation(address) {
    const query = encodeURIComponent(address);
    mapFrame.src = `https://www.google.com/maps?q=${query}&output=embed`;
    mapsLink.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  render();
}

function initAdminDashboard() {
  const inventoryForm = document.querySelector('#inventory-form');
  const inventoryName = document.querySelector('#inventory-name');
  const inventoryCategory = document.querySelector('#inventory-category');
  const inventoryPrice = document.querySelector('#inventory-price');
  const inventoryStock = document.querySelector('#inventory-stock');
  const inventorySubmitButton = document.querySelector('#inventory-submit');
  const inventoryTableBody = document.querySelector('#inventory-table-body');
  const inventoryEmpty = document.querySelector('#inventory-empty');

  const bulkMarkupForm = document.querySelector('#bulk-markup-form');
  const bulkMarkupValue = document.querySelector('#bulk-markup-value');

  const orderList = document.querySelector('#order-list');
  const ordersEmpty = document.querySelector('#orders-empty');

  const reportTotalOrders = document.querySelector('#report-total-orders');
  const reportRevenue = document.querySelector('#report-revenue');
  const reportLowStock = document.querySelector('#report-low-stock');

  let editProductId = null;

  let inventory = loadCollection(STORAGE_KEYS.inventory, (item) => {
    const name = String(item.name ?? '').trim();
    const category = String(item.category ?? '').trim();
    const price = Number(item.price ?? 0);
    const stock = Number(item.stock ?? 0);

    if (!name || !category || !Number.isFinite(price) || !Number.isFinite(stock) || price < 0 || stock < 0) {
      return null;
    }

    return {
      id: String(item.id ?? crypto.randomUUID()),
      name,
      category,
      price,
      stock: Math.trunc(stock),
    };
  });

  let orders = loadCollection(STORAGE_KEYS.orders, (item) => {
    const customer = String(item.customer ?? '').trim();
    const status = String(item.status ?? 'pending').trim().toLowerCase();
    const total = Number(item.total ?? 0);

    if (!customer || !Number.isFinite(total) || total < 0) {
      return null;
    }

    const normalizedStatus = ['pending', 'approved', 'rejected'].includes(status) ? status : 'pending';

    return {
      id: String(item.id ?? crypto.randomUUID()),
      customer,
      total,
      status: normalizedStatus,
      createdAt: String(item.createdAt ?? new Date().toISOString()),
    };
  });

  if (orders.length === 0) {
    orders = [
      { id: crypto.randomUUID(), customer: 'Ava Johnson', total: 48.25, status: 'pending', createdAt: new Date().toISOString() },
      { id: crypto.randomUUID(), customer: 'Noah Smith', total: 72.4, status: 'approved', createdAt: new Date().toISOString() },
      { id: crypto.randomUUID(), customer: 'Liam Garcia', total: 19.99, status: 'pending', createdAt: new Date().toISOString() },
    ];
    saveCollection(STORAGE_KEYS.orders, orders);
  }

  inventoryForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const product = {
      id: editProductId ?? crypto.randomUUID(),
      name: inventoryName.value.trim(),
      category: inventoryCategory.value.trim(),
      price: Number(inventoryPrice.value),
      stock: Math.trunc(Number(inventoryStock.value)),
    };

    const isValid = product.name
      && product.category
      && Number.isFinite(product.price)
      && Number.isFinite(product.stock)
      && product.price >= 0
      && product.stock >= 0;

    if (!isValid) {
      return;
    }

    if (editProductId) {
      inventory = inventory.map((entry) => (entry.id === editProductId ? product : entry));
    } else {
      inventory.push(product);
    }

    resetInventoryForm();
    persistAndRender();
  });

  bulkMarkupForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const percent = Number(bulkMarkupValue.value);
    if (!Number.isFinite(percent)) {
      return;
    }

    const multiplier = 1 + percent / 100;
    inventory = inventory.map((product) => ({
      ...product,
      price: Number((product.price * multiplier).toFixed(2)),
    }));

    bulkMarkupForm.reset();
    persistAndRender();
  });

  function persistAndRender() {
    saveCollection(STORAGE_KEYS.inventory, inventory);
    saveCollection(STORAGE_KEYS.orders, orders);
    render();
  }

  function render() {
    renderInventory();
    renderOrders();
    renderReporting();
  }

  function renderInventory() {
    inventoryTableBody.innerHTML = '';

    for (const product of inventory) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>${toCurrency(product.price)}</td>
        <td>${product.stock}</td>
        <td class="actions-cell">
          <button data-action="edit" data-id="${product.id}" type="button">Edit</button>
          <button class="danger" data-action="remove" data-id="${product.id}" type="button">Remove</button>
        </td>
      `;
      inventoryTableBody.appendChild(row);
    }

    inventoryEmpty.classList.toggle('hidden', inventory.length > 0);

    inventoryTableBody.querySelectorAll('button[data-action="edit"]').forEach((button) => {
      button.addEventListener('click', () => {
        const product = inventory.find((entry) => entry.id === button.dataset.id);
        if (!product) {
          return;
        }

        editProductId = product.id;
        inventoryName.value = product.name;
        inventoryCategory.value = product.category;
        inventoryPrice.value = String(product.price);
        inventoryStock.value = String(product.stock);
        inventorySubmitButton.textContent = 'Update Product';
      });
    });

    inventoryTableBody.querySelectorAll('button[data-action="remove"]').forEach((button) => {
      button.addEventListener('click', () => {
        inventory = inventory.filter((entry) => entry.id !== button.dataset.id);
        if (editProductId === button.dataset.id) {
          resetInventoryForm();
        }
        persistAndRender();
      });
    });
  }

  function renderOrders() {
    orderList.innerHTML = '';

    for (const order of orders) {
      const li = document.createElement('li');
      li.className = 'order-item';
      li.innerHTML = `
        <div>
          <h3>${order.customer}</h3>
          <p class="muted">Order #${order.id.slice(0, 8)} • ${toCurrency(order.total)}</p>
        </div>
        <div class="order-actions">
          <span class="status-chip ${order.status}">${order.status}</span>
          <button data-order-action="approve" data-id="${order.id}" type="button" ${order.status !== 'pending' ? 'disabled' : ''}>Approve</button>
          <button class="danger" data-order-action="reject" data-id="${order.id}" type="button" ${order.status !== 'pending' ? 'disabled' : ''}>Reject</button>
        </div>
      `;

      orderList.appendChild(li);
    }

    ordersEmpty.classList.toggle('hidden', orders.length > 0);

    orderList.querySelectorAll('button[data-order-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const nextStatus = button.dataset.orderAction === 'approve' ? 'approved' : 'rejected';
        const id = button.dataset.id;

        orders = orders.map((order) => (
          order.id === id && order.status === 'pending'
            ? { ...order, status: nextStatus }
            : order
        ));

        persistAndRender();
      });
    });
  }

  function renderReporting() {
    const totalOrderCount = orders.length;
    const revenue = orders
      .filter((order) => order.status === 'approved')
      .reduce((sum, order) => sum + order.total, 0);
    const lowStockCount = inventory.filter((item) => item.stock <= LOW_STOCK_THRESHOLD).length;

    reportTotalOrders.textContent = String(totalOrderCount);
    reportRevenue.textContent = toCurrency(revenue);
    reportLowStock.textContent = String(lowStockCount);
  }

  function resetInventoryForm() {
    editProductId = null;
    inventoryForm.reset();
    inventorySubmitButton.textContent = 'Add Product';
  }

  render();
}

initViewSwitcher();
initCustomerDispatch();
initAdminDashboard();
