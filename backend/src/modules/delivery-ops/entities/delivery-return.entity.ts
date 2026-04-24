import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DispatchBatch } from './dispatch-batch.entity';
import { DispatchBatchOrder } from './dispatch-batch-order.entity';
import { DeliveryReturnItem } from './delivery-return-item.entity';

@Entity('delivery_returns')
export class DeliveryReturn {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  batchId: number;

  @ManyToOne(() => DispatchBatch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batchId' })
  batch: DispatchBatch;

  @Column()
  batchOrderId: number;

  @ManyToOne(() => DispatchBatchOrder, (batchOrder) => batchOrder.returns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'batchOrderId' })
  batchOrder: DispatchBatchOrder;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  returnReason?: string;

  @OneToMany(() => DeliveryReturnItem, (item) => item.deliveryReturn, {
    cascade: true,
  })
  items: DeliveryReturnItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
