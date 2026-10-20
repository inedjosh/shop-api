import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface OrderItem {
  productId: number;
  quantity: number;
}

@Injectable()
export class OrdersService {
  constructor(private readonly database: DatabaseService) {}

  create(items?: OrderItem[]) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('items must be a non-empty array');
    }
    for (const item of items) {
      if (
        !Number.isInteger(item?.productId) ||
        !Number.isInteger(item?.quantity) ||
        item.quantity < 1
      ) {
        throw new BadRequestException(
          'each item needs a productId and a positive integer quantity',
        );
      }
    }

    const quantities = new Map<number, number>();
    for (const { productId, quantity } of items) {
      quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
    }

    const db = this.database.db;
    const placeOrder = db.transaction(() => {
      let total = 0;
      for (const [productId, quantity] of quantities) {
        const product = db
          .prepare('SELECT price, stock FROM products WHERE id = ?')
          .get(productId) as { price: number; stock: number } | undefined;
        if (!product) {
          throw new NotFoundException(`Product ${productId} not found`);
        }
        if (quantity > product.stock) {
          throw new ConflictException(`Insufficient stock for product ${productId}`);
        }
        total += product.price * quantity;
      }

      for (const [productId, quantity] of quantities) {
        db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(
          quantity,
          productId,
        );
      }

      const orderItems = [...quantities].map(([productId, quantity]) => ({
        productId,
        quantity,
      }));
      const result = db
        .prepare('INSERT INTO orders (items, total, created_at) VALUES (?, ?, ?)')
        .run(JSON.stringify(orderItems), total, new Date().toISOString());

      return { id: Number(result.lastInsertRowid), items: orderItems, total };
    });

    return placeOrder();
  }
}
