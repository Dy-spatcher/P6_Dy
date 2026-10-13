import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

@Injectable()
export class PaymentsService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  private async assertOrderExists(order_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT 1 FROM orders WHERE order_id = ?',
      [order_id],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Order ${order_id} does not exist`);
    }
  }

  private normalizeOrderId(value: unknown): number {
    const order_id = Number(value);
    if (!Number.isInteger(order_id) || order_id <= 0) {
      throw new BadRequestException('order_id must be a positive integer');
    }
    return order_id;
  }

  async createPayment(
    order_id: number,
    payment_code: string,
    payment_method: string,
    amount: number,
    status = 'Pending',
  ) {
    const orderId = this.normalizeOrderId(order_id);
    await this.assertOrderExists(orderId);

    const [result] = await this.pool().execute<OkPacket>(
      'INSERT INTO payments (order_id, payment_code, payment_method, amount, status) VALUES (?, ?, ?, ?, ?)',
      [orderId, payment_code, payment_method, amount, status],
    );

    return {
      payment_id: result.insertId,
      order_id: orderId,
      payment_code,
      payment_method,
      amount,
      status,
    };
  }

  async findById(payment_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT payment_id, order_id, payment_code, payment_method, amount, status, payment_date FROM payments WHERE payment_id = ?',
      [payment_id],
    );
    return rows[0];
  }

  async getAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT payment_id, order_id, payment_code, payment_method, amount, status, payment_date FROM payments',
    );
    return rows;
  }

  async updatePayment(
    payment_id: number,
    partial: {
      order_id?: number;
      payment_code?: string;
      payment_method?: string;
      status?: string;
      amount?: number;
    },
  ) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.order_id !== undefined && partial.order_id !== null) {
      const orderId = this.normalizeOrderId(partial.order_id);
      await this.assertOrderExists(orderId);
      fields.push('order_id = ?');
      values.push(orderId);
    }

    if (partial.payment_code) {
      fields.push('payment_code = ?');
      values.push(partial.payment_code);
    }

    if (partial.payment_method) {
      fields.push('payment_method = ?');
      values.push(partial.payment_method);
    }

    if (partial.status) {
      fields.push('status = ?');
      values.push(partial.status);
    }

    if (partial.amount !== undefined && partial.amount !== null) {
      fields.push('amount = ?');
      values.push(partial.amount);
    }

    if (fields.length === 0) return this.findById(payment_id);

    values.push(payment_id);

    const sql = `UPDATE payments SET ${fields.join(', ')} WHERE payment_id = ?`;
    const [result] = await this.pool().execute<OkPacket>(sql, values);

    if (result.affectedRows === 0) {
      throw new NotFoundException(`Payment ${payment_id} not found`);
    }

    return this.findById(payment_id);
  }

  async deletePayment(payment_id: number) {
    const [result] = await this.pool().execute<OkPacket>(
      'DELETE FROM payments WHERE payment_id = ?',
      [payment_id],
    );
    return result.affectedRows > 0;
  }
}