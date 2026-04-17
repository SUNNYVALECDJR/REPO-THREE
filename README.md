# Delivery Driver Dispatch + Store Admin Dashboard

Simple browser-based delivery dispatcher with a separate store admin dashboard.

## Customer Dispatch Features

- Add delivery stops with customer name, address, and package notes.
- Track route progress by marking stops as pending or delivered.
- View shift summary metrics for total, pending, and delivered stops.
- Integrated Google Maps embed updates to the selected stop.
- Open selected destination directly in Google Maps for navigation.

## Store Admin Dashboard Features

- Inventory management: add/edit/remove products.
- Price tools: individual edits plus bulk markup by percentage.
- Order list with approve/reject actions for pending orders.
- Basic reporting: total orders, approved revenue, and low-stock alerts.

## Architecture Notes

- Customer dispatch and admin dashboard are isolated views in the same app.
- Each section has separated initialization and state management logic.
- Existing dispatch behavior remains unchanged and persists in localStorage.

## Run locally

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173> in your browser.
