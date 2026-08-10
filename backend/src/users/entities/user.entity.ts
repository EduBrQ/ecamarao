import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  OPERADOR = 'operador',
  TECNICO = 'tecnico',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 50 })
  username!: string;

  @Column({ length: 180 })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20, default: UserRole.USER })
  role!: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
