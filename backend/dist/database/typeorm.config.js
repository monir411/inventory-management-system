"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeOrmConfig = void 0;
const config_1 = require("@nestjs/config");
const createTypeOrmOptions = (configService) => {
    const databaseUrl = configService.get('database.url');
    const synchronize = configService.get('database.synchronize', false);
    const dropSchema = configService.get('database.dropSchema', false);
    return {
        type: 'postgres',
        url: databaseUrl,
        autoLoadEntities: true,
        synchronize,
        dropSchema,
        migrationsRun: false,
        ssl: { rejectUnauthorized: false },
    };
};
exports.typeOrmConfig = {
    imports: [config_1.ConfigModule],
    inject: [config_1.ConfigService],
    useFactory: (configService) => createTypeOrmOptions(configService),
};
//# sourceMappingURL=typeorm.config.js.map