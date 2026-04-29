import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginRequestDto {
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
