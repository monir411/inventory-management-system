import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DispatchBatch } from './dispatch-batch.entity';
import { Order } from '../../orders/entities/order.entity';
import { Product } from '../../products/entities/product.entity';
import { ColumnNumericTransformer } from '../../orders/orders.constants';

@Entity('damage_records')
export class DamageRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  batchId: number;

  @ManyToOne(() => DispatchBatch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batchId' })
  batch: DispatchBatch;

  @Column()
  orderId: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  quantity: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  reason?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;
}
