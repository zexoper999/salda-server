import { Injectable } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class AdminAuthService {
  constructor(private readonly authService: AuthService) {}

  async login(username: string, password: string): Promise<string | null> {
    const validUsername = process.env.ADMIN_USERNAME ?? 'admin';
    const validPassword = process.env.ADMIN_PASSWORD ?? '1212';

    if (username !== validUsername || password !== validPassword) return null;

    return this.authService.generateAdminToken(username);
  }
}
