import { SetMetadata } from '@nestjs/common';

export const REQUIRE_APPROVED_KEY = 'requireApproved';
export const RequireApproved = () => SetMetadata(REQUIRE_APPROVED_KEY, true);
