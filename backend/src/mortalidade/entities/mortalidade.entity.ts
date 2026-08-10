import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('registros_mortalidade')
export class Mortalidade {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'viveiro_id' })
  viveiroId!: number;

  @Column({ type: 'date' })
  data!: string;

  @Column({ type: 'int' })
  quantidade!: number;

  @Column({ length: 200 })
  causa!: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
