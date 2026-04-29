import { IsEmail, IsNotEmpty } from 'class-validator';

export class UpdateUserByIdRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
