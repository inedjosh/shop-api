import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'shop.db'));

db.exec(`
  DROP TABLE IF EXISTS orders;
  DROP TABLE IF EXISTS products;

  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    price REAL NOT NULL,
    cost_price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TEXT
  );

  CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    items TEXT,
    total REAL,
    created_at TEXT
  );
`);

const products: [string, string, number, number][] = [
  ['Basmati Rice 1kg', 'Pantry', 3.49, 40],
  ['Spaghetti 500g', 'Pantry', 1.29, 120],
  ['Rolled Oats 750g', 'Pantry', 2.89, 35],
  ['Olive Oil 500ml', 'Pantry', 7.99, 18],
  ['Sugar Sachet', 'Pantry', 0.1, 500],
  ['Canned Tomatoes 400g', 'Pantry', 0.7, 300],
  ['Whole Milk 1L', 'Dairy', 1.15, 60],
  ['Cheddar Cheese 200g', 'Dairy', 3.25, 25],
  ['Greek Yogurt 500g', 'Dairy', 2.45, 0],
  ['Salted Butter 250g', 'Dairy', 2.99, 45],
  ['Free Range Eggs 12pk', 'Dairy', 3.6, 70],
  ['Cream Cheese 150g', 'Dairy', 1.95, 12],
  ['Orange Juice 1L', 'Beverages', 2.19, 33],
  ['Sparkling Water 1.5L', 'Beverages', 0.89, 90],
  ['Ground Coffee 250g', 'Beverages', 4.99, 22],
  ['Green Tea Bag', 'Beverages', 0.2, 400],
  ['Cola 330ml Can', 'Beverages', 0.95, 150],
  ['Apple Juice 1L', 'Beverages', 1.79, 5],
  ['Dish Soap 500ml', 'Household', 2.25, 48],
  ['Paper Towels 2pk', 'Household', 3.99, 55],
  ['Laundry Detergent 1.5L', 'Household', 8.49, 20],
  ['Kitchen Sponge 3pk', 'Household', 1.1, 80],
  ['Trash Bags 20ct', 'Household', 4.25, 15],
  ['Toilet Paper 9 Rolls', 'Household', 6.75, 38],
];

const insert = db.prepare(
  `INSERT INTO products (name, category, price, cost_price, stock, created_at)
   VALUES (?, ?, ?, ?, ?, ?)`,
);

const seedAll = db.transaction(() => {
  const createdAt = new Date().toISOString();
  for (const [name, category, price, stock] of products) {
    const costPrice = Math.round(price * 65) / 100;
    insert.run(name, category, price, costPrice, stock, createdAt);
  }
});

seedAll();
console.log(`Seeded ${products.length} products into data/shop.db`);
db.close();
