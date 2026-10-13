import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})

export class DeliveryModule {}