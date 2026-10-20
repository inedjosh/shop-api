# Shop API

A small REST API for a grocery and household shop, built with NestJS and SQLite (better-sqlite3).

## Getting started

Requires Node.js 20.

```bash
npm install
npm run seed     # creates data/shop.db and loads 24 products
npm run start    # http://localhost:3000
npm run dev      # restart on file changes
```

All request and response bodies are JSON. Errors always have the shape `{ "error": "<message>" }`.

## Product object

```json
{
  "id": 1,
  "name": "Basmati Rice 1kg",
  "category": "Pantry",
  "price": 3.49,
  "stock": 40,
  "created_at": "2025-01-15T09:30:00.000Z"
}
```

Product responses never include `cost_price`. It is internal margin data and is not exposed by the API.

---

## GET /products

Returns a page of products.

| Query    | Default | Description                                              |
| -------- | ------- | -------------------------------------------------------- |
| `page`   | `1`     | Page number, starting at 1                               |
| `limit`  | `10`    | Items per page (1-100)                                   |
| `search` | none    | Case-insensitive match anywhere in the product name      |

Pages never overlap: every product appears on exactly one page for a given `limit`.

**200 OK**

```json
{
  "data": [
    { "id": 1, "name": "Basmati Rice 1kg", "category": "Pantry", "price": 3.49, "stock": 40, "created_at": "2025-01-15T09:30:00.000Z" }
  ],
  "page": 1,
  "limit": 10,
  "total": 24
}
```

`total` is the number of products matching `search` across all pages.

Example: `GET /products?page=2&limit=5&search=milk`

---

## GET /products/:id

**200 OK** - the product object.

**404 Not Found**

```json
{ "error": "Product not found" }
```

---

## POST /products

Creates a product.

```json
{
  "name": "Brown Rice 1kg",
  "category": "Pantry",
  "price": 3.99,
  "stock": 25
}
```

| Field      | Rules                                   |
| ---------- | --------------------------------------- |
| `name`     | Required, non-empty string              |
| `category` | Optional string                         |
| `price`    | Required, number greater than 0         |
| `stock`    | Optional integer, 0 or greater (default 0) |

**201 Created** - the created product.

```json
{
  "id": 25,
  "name": "Brown Rice 1kg",
  "category": "Pantry",
  "price": 3.99,
  "stock": 25,
  "created_at": "2025-01-15T10:02:11.000Z"
}
```

**400 Bad Request** - invalid input, with a clear message.

```json
{ "error": "name is required" }
```

---

## PATCH /products/:id

Updates only the fields that are sent. Any field not in the request body keeps its current value.

```json
{ "price": 4.29 }
```

Accepted fields: `name`, `category`, `price`, `stock`.

**200 OK** - the updated product.

**404 Not Found**

```json
{ "error": "Product not found" }
```

---

## DELETE /products/:id

**204 No Content** - the product was deleted. No response body.

**404 Not Found**

```json
{ "error": "Product not found" }
```

---

## POST /orders

Places an order for one or more products.

```json
{
  "items": [
    { "productId": 5, "quantity": 1 },
    { "productId": 16, "quantity": 1 }
  ]
}
```

Each item needs an integer `productId` and an integer `quantity` of at least 1.

**201 Created**

```json
{
  "id": 1,
  "items": [
    { "productId": 5, "quantity": 1 },
    { "productId": 16, "quantity": 1 }
  ],
  "total": 0.3
}
```

`total` is the sum of `price * quantity` for all items, rounded to exactly 2 decimal places. On success the stock of each ordered product is decremented by the ordered quantity.

**400 Bad Request** - `items` missing, empty or malformed.

```json
{ "error": "items must be a non-empty array" }
```

**404 Not Found** - an item references a product that does not exist.

```json
{ "error": "Product 999 not found" }
```

**409 Conflict** - an item's quantity exceeds the available stock. Nothing is changed: no stock is decremented and no order is created.

```json
{ "error": "Insufficient stock for product 9" }
```

---

## Server errors

Unexpected failures return **500** with a generic body:

```json
{ "error": "Internal server error" }
```
