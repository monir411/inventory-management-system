"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
async function bootstrap() {
    process.env.DB_SYNCHRONIZE = 'true';
    process.env.DB_DROP_SCHEMA = 'true';
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    common_1.Logger.warn('Database reset completed. Existing schema was dropped and recreated without any demo data.', 'DatabaseReset');
    await app.close();
}
void bootstrap();
//# sourceMappingURL=reset.js.map