import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ViveirosService } from './viveiros.service';
import { CreateViveiroDto } from './dto/create-viveiro.dto';
import { UpdateViveiroDto } from './dto/update-viveiro.dto';

@Controller('viveiros')
@UseGuards(JwtAuthGuard)
export class ViveirosController {
  constructor(private readonly viveirosService: ViveirosService) {}

  @Get()
  findAll() {
    return this.viveirosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.viveirosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateViveiroDto) {
    return this.viveirosService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateViveiroDto) {
    return this.viveirosService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.viveirosService.remove(id);
    return { message: 'Viveiro deletado com sucesso' };
  }
}
