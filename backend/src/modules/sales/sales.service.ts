import { Injectable } from '@nestjs/common';

@Injectable()
export class SalesService {
  async findAll() { return { items: [], totalItems: 0 }; }
  async findOne(id: number) { return null; }
  async create(dto: any) { return null; }
  async update(id: number, dto: any) { return null; }
  async delete(id: number) { return null; }
  async receivePayment(id: number, dto: any) { return null; }
}
