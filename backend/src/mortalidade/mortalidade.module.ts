import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViveirosModule } from '../viveiros/viveiros.module';
import { Mortalidade } from './entities/mortalidade.entity';
import { MortalidadeService } from './mortalidade.service';
import { MortalidadeController } from './mortalidade.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Mortalidade]), ViveirosModule],
  providers: [MortalidadeService],
  controllers: [MortalidadeController],
  exports: [MortalidadeService],
})
export class MortalidadeModule {}
