import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { numericColumnTransformer } from '../../../common/database/numeric.transformer';
import { Sale } from './sale.entity';

@Entity({ name: 'sale_payments' })
@Index(['saleId'])
@Index(['paymentDate'])
export class SalePayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  saleId: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: numericColumnTransformer,
  })
  amount: number;

  @Column({ type: 'timestamptz' })
  paymentDate: Date;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Sale, (sale) => sale.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;
}
