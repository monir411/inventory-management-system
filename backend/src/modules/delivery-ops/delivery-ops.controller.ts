import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Delete,
  Query,
} from '@nestjs/common';
import { DeliveryOpsService } from './delivery-ops.service';
import { CreateDeliveryPersonDto } from './dto/create-delivery-person.dto';
import { CreateDispatchBatchDto } from './dto/create-dispatch-batch.dto';
import { QueryDispatchBatchesDto } from './dto/query-dispatch-batches.dto';
import { RecordBatchReturnsDto } from './dto/record-batch-returns.dto';
import { SettleDispatchBatchDto } from './dto/settle-dispatch-batch.dto';

@Controller('delivery-ops')
export class DeliveryOpsController {
  constructor(private readonly deliveryOpsService: DeliveryOpsService) {}

  @Get('dashboard')
  getDashboard(@Query('date') date?: string) {
    return this.deliveryOpsService.getDashboard(date);
  }

  @Get('reports')
  getReports(@Query() query: QueryDispatchBatchesDto) {
    return this.deliveryOpsService.getReports(query);
  }

  @Get('personnel')
  getDeliveryPeople(@Query('includeInactive') includeInactive?: string) {
    return this.deliveryOpsService.getDeliveryPeople(includeInactive === 'true');
  }

  @Post('personnel')
  createDeliveryPerson(@Body() dto: CreateDeliveryPersonDto) {
    return this.deliveryOpsService.createDeliveryPerson(dto);
  }

  @Get('personnel/:id')
  getDeliveryPersonById(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryOpsService.getDeliveryPersonById(id);
  }

  @Patch('personnel/:id')
  updateDeliveryPerson(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateDeliveryPersonDto>,
  ) {
    return this.deliveryOpsService.updateDeliveryPerson(id, dto);
  }

  @Delete('personnel/:id')
  deleteDeliveryPerson(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryOpsService.deleteDeliveryPerson(id);
  }

  @Get('confirmed-orders')
  getEligibleOrders(@Query() query: QueryDispatchBatchesDto) {
    return this.deliveryOpsService.getEligibleOrders(query);
  }

  @Get('batches')
  getDispatchBatches(@Query() query: QueryDispatchBatchesDto) {
    return this.deliveryOpsService.getDispatchBatches(query);
  }

  @Post('batches')
  createDispatchBatch(@Body() dto: CreateDispatchBatchDto) {
    return this.deliveryOpsService.createDispatchBatch(dto);
  }

  @Get('batches/:id')
  getDispatchBatch(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryOpsService.getDispatchBatch(id);
  }

  @Get('batches/:id/reports/morning')
  getMorningReport(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryOpsService.getMorningReport(id);
  }

  @Get('batches/:id/reports/final')
  getFinalReport(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryOpsService.getFinalReport(id);
  }

  @Patch('batches/:id/print-morning')
  printMorning(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryOpsService.markMorningPrinted(id);
  }

  @Patch('batches/:id/dispatch')
  dispatchBatch(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryOpsService.dispatchBatch(id);
  }

  @Post('batches/:id/returns')
  recordReturns(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordBatchReturnsDto,
  ) {
    return this.deliveryOpsService.recordReturns(id, dto);
  }

  @Post('batches/:id/settlement')
  settleBatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SettleDispatchBatchDto,
  ) {
    return this.deliveryOpsService.settleBatch(id, dto);
  }
}
