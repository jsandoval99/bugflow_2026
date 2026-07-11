import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AssigneeDto {
  @ApiProperty({
    example: 'auth0|69f2562a83cf251989410cc7',
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    example: 'auth0|69f2562a83cf251989410cc7',
  })
  @IsUUID()
  @IsNotEmpty()
  dbId!: string;

  @ApiProperty({
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
