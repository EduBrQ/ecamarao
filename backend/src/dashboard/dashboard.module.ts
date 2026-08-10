import { Module } from '@nestjs/common';
import { ViveirosModule } from '../viveiros/viveiros.module';
import { RacaoModule } from '../racao/racao.module';
import { MortalidadeModule } from '../mortalidade/mortalidade.module';
import { UsersModule } from '../users/users.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [ViveirosModule, RacaoModule, MortalidadeModule, UsersModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
