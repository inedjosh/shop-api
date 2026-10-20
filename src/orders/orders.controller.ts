import { Body, Controller, Post } from '@nestjs/common';
import { OrderItem, OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() body: { items?: OrderItem[] }) {
    return this.ordersService.create(body?.items);
  }
}
