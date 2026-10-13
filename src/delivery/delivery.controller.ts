import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('delivery')
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.deliveryService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':delivery_id')
  async getOne(@Param('delivery_id') delivery_id: string) {
    return this.deliveryService.findById(+delivery_id);
  }

@Post()
async create(
  @Body()
  body: {
    order_id?: number;
    delivery_code?: string;
    delivery_address?: string;
    courier_name?: string;
    delivery_status?: string;
    delivery_date?: string;
  },
) {
  if (!body.order_id || !body.delivery_code || !body.delivery_address || !body.courier_name) {
    throw new BadRequestException(
      'order_id, delivery_code, delivery_address and courier_name are required',
    );
  }

  return this.deliveryService.createDelivery(
    body.order_id,
    body.delivery_code,
    body.delivery_address,
    body.courier_name,
    body.delivery_status,
    body.delivery_date,
  );
}

  @UseGuards(JwtAuthGuard)
  @Put(':delivery_id')
  async update(@Param('delivery_id') delivery_id: string, @Body() body: any) {
    return this.deliveryService.updateDelivery(+delivery_id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':delivery_id')
  async remove(@Param('delivery_id') delivery_id: string) {
    return this.deliveryService.deleteDelivery(+delivery_id);
  }
}