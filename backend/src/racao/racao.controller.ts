import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RacaoService } from './racao.service';
import { UpsertRacaoDto } from './dto/upsert-racao.dto';

@Controller('viveiros/:viveiroId/racao')
@UseGuards(JwtAuthGuard)
export class RacaoController {
  constructor(private readonly racaoService: RacaoService) {}

  @Get()
  findAll(@Param('viveiroId', ParseIntPipe) viveiroId: number) {
    return this.racaoService.findAllByViveiro(viveiroId);
  }

  @Post()
  upsert(@Param('viveiroId', ParseIntPipe) viveiroId: number, @Body() dto: UpsertRacaoDto) {
    return this.racaoService.upsert(viveiroId, dto);
  }

  @Put(':id')
  update(
    @Param('viveiroId', ParseIntPipe) viveiroId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertRacaoDto,
  ) {
    return this.racaoService.update(viveiroId, id, dto);
  }

  @Delete(':id')
  async remove(@Param('viveiroId', ParseIntPipe) viveiroId: number, @Param('id', ParseIntPipe) id: number) {
    await this.racaoService.remove(viveiroId, id);
    return { message: 'Coleta de ração deletada com sucesso' };
  }
}
