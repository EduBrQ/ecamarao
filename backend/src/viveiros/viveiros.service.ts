import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Viveiro } from './entities/viveiro.entity';
import { CreateViveiroDto } from './dto/create-viveiro.dto';
import { UpdateViveiroDto } from './dto/update-viveiro.dto';

@Injectable()
export class ViveirosService {
  constructor(
    @InjectRepository(Viveiro) private readonly viveirosRepository: Repository<Viveiro>,
  ) {}

  findAll(): Promise<Viveiro[]> {
    return this.viveirosRepository.find({ order: { created_at: 'DESC' } });
  }

  count(): Promise<number> {
    return this.viveirosRepository.count();
  }

  async findOne(id: number): Promise<Viveiro> {
    const viveiro = await this.viveirosRepository.findOne({ where: { id } });
    if (!viveiro) {
      throw new NotFoundException('Viveiro não encontrado');
    }
    return viveiro;
  }

  create(dto: CreateViveiroDto): Promise<Viveiro> {
    return this.viveirosRepository.save(this.viveirosRepository.create(dto));
  }

  async update(id: number, dto: UpdateViveiroDto): Promise<Viveiro> {
    const viveiro = await this.findOne(id);
    Object.assign(viveiro, dto);
    return this.viveirosRepository.save(viveiro);
  }

  async remove(id: number): Promise<void> {
    const viveiro = await this.findOne(id);
    await this.viveirosRepository.remove(viveiro);
  }
}
