import { Shop } from '../../shops/entities/shop.entity';
export declare class Route {
    id: number;
    name: string;
    area: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    shops: Shop[];
}
