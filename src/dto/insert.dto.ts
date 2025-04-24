import { IsString, IsBoolean, MaxLength, IsOptional, IsDate } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  id: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serial: string
  
  @IsOptional()
  @IsString()
  @MaxLength(200)
  message: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  detail: string

  @IsOptional()
  @IsBoolean()
  status: boolean;

  @IsDate()
  @IsOptional()
  createAt: Date;

  @IsDate()
  @IsOptional()
  updateAt: Date;
}
