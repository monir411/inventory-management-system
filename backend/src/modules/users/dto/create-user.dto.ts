import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username!: string;

  @IsEmail()
  @MaxLength(120)
  email!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(100)
  password!: string;

  @IsUUID()
  roleId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
