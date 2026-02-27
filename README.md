# QuickCart Grocery Delivery App

QuickCart is a responsive grocery delivery prototype built from scratch using vanilla HTML, CSS, and JavaScript.

## What improved

- Expanded grocery catalog with stock status indicators
- Search, category, and in-stock filtering controls
- Promo code support (`SAVE10`, `WELCOME5`) with live discount calculations
- Automatic free-delivery logic for orders above `$35`
- Cart summary now includes item count and discount rows
- Checkout message includes slot details and price summary

## Features

- Product catalog with rich cards and stock badges
- Dynamic cart with increment/decrement quantity controls
- Real-time totals (subtotal, fees, discount, final total)
- Promo code entry and validation
- Delivery slot picker
- Responsive desktop/mobile layout

## Run locally

```bash
python3 -m http.server 4173
```

Then open:

- `http://localhost:4173`

## Quick test flow

1. Add several items to cart
2. Apply `SAVE10` in promo input
3. Increase subtotal beyond `$35` to observe free delivery
4. Place order to confirm cart reset behavior
