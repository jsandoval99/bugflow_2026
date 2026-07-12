import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

const isProduction = process.env.NODE_ENV === 'production';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: isProduction
        ? { rejectUnauthorized: false }
        : false,
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
    })
  ],
})
export class DatabaseModule {}