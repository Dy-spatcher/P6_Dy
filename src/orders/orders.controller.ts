import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // Get all orders (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.ordersService.getAll();
  }

  // Get single order by id (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':order_id')
  async getOne(@Param('order_id') order_id: string) {
    return this.ordersService.findById(+order_id);
  }

  // Create order (open - for demo)
  @Post()
  async create(@Body() body: { order_code: string; id: number; order_status?: Parameters<OrdersService['createOrder']>[2]; total_amount?: number }) {
    return this.ordersService.createOrder(body.order_code, body.id, body.order_status, body.total_amount);
  }

  // Update order (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':order_id')
  async update(@Param('order_id') order_id: string, @Body() body: any) {
    return this.ordersService.updateOrder(+order_id, body);
  }

  // Delete order (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':order_id')
  async remove(@Param('order_id') order_id: string) {
    return this.ordersService.deleteOrder(+order_id);
  }
}