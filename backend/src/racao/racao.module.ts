import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViveirosModule } from '../viveiros/viveiros.module';
import { ColetaRacao } from './entities/coleta-racao.entity';
import { RacaoService } from './racao.service';
import { RacaoController } from './racao.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ColetaRacao]), ViveirosModule],
  providers: [RacaoService],
  controllers: [RacaoController],
  exports: [RacaoService],
})
export class RacaoModule {}
