const inventory = [
  { name: "Colombian Coffee Beans", sku: "COF-001", category: "Grocery", qty: 42, cost: 9.5, price: 14.99 },
  { name: "Hand Soap - Citrus", sku: "HYG-112", category: "Household", qty: 9, cost: 2.3, price: 4.5 },
  { name: "Sparkling Water 12-pack", sku: "BEV-450", category: "Beverage", qty: 23, cost: 4.0, price: 6.99 },
];

const orders = [
  { id: "ORD-1032", customer: "Ava Johnson", status: "Pending", total: 38.46, items: 4 },
  { id: "ORD-1033", customer: "Mason Lee", status: "Approved", total: 64.15, items: 7 },
  { id: "ORD-1034", customer: "Noah Patel", status: "Pending", total: 24.99, items: 2 },
];

const el = {
  form: document.getElementById("inventory-form"),
  inventoryRows: document.getElementById("inventory-rows"),
  orderRows: document.getElementById("order-rows"),
  inventoryHealth: document.getElementById("inventory-health"),
  alerts: document.getElementById("price-alerts"),
  bars: document.getElementById("category-bars"),
  statRevenue: document.getElementById("stat-revenue"),
  statOrders: document.getElementById("stat-orders"),
  statLowStock: document.getElementById("stat-low-stock"),
  statMargin: document.getElementById("stat-margin"),
  statPending: document.getElementById("stat-pending"),
  restockList: document.getElementById("restock-list"),
  refreshReport: document.getElementById("refresh-report"),
  markup: document.getElementById("markup"),
  applyMarkup: document.getElementById("apply-markup"),
  newOrderBtn: document.getElementById("new-order-btn"),
};

function currency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function marginPercent(item) {
  if (!item.price) return 0;
  return ((item.price - item.cost) / item.price) * 100;
}

function renderInventory() {
  el.inventoryRows.innerHTML = "";
  inventory.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.sku}</td>
      <td>${item.category}</td>
      <td>${item.qty}</td>
      <td>${currency(item.cost)}</td>
      <td>${currency(item.price)}</td>
      <td>${marginPercent(item).toFixed(1)}%</td>
    `;
    el.inventoryRows.appendChild(row);
  });

  const lowStock = inventory.filter((i) => i.qty < 10).length;
  el.inventoryHealth.textContent = lowStock ? `${lowStock} low-stock warnings` : "Inventory healthy";
  el.inventoryHealth.className = `pill${lowStock ? " warning" : ""}`;
}

function renderOrders() {
  el.orderRows.innerHTML = "";
  orders.forEach((order) => {
    const row = document.createElement("tr");
    const cls = order.status.toLowerCase();
    row.innerHTML = `
      <td>${order.id}</td>
      <td>${order.customer}</td>
      <td class="status ${cls}">${order.status}</td>
      <td>${currency(order.total)}</td>
      <td>${order.items}</td>
      <td></td>
    `;

    if (order.status === "Pending") {
      const controls = document.getElementById("order-action-template").content.cloneNode(true);
      controls.querySelector(".approve").addEventListener("click", () => {
        order.status = "Approved";
        renderOrders();
        renderReport();
      });
      controls.querySelector(".reject").addEventListener("click", () => {
        order.status = "Rejected";
        renderOrders();
        renderReport();
      });
      row.querySelector("td:last-child").appendChild(controls);
    } else {
      row.querySelector("td:last-child").textContent = "—";
    }

    el.orderRows.appendChild(row);
  });
}

function renderPriceAlerts() {
  el.alerts.innerHTML = "";
  const alerts = inventory
    .filter((item) => marginPercent(item) < 25)
    .map((item) => `${item.name} margin is ${marginPercent(item).toFixed(1)}%`);

  if (!alerts.length) {
    const li = document.createElement("li");
    li.textContent = "No active alerts";
    el.alerts.appendChild(li);
    return;
  }

  alerts.forEach((message) => {
    const li = document.createElement("li");
    li.textContent = message;
    el.alerts.appendChild(li);
  });
}

function renderReport() {
  const approvedOrders = orders.filter((o) => o.status === "Approved");
  const revenue = approvedOrders.reduce((sum, order) => sum + order.total, 0);
  const lowStockItems = inventory.filter((i) => i.qty < 10);
  const lowStock = lowStockItems.length;
  const pendingReviews = orders.filter((o) => o.status === "Pending").length;
  const avgMargin = inventory.reduce((sum, item) => sum + marginPercent(item), 0) / inventory.length;

  el.statRevenue.textContent = currency(revenue);
  el.statOrders.textContent = String(orders.length);
  el.statLowStock.textContent = String(lowStock);
  el.statMargin.textContent = `${avgMargin.toFixed(1)}%`;
  el.statPending.textContent = String(pendingReviews);

  const categoryTotals = inventory.reduce((map, item) => {
    map[item.category] = (map[item.category] || 0) + item.price * Math.max(item.qty * 0.12, 1);
    return map;
  }, {});

  const max = Math.max(...Object.values(categoryTotals), 1);
  el.bars.innerHTML = "";

  Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, total]) => {
      const wrapper = document.createElement("div");
      wrapper.className = "bar";
      const width = (total / max) * 100;
      wrapper.innerHTML = `
        <span>${category}</span>
        <div class="track"><div class="fill" style="width:${width.toFixed(0)}%"></div></div>
        <strong>${currency(total)}</strong>
      `;
      el.bars.appendChild(wrapper);
    });

  el.restockList.innerHTML = "";
  if (!lowStockItems.length) {
    const li = document.createElement("li");
    li.textContent = "No restock actions needed";
    el.restockList.appendChild(li);
    return;
  }

  lowStockItems
    .sort((a, b) => a.qty - b.qty)
    .forEach((item) => {
      const li = document.createElement("li");
      const targetQty = 24;
      const suggested = Math.max(targetQty - item.qty, 1);
      li.textContent = `${item.name} (${item.sku}) — reorder ${suggested} units`;
      el.restockList.appendChild(li);
    });
}

el.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const item = {
    name: document.getElementById("product-name").value.trim(),
    sku: document.getElementById("product-sku").value.trim(),
    category: document.getElementById("product-category").value.trim(),
    qty: Number(document.getElementById("product-qty").value),
    cost: Number(document.getElementById("product-cost").value),
    price: Number(document.getElementById("product-price").value),
  };

  inventory.push(item);
  el.form.reset();
  renderInventory();
  renderPriceAlerts();
  renderReport();
});

el.applyMarkup.addEventListener("click", () => {
  const percent = Number(el.markup.value);
  const factor = 1 + percent / 100;
  inventory.forEach((item) => {
    item.price = Number((item.price * factor).toFixed(2));
  });
  renderInventory();
  renderPriceAlerts();
  renderReport();
});

el.refreshReport.addEventListener("click", () => {
  renderReport();
});

el.newOrderBtn.addEventListener("click", () => {
  const id = `ORD-${Math.floor(Math.random() * 9000 + 1000)}`;
  orders.unshift({
    id,
    customer: "Walk-in Customer",
    status: "Pending",
    total: Number((Math.random() * 80 + 10).toFixed(2)),
    items: Math.floor(Math.random() * 8 + 1),
  });
  renderOrders();
  renderReport();
});

renderInventory();
renderOrders();
renderPriceAlerts();
renderReport();
