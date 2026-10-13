import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { OrdersModule } from './orders/orders.module'; 
import { PaymentsModule } from './payments/payments.module';
import { DeliveryModule } from './delivery/delivery.module';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule, OrdersModule, PaymentsModule, DeliveryModule],
})

export class AppModule {}