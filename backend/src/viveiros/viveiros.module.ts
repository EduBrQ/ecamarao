import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Viveiro } from './entities/viveiro.entity';
import { ViveirosService } from './viveiros.service';
import { ViveirosController } from './viveiros.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Viveiro])],
  providers: [ViveirosService],
  controllers: [ViveirosController],
  exports: [ViveirosService],
})
export class ViveirosModule {}
