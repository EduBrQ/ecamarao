import { ValueTransformer } from 'typeorm';

// pg returns NUMERIC/DECIMAL columns as strings to avoid float precision
// loss; the app works with plain numbers everywhere else, so convert at
// the entity boundary instead of scattering parseFloat() through services.
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : parseFloat(value),
};
