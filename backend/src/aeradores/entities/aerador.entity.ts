import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('aeradores')
export class Aerador {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'viveiro_id' })
  viveiroId!: number;

  @Column({ length: 100 })
  nome!: string;

  @Column({ default: false })
  status!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
