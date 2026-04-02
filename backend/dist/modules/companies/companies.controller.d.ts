import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { QueryCompaniesDto } from './dto/query-companies.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
export declare class CompaniesController {
    private readonly companiesService;
    constructor(companiesService: CompaniesService);
    create(createCompanyDto: CreateCompanyDto): Promise<import("./entities/company.entity").Company>;
    findAll(query: QueryCompaniesDto): Promise<import("./entities/company.entity").Company[]>;
    findOne(id: number): Promise<import("./entities/company.entity").Company>;
    update(id: number, updateCompanyDto: UpdateCompanyDto): Promise<import("./entities/company.entity").Company>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}
