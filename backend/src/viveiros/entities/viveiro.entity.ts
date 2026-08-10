import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from '../../database/numeric.transformer';

export enum ViveiroStatus {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
  MANUTENCAO = 'manutencao',
}

@Entity('viveiros')
export class Viveiro {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  nome!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: numericTransformer })
  densidade!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: numericTransformer })
  area!: number;

  // Snake_case on purpose: the frontend (Home/Viveiro/Ciclo/Racao/Dashboard
  // pages) already reads/writes this field as data_inicio_ciclo — matching
  // it here avoids touching half a dozen unrelated components for a
  // cosmetic rename.
  @Column({ name: 'data_inicio_ciclo', type: 'date' })
  data_inicio_ciclo!: string;

  @Column({ type: 'varchar', length: 20, default: ViveiroStatus.ATIVO })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
