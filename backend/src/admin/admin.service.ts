import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Viveiro } from '../viveiros/entities/viveiro.entity';
import { ColetaRacao } from '../racao/entities/coleta-racao.entity';
import { Mortalidade } from '../mortalidade/entities/mortalidade.entity';
import { Medicao } from '../medicoes/entities/medicao.entity';
import { Aerador } from '../aeradores/entities/aerador.entity';
import { gerarDatasetDemo } from './demo-data.generator';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Viveiro) private readonly viveirosRepository: Repository<Viveiro>,
    @InjectRepository(ColetaRacao) private readonly racaoRepository: Repository<ColetaRacao>,
    @InjectRepository(Mortalidade) private readonly mortalidadeRepository: Repository<Mortalidade>,
    @InjectRepository(Medicao) private readonly medicaoRepository: Repository<Medicao>,
    @InjectRepository(Aerador) private readonly aeradorRepository: Repository<Aerador>,
  ) {}

  async clearData(): Promise<void> {
    // Sem FKs declaradas entre as tabelas (viveiro_id é uma coluna simples),
    // então a ordem não importa para integridade — mas limpamos os filhos
    // primeiro por higiene. clear() trunca e reinicia os IDs.
    await this.racaoRepository.clear();
    await this.mortalidadeRepository.clear();
    await this.medicaoRepository.clear();
    await this.aeradorRepository.clear();
    await this.viveirosRepository.clear();
  }

  async seedDemo(): Promise<{ viveiros: number; racoes: number; mortalidades: number; medicoes: number; aeradores: number }> {
    await this.clearData();

    const dataset = gerarDatasetDemo();

    let totalRacoes = 0;
    let totalMortalidades = 0;
    let totalMedicoes = 0;
    let totalAeradores = 0;

    for (const { viveiro, racoes, mortalidades, medicoes, aeradores } of dataset) {
      const saved = await this.viveirosRepository.save(this.viveirosRepository.create(viveiro));

      if (racoes.length) {
        await this.racaoRepository.save(
          racoes.map((r) => this.racaoRepository.create({ ...r, viveiroId: saved.id })),
          { chunk: 200 },
        );
        totalRacoes += racoes.length;
      }
      if (mortalidades.length) {
        await this.mortalidadeRepository.save(
          mortalidades.map((m) => this.mortalidadeRepository.create({ ...m, viveiroId: saved.id })),
          { chunk: 200 },
        );
        totalMortalidades += mortalidades.length;
      }
      if (medicoes.length) {
        await this.medicaoRepository.save(
          medicoes.map((m) => this.medicaoRepository.create({ ...m, viveiroId: saved.id })),
          { chunk: 200 },
        );
        totalMedicoes += medicoes.length;
      }
      if (aeradores.length) {
        await this.aeradorRepository.save(
          aeradores.map((a) => this.aeradorRepository.create({ ...a, viveiroId: saved.id })),
          { chunk: 200 },
        );
        totalAeradores += aeradores.length;
      }
    }

    return {
      viveiros: dataset.length,
      racoes: totalRacoes,
      mortalidades: totalMortalidades,
      medicoes: totalMedicoes,
      aeradores: totalAeradores,
    };
  }
}
