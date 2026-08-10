import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViveirosModule } from '../viveiros/viveiros.module';
import { Medicao } from './entities/medicao.entity';
import { MedicoesService } from './medicoes.service';
import { MedicoesController } from './medicoes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Medicao]), ViveirosModule],
  providers: [MedicoesService],
  controllers: [MedicoesController],
  exports: [MedicoesService],
})
export class MedicoesModule {}
