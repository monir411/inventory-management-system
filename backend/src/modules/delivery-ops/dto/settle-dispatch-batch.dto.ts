import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class DispatchCollectionDto {
  @IsNumber()
  orderId: number;

  @IsNumber()
  collectedAmount: number;

  @IsString()
  @IsOptional()
  paymentMode?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class SettleDispatchBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DispatchCollectionDto)
  collections: DispatchCollectionDto[];

  @IsString()
  @IsOptional()
  note?: string;
}
