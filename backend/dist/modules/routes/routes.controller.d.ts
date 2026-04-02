import { CreateRouteDto } from './dto/create-route.dto';
import { QueryRoutesDto } from './dto/query-routes.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RoutesService } from './routes.service';
export declare class RoutesController {
    private readonly routesService;
    constructor(routesService: RoutesService);
    create(createRouteDto: CreateRouteDto): Promise<import("./entities/route.entity").Route>;
    findAll(query: QueryRoutesDto): Promise<import("./entities/route.entity").Route[]>;
    findOne(id: number): Promise<import("./entities/route.entity").Route>;
    listShops(id: number): Promise<import("../shops/entities/shop.entity").Shop[]>;
    update(id: number, updateRouteDto: UpdateRouteDto): Promise<import("./entities/route.entity").Route>;
    deactivate(id: number): Promise<import("./entities/route.entity").Route>;
}
