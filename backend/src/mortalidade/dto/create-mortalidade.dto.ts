import { IsISO8601, IsInt, IsString, Length, Max, Min } from 'class-validator';

export class CreateMortalidadeDto {
  @IsISO8601()
  data!: string;

  @IsInt()
  @Min(1)
  @Max(1000000)
  quantidade!: number;

  @IsString()
  @Length(3, 200)
  causa!: string;
}
