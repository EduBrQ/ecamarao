import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViveirosService } from '../viveiros/viveiros.service';
import { Mortalidade } from './entities/mortalidade.entity';
import { CreateMortalidadeDto } from './dto/create-mortalidade.dto';

@Injectable()
export class MortalidadeService {
  constructor(
    @InjectRepository(Mortalidade) private readonly mortalidadeRepository: Repository<Mortalidade>,
    private readonly viveirosService: ViveirosService,
  ) {}

  findAllByViveiro(viveiroId: number): Promise<Mortalidade[]> {
    return this.mortalidadeRepository.find({
      where: { viveiroId },
      order: { data: 'DESC' },
    });
  }

  async create(viveiroId: number, dto: CreateMortalidadeDto): Promise<Mortalidade> {
    await this.viveirosService.findOne(viveiroId);
    return this.mortalidadeRepository.save(this.mortalidadeRepository.create({ ...dto, viveiroId }));
  }

  async update(viveiroId: number, id: number, dto: CreateMortalidadeDto): Promise<Mortalidade> {
    const registro = await this.findOneOrThrow(viveiroId, id);
    Object.assign(registro, dto);
    return this.mortalidadeRepository.save(registro);
  }

  async remove(viveiroId: number, id: number): Promise<void> {
    const registro = await this.findOneOrThrow(viveiroId, id);
    await this.mortalidadeRepository.remove(registro);
  }

  private async findOneOrThrow(viveiroId: number, id: number): Promise<Mortalidade> {
    const registro = await this.mortalidadeRepository.findOne({ where: { id, viveiroId } });
    if (!registro) {
      throw new NotFoundException('Registro de mortalidade não encontrado');
    }
    return registro;
  }
}
