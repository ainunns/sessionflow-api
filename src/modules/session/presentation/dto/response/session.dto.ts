import { SessionEntity } from '@/modules/session/infrastructure/schema/session.schema';

export interface GetSessionResponseDto {
  id: string;
  device_type?: string;
  device_name?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  created_at: Date;
  last_used_at?: Date;
  expires_at: Date;
  is_active: boolean;
}

export function toSessionResponseDto(
  session: SessionEntity,
): GetSessionResponseDto {
  return {
    id: session.token_id,
    device_type: session.device_type,
    device_name: session.device_name,
    browser: session.browser,
    os: session.os,
    ip_address: session.ip_address,
    created_at: session.created_at,
    last_used_at: session.last_used_at,
    expires_at: session.expires_at,
    is_active: session.is_active ?? true,
  };
}
