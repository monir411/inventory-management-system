import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RecordBatchReturnItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  dispatchedQuantity: number;

  @IsNumber()
  returnedQuantity: number;

  @IsNumber()
  damagedQuantity: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

class RecordBatchReturnOrderDto {
  @IsNumber()
  orderId: number;

  @IsString()
  @IsOptional()
  returnReason?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecordBatchReturnItemDto)
  items: RecordBatchReturnItemDto[];
}

export class RecordBatchReturnsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecordBatchReturnOrderDto)
  orders: RecordBatchReturnOrderDto[];

  @IsString()
  @IsOptional()
  note?: string;
}
