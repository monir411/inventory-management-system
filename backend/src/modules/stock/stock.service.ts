import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { Product } from '../products/entities/product.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { QueryStockMovementsDto } from './dto/query-stock-movements.dto';
import { StockSummaryQueryDto } from './dto/stock-summary-query.dto';
import { StockMovement } from './entities/stock-movement.entity';
import { StockMovementType } from './enums/stock-movement-type.enum';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementsRepository: Repository<StockMovement>,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  createOpeningStock(createStockMovementDto: CreateStockMovementDto) {
    this.validatePositiveQuantity(
      createStockMovementDto.quantity,
      'Opening stock',
    );
    return this.createMovement(
      StockMovementType.OPENING,
      createStockMovementDto,
    );
  }

  createStockIn(createStockMovementDto: CreateStockMovementDto) {
    this.validatePositiveQuantity(createStockMovementDto.quantity, 'Stock in');
    return this.createMovement(
      StockMovementType.STOCK_IN,
      createStockMovementDto,
    );
  }

  createAdjustment(createStockMovementDto: CreateStockMovementDto) {
    if (createStockMovementDto.quantity === 0) {
      throw new BadRequestException('Adjustment quantity cannot be zero.');
    }

    return this.createMovement(
      StockMovementType.ADJUSTMENT,
      createStockMovementDto,
    );
  }

  async findMovements(query: QueryStockMovementsDto) {
    await this.ensureCompanyExists(query.companyId);

    const queryBuilder = this.stockMovementsRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.company', 'company')
      .leftJoinAndSelect('movement.product', 'product')
      .where('movement.companyId = :companyId', {
        companyId: query.companyId,
      });

    if (query.productId) {
      queryBuilder.andWhere('movement.productId = :productId', {
        productId: query.productId,
      });
    }

    if (query.type) {
      queryBuilder.andWhere('movement.type = :type', { type: query.type });
    }

    if (query.fromDate) {
      queryBuilder.andWhere('movement.movementDate >= :fromDate', {
        fromDate: query.fromDate,
      });
    }

    if (query.toDate) {
      queryBuilder.andWhere('movement.movementDate <= :toDate', {
        toDate: query.toDate,
      });
    }

    return queryBuilder
      .orderBy('movement.movementDate', 'DESC')
      .addOrderBy('movement.createdAt', 'DESC')
      .getMany();
  }

  async getCurrentStockSummary(query: StockSummaryQueryDto) {
    if (query.companyId) {
      await this.ensureCompanyExists(query.companyId);
    }

    return this.buildStockSummary(query);
  }

  async getLowStockProducts(query: StockSummaryQueryDto) {
    if (query.companyId) {
      await this.ensureCompanyExists(query.companyId);
    }

    const threshold = query.threshold ?? 10;
    const summary = await this.buildStockSummary(query);

    return summary.filter(
      (item) => item.currentStock > 0 && item.currentStock <= threshold,
    );
  }

  async getZeroStockProducts(query: StockSummaryQueryDto) {
    if (query.companyId) {
      await this.ensureCompanyExists(query.companyId);
    }

    const summary = await this.buildStockSummary(query);
    return summary.filter((item) => item.currentStock === 0);
  }

  private async createMovement(
    type: StockMovementType,
    createStockMovementDto: CreateStockMovementDto,
  ) {
    const company = await this.companiesRepository.findOne({
      where: { id: createStockMovementDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    if (!company.isActive) {
      throw new BadRequestException(
        'Stock movement cannot be created for an inactive company.',
      );
    }

    const product = await this.productsRepository.findOne({
      where: { id: createStockMovementDto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    if (!product.isActive) {
      throw new BadRequestException(
        'Stock movement cannot be created for an inactive product.',
      );
    }

    if (product.companyId !== company.id) {
      throw new BadRequestException(
        'Product does not belong to the provided company.',
      );
    }

    const movement = this.stockMovementsRepository.create({
      ...createStockMovementDto,
      note: createStockMovementDto.note ?? null,
      type,
    });

    return this.stockMovementsRepository.save(movement);
  }

  private validatePositiveQuantity(quantity: number, label: string) {
    if (quantity <= 0) {
      throw new BadRequestException(
        `${label} quantity must be greater than zero.`,
      );
    }
  }

  private async ensureCompanyExists(companyId: number) {
    const company = await this.companiesRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found.');
    }
  }

  private async buildStockSummary(query: StockSummaryQueryDto) {
    const threshold = query.threshold ?? 10;
    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoin('product.company', 'company')
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('movement.productId', 'productId')
            .addSelect('movement.companyId', 'companyId')
            .addSelect(
              `
                SUM(
                  CASE
                    WHEN movement.type = :saleOutType THEN -movement.quantity
                    ELSE movement.quantity
                  END
                )
              `,
              'currentStock',
            )
            .from(StockMovement, 'movement')
            .groupBy('movement.productId')
            .addGroupBy('movement.companyId'),
        'stock_summary',
        '"stock_summary"."productId" = product.id AND "stock_summary"."companyId" = product.companyId',
        {
          saleOutType: StockMovementType.SALE_OUT,
        },
      )
      .where('1 = 1');

    if (query.companyId) {
      queryBuilder.andWhere('product.companyId = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        `(
          product.name ILIKE :search
          OR product.sku ILIKE :search
          OR product.unit::text ILIKE :search
          OR company.name ILIKE :search
          OR company.code ILIKE :search
        )`,
        {
          search: `%${query.search}%`,
        },
      );
    }

    const stockRows = await queryBuilder
      .select('product.id', 'productId')
      .addSelect('product.companyId', 'companyId')
      .addSelect('company.name', 'companyName')
      .addSelect('company.code', 'companyCode')
      .addSelect('company.isActive', 'companyIsActive')
      .addSelect('product.name', 'productName')
      .addSelect('product.sku', 'sku')
      .addSelect('product.unit', 'unit')
      .addSelect('product.isActive', 'isActive')
      .addSelect('COALESCE("stock_summary"."currentStock", 0)', 'currentStock')
      .orderBy('product.name', 'ASC')
      .getRawMany<{
        productId: string;
        companyId: string;
        companyName: string;
        companyCode: string;
        companyIsActive: boolean | string;
        productName: string;
        sku: string;
        unit: string;
        isActive: boolean | string;
        currentStock: string;
      }>();

    return stockRows.map((row) => ({
      productId: Number(row.productId),
      companyId: Number(row.companyId),
      company: {
        id: Number(row.companyId),
        name: row.companyName,
        code: row.companyCode,
        isActive:
          typeof row.companyIsActive === 'boolean'
            ? row.companyIsActive
            : row.companyIsActive === 'true',
      },
      productName: row.productName,
      sku: row.sku,
      unit: row.unit,
      isActive:
        typeof row.isActive === 'boolean'
          ? row.isActive
          : row.isActive === 'true',
      currentStock: Number(row.currentStock),
      isLowStock:
        Number(row.currentStock) > 0 && Number(row.currentStock) <= threshold,
      isZeroStock: Number(row.currentStock) === 0,
    }));
  }
}
