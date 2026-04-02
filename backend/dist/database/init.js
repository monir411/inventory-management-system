"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
async function bootstrap() {
    process.env.DB_SYNCHRONIZE = 'true';
    process.env.DB_DROP_SCHEMA = 'false';
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    common_1.Logger.log('Database initialization completed. Tables are synchronized without any demo data.', 'DatabaseInit');
    await app.close();
}
void bootstrap();
//# sourceMappingURL=init.js.map