import { GetUserResponseDto } from '@/modules/user/presentation/dto/response/get-user.dto';

export interface RefreshResponseDto {
  user: GetUserResponseDto;
  access_token: string;
  refresh_token: string;
}
