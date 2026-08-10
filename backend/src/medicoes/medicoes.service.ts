import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViveirosService } from '../viveiros/viveiros.service';
import { Medicao } from './entities/medicao.entity';
import { CreateMedicaoDto } from './dto/create-medicao.dto';

@Injectable()
export class MedicoesService {
  constructor(
    @InjectRepository(Medicao) private readonly medicoesRepository: Repository<Medicao>,
    private readonly viveirosService: ViveirosService,
  ) {}

  findAllByViveiro(viveiroId: number): Promise<Medicao[]> {
    return this.medicoesRepository.find({
      where: { viveiroId },
      order: { data: 'DESC' },
    });
  }

  async create(viveiroId: number, dto: CreateMedicaoDto): Promise<Medicao> {
    await this.viveirosService.findOne(viveiroId);
    return this.medicoesRepository.save(this.medicoesRepository.create({ ...dto, viveiroId }));
  }

  async update(viveiroId: number, id: number, dto: CreateMedicaoDto): Promise<Medicao> {
    const medicao = await this.findOneOrThrow(viveiroId, id);
    Object.assign(medicao, dto);
    return this.medicoesRepository.save(medicao);
  }

  async remove(viveiroId: number, id: number): Promise<void> {
    const medicao = await this.findOneOrThrow(viveiroId, id);
    await this.medicoesRepository.remove(medicao);
  }

  private async findOneOrThrow(viveiroId: number, id: number): Promise<Medicao> {
    const medicao = await this.medicoesRepository.findOne({ where: { id, viveiroId } });
    if (!medicao) {
      throw new NotFoundException('Medição não encontrada');
    }
    return medicao;
  }
}
