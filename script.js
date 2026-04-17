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

const profileModule = (() => {
  const PROFILE_STORAGE_KEY = 'user-profile-v1';
  const PROFILE_FIELDS = ['name', 'email', 'address', 'paymentInfo', 'deliveryInstructions'];

  const profileForm = document.querySelector('#profile-form');
  const checkoutForm = document.querySelector('#checkout-form');
  const profileStatus = document.querySelector('#profile-status');
  const profileLoadButton = document.querySelector('#profile-load');
  const profilePaymentDisplay = document.querySelector('#profile-payment-display');
  const checkoutPaymentDisplay = document.querySelector('#checkout-payment-display');

  const profileInputs = getFieldMap(profileForm);
  const checkoutInputs = getFieldMap(checkoutForm);

  const initialProfile = loadProfile();
  applyProfileToForms(initialProfile, { updateStatus: false });

  profileForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const profile = readFormData(profileInputs);
    saveProfile(profile);
    applyProfileToForms(profile, {
      updateStatus: true,
      statusMessage: 'Profile saved and checkout auto-filled.',
    });
  });

  profileLoadButton?.addEventListener('click', () => {
    const profile = loadProfile();
    applyProfileToForms(profile, {
      updateStatus: true,
      statusMessage: hasAnyProfileValue(profile)
        ? 'Saved profile loaded into profile and checkout forms.'
        : 'No saved profile found yet.',
    });
  });

  checkoutForm?.addEventListener('input', () => {
    const checkoutPayment = checkoutInputs.paymentInfo?.value ?? '';
    checkoutPaymentDisplay.textContent = maskSensitiveValue(checkoutPayment) || 'Not entered';
  });

  function getFieldMap(formElement) {
    const map = {};

    for (const field of PROFILE_FIELDS) {
      const input = formElement?.querySelector(`[data-profile-field="${field}"]`);
      if (input instanceof HTMLInputElement) {
        map[field] = input;
      }
    }

    return map;
  }

  function readFormData(inputMap) {
    return PROFILE_FIELDS.reduce((profile, field) => {
      const value = inputMap[field]?.value ?? '';
      profile[field] = String(value).trim();
      return profile;
    }, {});
  }

  function loadProfile() {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);

    if (!raw) {
      return emptyProfile();
    }

    try {
      const parsed = JSON.parse(raw);
      return sanitizeProfile(parsed);
    } catch {
      return emptyProfile();
    }
  }

  function saveProfile(profile) {
    const sanitized = sanitizeProfile(profile);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(sanitized));
  }

  function sanitizeProfile(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};

    return PROFILE_FIELDS.reduce((profile, field) => {
      profile[field] = String(source[field] ?? '').trim();
      return profile;
    }, {});
  }

  function emptyProfile() {
    return sanitizeProfile({});
  }

  function hasAnyProfileValue(profile) {
    return PROFILE_FIELDS.some((field) => Boolean(profile[field]));
  }

  function applyProfileToForms(profile, options = {}) {
    const normalized = sanitizeProfile(profile);

    setFormData(profileInputs, normalized);
    setFormData(checkoutInputs, normalized);

    profilePaymentDisplay.textContent = maskSensitiveValue(normalized.paymentInfo) || 'Not saved';
    checkoutPaymentDisplay.textContent = maskSensitiveValue(normalized.paymentInfo) || 'Not entered';

    if (options.updateStatus) {
      profileStatus.textContent = options.statusMessage ?? '';
    }
  }

  function setFormData(inputMap, profile) {
    for (const field of PROFILE_FIELDS) {
      const input = inputMap[field];
      if (input) {
        input.value = profile[field] ?? '';
      }
    }
  }

  function maskSensitiveValue(value) {
    const digitsOnly = String(value).replace(/\D/g, '');

    if (!digitsOnly) {
      return '';
    }

    const visible = digitsOnly.slice(-4);
    const maskedLength = Math.max(digitsOnly.length - visible.length, 0);
    return `${'*'.repeat(maskedLength)}${visible}`;
  }

  return {
    loadProfile,
    saveProfile,
  };
})();

void profileModule;

render();
