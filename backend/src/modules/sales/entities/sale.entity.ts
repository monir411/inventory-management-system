import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { numericColumnTransformer } from '../../../common/database/numeric.transformer';
import { Company } from '../../companies/entities/company.entity';
import { Route } from '../../routes/entities/route.entity';
import { Shop } from '../../shops/entities/shop.entity';
import { SaleItem } from './sale-item.entity';
import { SalePayment } from './sale-payment.entity';

@Entity({ name: 'sales' })
@Index(['companyId', 'saleDate'])
@Index(['routeId', 'saleDate'])
@Index(['shopId', 'saleDate'])
@Index(['invoiceNo'], { unique: true })
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  companyId: number;

  @Column()
  routeId: number;

  @Column({ nullable: true })
  shopId: number | null;

  @Column({ type: 'timestamptz' })
  saleDate: Date;

  @Column({ length: 60 })
  invoiceNo: string;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: numericColumnTransformer,
  })
  totalAmount: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: numericColumnTransformer,
  })
  paidAmount: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: numericColumnTransformer,
  })
  dueAmount: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: numericColumnTransformer,
  })
  totalProfit: number;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Company, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => Route, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'routeId' })
  route: Route;

  @ManyToOne(() => Shop, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'shopId' })
  shop: Shop | null;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.sale, {
    cascade: false,
  })
  items: SaleItem[];

  @OneToMany(() => SalePayment, (salePayment) => salePayment.sale, {
    cascade: false,
  })
  payments: SalePayment[];
}
