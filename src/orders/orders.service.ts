import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';

export type OrderStatus = 'pending' | 'on deliver' | 'delivered';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'on deliver',
  'delivered',
];

const ORDER_COLUMNS =
  'order_id, order_code, user_id, order_status, total_amount, order_date';

@Injectable()
export class OrdersService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  private normalizeUserId(value: unknown): number {
    const userId = Number(value);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('user_id must be a positive integer');
    }
    return userId;
  }

  private normalizeStatus(value: unknown): OrderStatus {
    const status = String(value).trim().toLowerCase();
    if (!ORDER_STATUSES.includes(status as OrderStatus)) {
      throw new BadRequestException(
        `order_status must be one of: ${ORDER_STATUSES.join(', ')}`,
      );
    }
    return status as OrderStatus;
  }

  private normalizeAmount(value: unknown): number {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new BadRequestException('total_amount must be a number >= 0');
    }
    return Math.round(amount * 100) / 100;
  }

  private async assertUserExists(userId: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      'SELECT 1 FROM users WHERE id = ?',
      [userId],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`User ${userId} does not exist`);
    }
  }

  async createOrder(
    order_code: string,
    user_id: number,
    order_status: OrderStatus = 'pending',
    total_amount = 0.0,
  ) {
    if (!order_code?.trim()) {
      throw new BadRequestException('order_code is required');
    }

    const userId = this.normalizeUserId(user_id);
    await this.assertUserExists(userId);

    const status = this.normalizeStatus(order_status);
    const amount = this.normalizeAmount(total_amount);

    try {
      const [result] = await this.pool().execute<OkPacket>(
        'INSERT INTO orders (order_code, user_id, order_status, total_amount) VALUES (?, ?, ?, ?)',
        [order_code.trim(), userId, status, amount],
      );
      return this.findById(result.insertId);
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(`order_code '${order_code}' already exists`);
      }
      throw err;
    }
  }

  async findById(order_id: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      `SELECT ${ORDER_COLUMNS} FROM orders WHERE order_id = ?`,
      [order_id],
    );
    return rows[0];
  }

  async findOwnedOrFail(order_id: number, userId: number) {
    const order = await this.findById(order_id);
    if (!order) {
      throw new NotFoundException(`Order ${order_id} not found`);
    }
    if (order.user_id !== this.normalizeUserId(userId)) {
      throw new ForbiddenException('You do not have access to this order');
    }
    return order;
  }

  async getAll() {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      `SELECT ${ORDER_COLUMNS} FROM orders ORDER BY order_id DESC`,
    );
    return rows;
  }

  async getAllByUser(userId: number) {
    const [rows] = await this.pool().execute<RowDataPacket[]>(
      `SELECT ${ORDER_COLUMNS} FROM orders WHERE user_id = ? ORDER BY order_id DESC`,
      [this.normalizeUserId(userId)],
    );
    return rows;
  }

  async updateOrder(
    order_id: number,
    partial: {
      order_code?: string;
      order_status?: OrderStatus;
      total_amount?: number;
    },
  ) {
    const fields: string[] = [];
    const values: any[] = [];

    if (partial.order_code) {
      fields.push('order_code = ?');
      values.push(partial.order_code.trim());
    }

    if (partial.order_status !== undefined && partial.order_status !== null) {
      fields.push('order_status = ?');
      values.push(this.normalizeStatus(partial.order_status));
    }

    if (partial.total_amount !== undefined && partial.total_amount !== null) {
      fields.push('total_amount = ?');
      values.push(this.normalizeAmount(partial.total_amount));
    }

    if (fields.length === 0) return this.findById(order_id);

    values.push(order_id);

    try {
      const [result] = await this.pool().execute<OkPacket>(
        `UPDATE orders SET ${fields.join(', ')} WHERE order_id = ?`,
        values,
      );
      if (result.affectedRows === 0) {
        throw new NotFoundException(`Order ${order_id} not found`);
      }
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          `order_code '${partial.order_code}' already exists`,
        );
      }
      throw err;
    }

    return this.findById(order_id);
  }

  async deleteOrder(order_id: number) {
    const [payments] = await this.pool().execute<RowDataPacket[]>(
      'SELECT 1 FROM payments WHERE order_id = ? LIMIT 1',
      [order_id],
    );
    if (payments.length > 0) {
      throw new ConflictException(
        `Order ${order_id} has payments and cannot be deleted`,
      );
    }

    const [result] = await this.pool().execute<OkPacket>(
      'DELETE FROM orders WHERE order_id = ?',
      [order_id],
    );
    return result.affectedRows > 0;
  }
}