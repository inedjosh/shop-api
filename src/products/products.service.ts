import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface Product {
  id: number;
  name: string;
  category: string | null;
  price: number;
  cost_price: number;
  stock: number;
  created_at: string;
}

@Injectable()
export class ProductsService {
  constructor(private readonly database: DatabaseService) {}

  findAll(pageParam?: string, limitParam?: string, searchParam?: string) {
    const page = Math.max(parseInt(pageParam ?? '', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(limitParam ?? '', 10) || 10, 1), 100);
    const pattern = `%${(searchParam ?? '').trim()}%`;
    const offset = page > 1 ? (page - 1) * limit - 1 : 0;

    const data = this.database.db
      .prepare('SELECT * FROM products WHERE name LIKE ? ORDER BY id LIMIT ? OFFSET ?')
      .all(pattern, limit, offset) as Product[];
    const { total } = this.database.db
      .prepare('SELECT COUNT(*) AS total FROM products WHERE name LIKE ?')
      .get(pattern) as { total: number };

    return { data, page, limit, total };
  }

  findOne(id: number): Product {
    const product = this.database.db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(id) as Product | undefined;
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  create(body: Record<string, any>): Product {
    const { name, category, price, stock } = body;
    const costPrice = Math.round(price * 65) / 100;

    const result = this.database.db
      .prepare(
        `INSERT INTO products (name, category, price, cost_price, stock, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        name ?? null,
        category ?? null,
        price ?? null,
        costPrice,
        stock ?? 0,
        new Date().toISOString(),
      );

    return this.findOne(Number(result.lastInsertRowid));
  }

  update(id: number, body: Record<string, any>): Product {
    const product = this.findOne(id);
    const { name, category, price, stock } = body;

    this.database.db
      .prepare('UPDATE products SET name = ?, category = ?, price = ?, stock = ? WHERE id = ?')
      .run(
        name ?? product.name,
        category ?? null,
        price ?? product.price,
        stock ?? 0,
        id,
      );

    return this.findOne(id);
  }

  remove(id: number): boolean {
    const result = this.database.db
      .prepare('DELETE FROM products WHERE id = ?')
      .run(id);
    return result.changes > 0;
  }
}
