import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViveirosService } from '../viveiros/viveiros.service';
import { Aerador } from './entities/aerador.entity';
import { UpsertAeradorDto } from './dto/upsert-aerador.dto';

@Injectable()
export class AeradoresService {
  constructor(
    @InjectRepository(Aerador) private readonly aeradoresRepository: Repository<Aerador>,
    private readonly viveirosService: ViveirosService,
  ) {}

  findAllByViveiro(viveiroId: number): Promise<Aerador[]> {
    return this.aeradoresRepository.find({
      where: { viveiroId },
      order: { created_at: 'ASC' },
    });
  }

  async create(viveiroId: number, dto: UpsertAeradorDto): Promise<Aerador> {
    await this.viveirosService.findOne(viveiroId);
    return this.aeradoresRepository.save(
      this.aeradoresRepository.create({ ...dto, viveiroId, status: dto.status ?? false }),
    );
  }

  async update(viveiroId: number, id: number, dto: UpsertAeradorDto): Promise<Aerador> {
    const aerador = await this.findOneOrThrow(viveiroId, id);
    Object.assign(aerador, dto);
    return this.aeradoresRepository.save(aerador);
  }

  async remove(viveiroId: number, id: number): Promise<void> {
    const aerador = await this.findOneOrThrow(viveiroId, id);
    await this.aeradoresRepository.remove(aerador);
  }

  private async findOneOrThrow(viveiroId: number, id: number): Promise<Aerador> {
    const aerador = await this.aeradoresRepository.findOne({ where: { id, viveiroId } });
    if (!aerador) {
      throw new NotFoundException('Aerador não encontrado');
    }
    return aerador;
  }
}
