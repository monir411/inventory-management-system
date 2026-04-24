import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SettleOrderItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  returnedQuantity: number;

  @IsNumber()
  damagedQuantity: number;
}

export class SettleOrderDto {
  @ValidateNested({ each: true })
  @Type(() => SettleOrderItemDto)
  items: SettleOrderItemDto[];

  @IsNumber()
  @IsOptional()
  collectedAmount?: number;

  @IsString()
  @IsOptional()
  settlementNote?: string;
}
