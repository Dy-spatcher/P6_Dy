import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // Get all payments (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.paymentsService.getAll();
  }

  // Get single payment by id (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':payment_id')
  async getOne(@Param('payment_id') payment_id: string) {
    return this.paymentsService.findById(+payment_id);
  }

  // Create payment (open - for demo)
@Post()
async create(
  @Body()
  body: {
    order_id: number;
    payment_code: string;
    payment_method: string;
    amount: number;
    status?: string;
  },
) {
  return this.paymentsService.createPayment(
    body.order_id,
    body.payment_code,
    body.payment_method,
    body.amount,
    body.status,
  );
}

  // Update payment (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':payment_id')
  async update(@Param('payment_id') payment_id: string, @Body() body: any) {
    return this.paymentsService.updatePayment(+payment_id, body);
  }

  // Delete payment (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':payment_id')
  async remove(@Param('payment_id') payment_id: string) {
    return this.paymentsService.deletePayment(+payment_id);
  }
}

export { PaymentsService };
