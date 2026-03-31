import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';

type DatabaseConfig = {
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  name?: string;
  ssl: boolean;
};

type RuntimeConfig = {
  nodeEnv: string;
  database: DatabaseConfig;
};

const buildBaseTypeOrmOptions = ({
  nodeEnv,
  database,
}: RuntimeConfig): DataSourceOptions => {
  const baseOptions: DataSourceOptions = {
    type: 'postgres',
    synchronize: false,
    logging: nodeEnv !== 'production',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    ssl: database.ssl ? { rejectUnauthorized: false } : false,
  };

  if (database.url) {
    return {
      ...baseOptions,
      url: database.url,
    };
  }

  return {
    ...baseOptions,
    host: database.host,
    port: database.port,
    username: database.username,
    password: database.password,
    database: database.name,
  };
};

export const buildTypeOrmOptions = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const database = configService.getOrThrow<DatabaseConfig>('database');

  return {
    ...buildBaseTypeOrmOptions({
      nodeEnv: configService.getOrThrow<string>('nodeEnv'),
      database,
    }),
    autoLoadEntities: false,
  };
};

export const buildDataSourceOptions = (
  runtimeConfig: RuntimeConfig,
): DataSourceOptions => buildBaseTypeOrmOptions(runtimeConfig);
