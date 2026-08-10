import { IsISO8601, IsOptional, Max, Min } from 'class-validator';

// Snake_case field names on purpose: Racao.tsx and FazendaRacao.tsx already
// POST qnt_manha/qnt_tarde — matching that here avoids touching both pages
// for a cosmetic rename. The response still comes back as qntManha/qntTarde
// (see ColetaRacao entity), which is what those same pages read back.
export class UpsertRacaoDto {
  @IsISO8601()
  data!: string;

  @IsOptional()
  @Min(0)
  @Max(1000)
  qnt_manha?: number;

  @IsOptional()
  @Min(0)
  @Max(1000)
  qnt_tarde?: number;
}
