import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
export declare class ProductsService {
    private readonly productsRepository;
    private readonly companiesRepository;
    private readonly stockMovementsRepository;
    constructor(productsRepository: Repository<Product>, companiesRepository: Repository<Company>, stockMovementsRepository: Repository<StockMovement>);
    create(createProductDto: CreateProductDto): Promise<Product>;
    findAll(query: QueryProductsDto): Promise<Product[]>;
    findOne(id: number): Promise<Product>;
    update(id: number, updateProductDto: UpdateProductDto): Promise<Product>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
    private ensureCompanyExists;
    private ensureUniqueSku;
}
