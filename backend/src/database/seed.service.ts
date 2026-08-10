import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const existingUsers = await this.usersService.count();
    if (existingUsers > 0) {
      return;
    }

    const username = this.config.get<string>('SEED_ADMIN_USERNAME', 'admin');
    const password = this.config.get<string>('SEED_ADMIN_PASSWORD');
    if (!password) {
      this.logger.warn(
        'SEED_ADMIN_PASSWORD não definido — nenhum usuário admin foi criado. ' +
          'Defina a variável e reinicie para criar o primeiro acesso.',
      );
      return;
    }

    const email = this.config.get<string>('SEED_ADMIN_EMAIL', `${username}@ecamarao.local`);
    const passwordHash = await bcrypt.hash(password, 10);

    await this.usersService.create({
      username,
      email,
      passwordHash,
      role: UserRole.ADMIN,
    });

    this.logger.log(`Usuário admin "${username}" criado.`);
  }
}
