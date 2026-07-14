import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { User } from '../../database/entities';
import { REQUIRE_APPROVED_KEY } from '../decorators/require-approved.decorator';

@Injectable()
export class ApprovedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresApproval = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_APPROVED_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiresApproval) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: User }>();
    const user = request.user;
    if (user?.txLimit?.freeze) {
      throw new ForbiddenException('Your account is pending approval');
    }
    return true;
  }
}
