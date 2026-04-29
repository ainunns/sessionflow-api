import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResendVerificationEmailRequestDto {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;
}
