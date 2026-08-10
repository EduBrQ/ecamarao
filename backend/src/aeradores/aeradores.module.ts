import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViveirosModule } from '../viveiros/viveiros.module';
import { Aerador } from './entities/aerador.entity';
import { AeradoresService } from './aeradores.service';
import { AeradoresController } from './aeradores.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Aerador]), ViveirosModule],
  providers: [AeradoresService],
  controllers: [AeradoresController],
  exports: [AeradoresService],
})
export class AeradoresModule {}
