import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDispatchBatchDto {
  @IsDateString()
  dispatchDate: string;

  @IsNumber()
  @IsOptional()
  companyId?: number;

  @IsNumber()
  routeId: number;

  @IsNumber()
  deliveryPersonId: number;

  @IsString()
  @IsOptional()
  marketArea?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  orderIds: number[];
}
