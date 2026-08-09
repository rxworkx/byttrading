import 'dotenv/config';
import * as dns from 'dns';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

// Node 17+ defaults to "verbatim" DNS ordering, so a dual-stack host (one
// with both A and AAAA records) can resolve to its IPv6 address first. On
// hosts without outbound IPv6 routing (e.g. Render) that fails instantly
// with ENETUNREACH. Preferring IPv4 avoids that for every outbound
// connection this process makes, not just mail.
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.use(cookieParser());
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  const frontendOrigins = (config.get<string>('FRONTEND_URL') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');

  await app.listen(config.get<number>('PORT') ?? 4000);
}
void bootstrap();
