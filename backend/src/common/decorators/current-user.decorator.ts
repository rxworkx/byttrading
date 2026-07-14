import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import { User } from '../../database/entities';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: User }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
