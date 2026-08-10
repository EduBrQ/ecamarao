import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AeradoresService } from './aeradores.service';
import { UpsertAeradorDto } from './dto/upsert-aerador.dto';

@Controller('viveiros/:viveiroId/aeradores')
@UseGuards(JwtAuthGuard)
export class AeradoresController {
  constructor(private readonly aeradoresService: AeradoresService) {}

  @Get()
  findAll(@Param('viveiroId', ParseIntPipe) viveiroId: number) {
    return this.aeradoresService.findAllByViveiro(viveiroId);
  }

  @Post()
  create(@Param('viveiroId', ParseIntPipe) viveiroId: number, @Body() dto: UpsertAeradorDto) {
    return this.aeradoresService.create(viveiroId, dto);
  }

  @Put(':id')
  update(
    @Param('viveiroId', ParseIntPipe) viveiroId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertAeradorDto,
  ) {
    return this.aeradoresService.update(viveiroId, id, dto);
  }

  @Delete(':id')
  async remove(@Param('viveiroId', ParseIntPipe) viveiroId: number, @Param('id', ParseIntPipe) id: number) {
    await this.aeradoresService.remove(viveiroId, id);
    return { message: 'Aerador deletado com sucesso' };
  }
}
