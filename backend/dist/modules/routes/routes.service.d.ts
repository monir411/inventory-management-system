import { Repository } from 'typeorm';
import { Shop } from '../shops/entities/shop.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { QueryRoutesDto } from './dto/query-routes.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route } from './entities/route.entity';
export declare class RoutesService {
    private readonly routesRepository;
    private readonly shopsRepository;
    constructor(routesRepository: Repository<Route>, shopsRepository: Repository<Shop>);
    create(createRouteDto: CreateRouteDto): Promise<Route>;
    findAll(query: QueryRoutesDto): Promise<Route[]>;
    findOne(id: number): Promise<Route>;
    update(id: number, updateRouteDto: UpdateRouteDto): Promise<Route>;
    deactivate(id: number): Promise<Route>;
    listShops(id: number): Promise<Shop[]>;
    private ensureUniqueName;
    private findRouteEntity;
}
