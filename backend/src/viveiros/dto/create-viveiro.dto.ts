import { IsIn, IsISO8601, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ViveiroStatus } from '../entities/viveiro.entity';

export class CreateViveiroDto {
  @IsString()
  @Length(3, 100)
  nome!: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  densidade!: number;

  @IsNumber()
  @Min(1)
  @Max(100000)
  area!: number;

  @IsISO8601()
  data_inicio_ciclo!: string;

  @IsOptional()
  @IsIn(Object.values(ViveiroStatus))
  status?: ViveiroStatus;
}
