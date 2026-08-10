import { PartialType } from '@nestjs/mapped-types';
import { CreateViveiroDto } from './create-viveiro.dto';

export class UpdateViveiroDto extends PartialType(CreateViveiroDto) {}
