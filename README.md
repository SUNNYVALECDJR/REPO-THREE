# Store Manager Interface

Simple browser-based store manager with inventory management.

## Features

- Add products with price and initial inventory.
- Sell units one at a time without allowing negative inventory.
- Restock products with custom quantities.
- Visual stock status (in stock / low stock / out of stock).
- Inventory summary metrics for products, units, out-of-stock count, and inventory value.
- Persists product data in browser localStorage.

## Run locally

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173> in your browser.
