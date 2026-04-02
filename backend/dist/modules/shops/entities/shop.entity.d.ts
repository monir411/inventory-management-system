import { Route } from '../../routes/entities/route.entity';
export declare class Shop {
    id: number;
    routeId: number;
    name: string;
    ownerName: string | null;
    phone: string | null;
    address: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    route: Route;
}
