import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RowDataPacket, OkPacket } from 'mysql2';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DeliveryService {
  constructor(private db: DatabaseService) {}

  private pool = () => this.db.getPool();

  async createDelivery(
  order_id: number,
  delivery_code: string,
  delivery_address: string,
  courier_name: string,
  delivery_status = 'Pending',
  delivery_date: string | null = null,
) {
  const [result] = await this.pool().execute<OkPacket>(
    'INSERT INTO delivery (order_id, delivery_code, delivery_address, courier_name, delivery_status, delivery_date) VALUES (?, ?, ?, ?, ?, ?)',
    [order_id, delivery_code, delivery_address, courier_name, delivery_status, delivery_date ?? null],
  );
  return { delivery_id: result.insertId, order_id, delivery_code, delivery_address, courier_name, delivery_status, delivery_date };
}

async findById(delivery_id: number) {
  const [rows] = await this.pool().execute<RowDataPacket[]>(
    'SELECT delivery_id, order_id, delivery_code, delivery_address, delivery_date, delivery_status, courier_name FROM delivery WHERE delivery_id = ?',
    [delivery_id],
  );
  return rows[0];
}

async getAll() {
  const [rows] = await this.pool().execute<RowDataPacket[]>(
    'SELECT delivery_id, order_id, delivery_code, delivery_address, delivery_date, delivery_status, courier_name FROM delivery',
  );
  return rows;
}

async updateDelivery(
  delivery_id: number,
  partial: {
    order_id?: number;
    delivery_code?: string;
    delivery_address?: string;
    delivery_date?: string;
    delivery_status?: string;
    courier_name?: string;
  },
) {
  const fields: string[] = [];
  const values: any[] = [];

  for (const key of ['order_id', 'delivery_code', 'delivery_address', 'delivery_date', 'delivery_status', 'courier_name'] as const) {
    if (partial[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(partial[key]);
    }
  }

  if (fields.length === 0) return await this.findById(delivery_id);

  values.push(delivery_id);
  await this.pool().execute(`UPDATE delivery SET ${fields.join(', ')} WHERE delivery_id = ?`, values);
  return this.findById(delivery_id);
}

async deleteDelivery(delivery_id: number) {
  const [result] = await this.pool().execute<OkPacket>(
    'DELETE FROM delivery WHERE delivery_id = ?',
    [delivery_id],
  );
  return result.affectedRows > 0;
}
}