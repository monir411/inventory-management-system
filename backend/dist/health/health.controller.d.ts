import { ConfigService } from '@nestjs/config';
export declare class HealthController {
    private readonly configService;
    constructor(configService: ConfigService);
    getApiInfo(): {
        name: string;
        status: string;
        environment: string | undefined;
        frontendUrl: string | undefined;
        docs: {
            health: string;
        };
    };
    getHealth(): {
        status: string;
        database: string;
        timestamp: string;
    };
}
