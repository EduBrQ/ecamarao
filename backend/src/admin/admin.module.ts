import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Viveiro } from '../viveiros/entities/viveiro.entity';
import { ColetaRacao } from '../racao/entities/coleta-racao.entity';
import { Mortalidade } from '../mortalidade/entities/mortalidade.entity';
import { Medicao } from '../medicoes/entities/medicao.entity';
import { Aerador } from '../aeradores/entities/aerador.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([Viveiro, ColetaRacao, Mortalidade, Medicao, Aerador])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
