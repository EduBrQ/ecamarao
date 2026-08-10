import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { numericTransformer } from '../../database/numeric.transformer';

@Entity('coletas_racao')
@Unique(['viveiroId', 'data'])
export class ColetaRacao {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'viveiro_id' })
  viveiroId!: number;

  @Column({ type: 'date' })
  data!: string;

  @Column({ name: 'qnt_manha', type: 'decimal', precision: 10, scale: 2, default: 0, transformer: numericTransformer })
  qntManha!: number;

  @Column({ name: 'qnt_tarde', type: 'decimal', precision: 10, scale: 2, default: 0, transformer: numericTransformer })
  qntTarde!: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
