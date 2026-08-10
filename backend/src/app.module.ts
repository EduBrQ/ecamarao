import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SeedModule } from './database/seed.module';
import { ViveirosModule } from './viveiros/viveiros.module';
import { RacaoModule } from './racao/racao.module';
import { MedicoesModule } from './medicoes/medicoes.module';
import { MortalidadeModule } from './mortalidade/mortalidade.module';
import { AeradoresModule } from './aeradores/aeradores.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'ecamarao'),
        password: config.get<string>('DB_PASSWORD', 'ecamarao'),
        database: config.get<string>('DB_NAME', 'ecamarao'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
      }),
    }),
    AuthModule,
    UsersModule,
    SeedModule,
    ViveirosModule,
    RacaoModule,
    MedicoesModule,
    MortalidadeModule,
    AeradoresModule,
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
