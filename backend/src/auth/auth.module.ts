import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Notification, Referral, Token, User } from '../database/entities';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token, Referral, User, Notification]),
    UsersModule,
    WalletsModule,
    SettingsModule,
    NotificationsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<string>(
            'JWT_ACCESS_TTL',
          ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
