import { Controller, ForbiddenException, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('seed-demo')
  @HttpCode(HttpStatus.OK)
  seedDemo(@CurrentUser() user: AuthUser) {
    this.assertAdmin(user);
    return this.adminService.seedDemo();
  }

  @Post('clear-data')
  @HttpCode(HttpStatus.OK)
  async clearData(@CurrentUser() user: AuthUser) {
    this.assertAdmin(user);
    await this.adminService.clearData();
    return { message: 'Base de dados limpa com sucesso' };
  }

  private assertAdmin(user: AuthUser): void {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Apenas administradores podem executar esta ação');
    }
  }
}
