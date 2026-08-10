import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpsertAeradorDto {
  @IsString()
  @Length(3, 100)
  nome!: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
