import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViveirosService } from '../viveiros/viveiros.service';
import { ColetaRacao } from './entities/coleta-racao.entity';
import { UpsertRacaoDto } from './dto/upsert-racao.dto';

@Injectable()
export class RacaoService {
  constructor(
    @InjectRepository(ColetaRacao) private readonly racaoRepository: Repository<ColetaRacao>,
    private readonly viveirosService: ViveirosService,
  ) {}

  findAllByViveiro(viveiroId: number): Promise<ColetaRacao[]> {
    return this.racaoRepository.find({
      where: { viveiroId },
      order: { data: 'DESC' },
    });
  }

  async upsert(viveiroId: number, dto: UpsertRacaoDto): Promise<ColetaRacao> {
    await this.viveirosService.findOne(viveiroId);

    const existing = await this.racaoRepository.findOne({
      where: { viveiroId, data: dto.data },
    });

    const coleta = existing ?? this.racaoRepository.create({ viveiroId, data: dto.data });
    coleta.qntManha = dto.qnt_manha ?? 0;
    coleta.qntTarde = dto.qnt_tarde ?? 0;
    return this.racaoRepository.save(coleta);
  }

  async update(viveiroId: number, id: number, dto: UpsertRacaoDto): Promise<ColetaRacao> {
    const coleta = await this.findOneOrThrow(viveiroId, id);
    coleta.data = dto.data;
    coleta.qntManha = dto.qnt_manha ?? 0;
    coleta.qntTarde = dto.qnt_tarde ?? 0;
    return this.racaoRepository.save(coleta);
  }

  async remove(viveiroId: number, id: number): Promise<void> {
    const coleta = await this.findOneOrThrow(viveiroId, id);
    await this.racaoRepository.remove(coleta);
  }

  private async findOneOrThrow(viveiroId: number, id: number): Promise<ColetaRacao> {
    const coleta = await this.racaoRepository.findOne({ where: { id, viveiroId } });
    if (!coleta) {
      throw new NotFoundException('Coleta de ração não encontrada');
    }
    return coleta;
  }
}
