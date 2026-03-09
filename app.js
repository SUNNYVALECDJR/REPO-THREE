const STORAGE_KEY = "user-profile-v1";

const form = document.getElementById("profile-form");
const statusText = document.getElementById("status");
const clearBtn = document.getElementById("clear-btn");

function maskCardNumber(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";

  const lastFour = digits.slice(-4);
  return `**** **** **** ${lastFour}`;
}

function getFormData() {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  data.cardNumber = data.cardNumber.replace(/\s+/g, "").trim();
  data.cvv = data.cvv.trim();

  return data;
}

function fillForm(data) {
  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field) {
      field.value = value;
    }
  });
}

function showStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? "#991b1b" : "#065f46";
}

function validate(data) {
  if (!data.cardNumber || data.cardNumber.replace(/\D/g, "").length < 12) {
    return "Please enter a valid credit card number.";
  }

  if (!/^\d{2}\/\d{2}$/.test(data.expiry)) {
    return "Expiration must be in MM/YY format.";
  }

  if (!/^\d{3,4}$/.test(data.cvv)) {
    return "CVV must be 3 or 4 digits.";
  }

  return null;
}

function saveProfile(event) {
  event.preventDefault();

  if (!form.reportValidity()) {
    showStatus("Please complete required fields.", true);
    return;
  }

  const data = getFormData();
  const error = validate(data);

  if (error) {
    showStatus(error, true);
    return;
  }

  const storedProfile = {
    ...data,
    cardNumberMasked: maskCardNumber(data.cardNumber),
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedProfile));
  showStatus("Profile saved successfully.");
}

function loadProfile() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const profile = JSON.parse(raw);
    fillForm(profile);

    if (profile.cardNumberMasked) {
      showStatus(`Loaded saved profile. Card on file: ${profile.cardNumberMasked}`);
    }
  } catch {
    showStatus("Saved profile could not be loaded.", true);
  }
}

function clearProfile() {
  localStorage.removeItem(STORAGE_KEY);
  form.reset();
  showStatus("Saved profile cleared.");
}

form.addEventListener("submit", saveProfile);
clearBtn.addEventListener("click", clearProfile);
loadProfile();
