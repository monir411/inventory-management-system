import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateDeliverySummaryItemDto {
  @IsInt()
  productId: number;

  @IsNumber()
  @Min(0)
  returnedQty: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsNumber()
  orderedQty?: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;
}

export class UpdateDeliverySummaryDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDeliverySummaryItemDto)
  items?: UpdateDeliverySummaryItemDto[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  finalize?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
