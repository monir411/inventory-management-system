import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class QuerySalesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  companyId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  routeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  shopId?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fromDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  toDate?: Date;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    return String(value).toLowerCase() === 'true';
  })
  @IsBoolean()
  dueOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  search?: string;
}
