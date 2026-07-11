import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { Auth0Service } from './auth0.service';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule,
    forwardRef(() => UsersModule),
  ],
  providers: [
    JwtStrategy,
    Auth0Service,
    RolesGuard,
    JwtAuthGuard,
  ],
  exports: [
    PassportModule,
    Auth0Service,
    RolesGuard,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
