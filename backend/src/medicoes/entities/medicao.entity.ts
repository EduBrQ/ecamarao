import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from '../../database/numeric.transformer';

@Entity('medicoes_agua')
export class Medicao {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'viveiro_id' })
  viveiroId!: number;

  @Column({ type: 'date' })
  data!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: numericTransformer })
  oxigenio!: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, transformer: numericTransformer })
  ph!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: numericTransformer })
  temperatura!: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, transformer: numericTransformer })
  alcalinidade!: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, transformer: numericTransformer })
  transparencia!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: numericTransformer })
  salinidade!: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
