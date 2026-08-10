import { IsISO8601, IsNumber, Max, Min } from 'class-validator';

export class CreateMedicaoDto {
  @IsISO8601()
  data!: string;

  @IsNumber()
  @Min(0)
  @Max(20)
  oxigenio!: number;

  @IsNumber()
  @Min(0)
  @Max(14)
  ph!: number;

  @IsNumber()
  @Min(0)
  @Max(50)
  temperatura!: number;

  @IsNumber()
  @Min(0)
  @Max(500)
  alcalinidade!: number;

  @IsNumber()
  @Min(0)
  @Max(200)
  transparencia!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  salinidade!: number;
}
