import { GetUserResponseDto } from '@/modules/user/presentation/dto/response/get-user.dto';

export interface LoginResponseDto {
  user: GetUserResponseDto;
  token: string;
}
