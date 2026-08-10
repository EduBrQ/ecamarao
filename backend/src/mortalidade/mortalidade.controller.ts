import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MortalidadeService } from './mortalidade.service';
import { CreateMortalidadeDto } from './dto/create-mortalidade.dto';

@Controller('viveiros/:viveiroId/mortalidade')
@UseGuards(JwtAuthGuard)
export class MortalidadeController {
  constructor(private readonly mortalidadeService: MortalidadeService) {}

  @Get()
  findAll(@Param('viveiroId', ParseIntPipe) viveiroId: number) {
    return this.mortalidadeService.findAllByViveiro(viveiroId);
  }

  @Post()
  create(@Param('viveiroId', ParseIntPipe) viveiroId: number, @Body() dto: CreateMortalidadeDto) {
    return this.mortalidadeService.create(viveiroId, dto);
  }

  @Put(':id')
  update(
    @Param('viveiroId', ParseIntPipe) viveiroId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMortalidadeDto,
  ) {
    return this.mortalidadeService.update(viveiroId, id, dto);
  }

  @Delete(':id')
  async remove(@Param('viveiroId', ParseIntPipe) viveiroId: number, @Param('id', ParseIntPipe) id: number) {
    await this.mortalidadeService.remove(viveiroId, id);
    return { message: 'Registro de mortalidade deletado com sucesso' };
  }
}
