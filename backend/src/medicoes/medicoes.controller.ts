import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MedicoesService } from './medicoes.service';
import { CreateMedicaoDto } from './dto/create-medicao.dto';

@Controller('viveiros/:viveiroId/medicoes')
@UseGuards(JwtAuthGuard)
export class MedicoesController {
  constructor(private readonly medicoesService: MedicoesService) {}

  @Get()
  findAll(@Param('viveiroId', ParseIntPipe) viveiroId: number) {
    return this.medicoesService.findAllByViveiro(viveiroId);
  }

  @Post()
  create(@Param('viveiroId', ParseIntPipe) viveiroId: number, @Body() dto: CreateMedicaoDto) {
    return this.medicoesService.create(viveiroId, dto);
  }

  @Put(':id')
  update(
    @Param('viveiroId', ParseIntPipe) viveiroId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMedicaoDto,
  ) {
    return this.medicoesService.update(viveiroId, id, dto);
  }

  @Delete(':id')
  async remove(@Param('viveiroId', ParseIntPipe) viveiroId: number, @Param('id', ParseIntPipe) id: number) {
    await this.medicoesService.remove(viveiroId, id);
    return { message: 'Medição deletada com sucesso' };
  }
}
