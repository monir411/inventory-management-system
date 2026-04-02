import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { QueryCompaniesDto } from './dto/query-companies.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
export declare class CompaniesService {
    private readonly companiesRepository;
    private readonly productsRepository;
    constructor(companiesRepository: Repository<Company>, productsRepository: Repository<Product>);
    create(createCompanyDto: CreateCompanyDto): Promise<Company>;
    findAll(query: QueryCompaniesDto): Promise<Company[]>;
    findOne(id: number): Promise<Company>;
    update(id: number, updateCompanyDto: UpdateCompanyDto): Promise<Company>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}
