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

    // A DB-level ON CONFLICT upsert (rather than find-then-save) so two
    // concurrent requests for the same viveiro+data can't both see "no
    // existing row" and both try to insert, tripping the unique constraint.
    await this.racaoRepository.upsert(
      {
        viveiroId,
        data: dto.data,
        qntManha: dto.qnt_manha ?? 0,
        qntTarde: dto.qnt_tarde ?? 0,
      },
      { conflictPaths: ['viveiroId', 'data'] },
    );

    const coleta = await this.racaoRepository.findOneOrFail({ where: { viveiroId, data: dto.data } });
    return coleta;
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
