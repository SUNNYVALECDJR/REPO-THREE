const STORAGE_KEY = 'delivery-driver-stops-v1';

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

let stops = loadStops();

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

function loadStops() {
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
        customer: String(item.customer ?? '').trim(),
        address: String(item.address ?? '').trim(),
        notes: String(item.notes ?? '').trim(),
        delivered: Boolean(item.delivered),
      }))
      .filter((item) => item.customer && item.address);
  } catch {
    return [];
  }
}

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stops));
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
