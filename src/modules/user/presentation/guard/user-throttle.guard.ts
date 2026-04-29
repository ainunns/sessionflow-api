import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req.user as { sub?: string; id?: string } | undefined;
    if (user) {
      const id = (user?.sub ?? user?.id)?.toString();
      return Promise.resolve(`user:${id}`);
    }
    return Promise.resolve(
      req.ip ?? req.headers?.['x-forwarded-for'] ?? 'anonymous',
    );
  }
}
