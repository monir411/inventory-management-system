import { Repository } from 'typeorm';
import { Route } from '../routes/entities/route.entity';
import { CreateShopDto } from './dto/create-shop.dto';
import { QueryShopsDto } from './dto/query-shops.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { Shop } from './entities/shop.entity';
export declare class ShopsService {
    private readonly shopsRepository;
    private readonly routesRepository;
    constructor(shopsRepository: Repository<Shop>, routesRepository: Repository<Route>);
    create(createShopDto: CreateShopDto): Promise<Shop>;
    findAll(query: QueryShopsDto): Promise<Shop[]>;
    findOne(id: number): Promise<Shop>;
    update(id: number, updateShopDto: UpdateShopDto): Promise<Shop>;
    deactivate(id: number): Promise<Shop>;
    listByRoute(routeId: number): Promise<Shop[]>;
    private findRouteOrFail;
    private ensureRouteIsActive;
    private ensureUniqueShopName;
}
