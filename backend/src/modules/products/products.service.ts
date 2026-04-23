import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
  ) { }

  async create(createProductDto: CreateProductDto) {
    await this.ensureCompanyExists(createProductDto.companyId);
    await this.ensureUniqueSku(
      createProductDto.companyId,
      createProductDto.sku,
    );

    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  async findAll(query: QueryProductsDto) {
    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.company', 'company')
      .orderBy('product.name', 'ASC');

    if (query.companyId) {
      queryBuilder.andWhere('product.companyId = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: {
        company: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);
    const nextCompanyId = updateProductDto.companyId ?? product.companyId;
    const nextSku = updateProductDto.sku ?? product.sku;

    await this.ensureCompanyExists(nextCompanyId);

    if (nextCompanyId !== product.companyId || nextSku !== product.sku) {
      await this.ensureUniqueSku(nextCompanyId, nextSku, product.id);
    }

    Object.assign(product, updateProductDto);
    return this.productsRepository.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
    return { success: true };
  }

  private async ensureCompanyExists(companyId: number) {
    const company = await this.companiesRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found.');
    }
  }

  private async ensureUniqueSku(
    companyId: number,
    sku: string,
    excludeProductId?: number,
  ) {
    const existingProduct = await this.productsRepository.findOne({
      where: { companyId, sku },
    });

    if (existingProduct && existingProduct.id !== excludeProductId) {
      throw new ConflictException(
        'Product SKU already exists for this company.',
      );
    }
  }
}
