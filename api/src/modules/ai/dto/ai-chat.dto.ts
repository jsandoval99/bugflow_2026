import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AiProvider } from '@bugflow-2026/shared-types';

export class AiChatDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsArray()
  history?: { role: 'user' | 'assistant'; content: string }[];

  @IsOptional()
  @IsEnum(AiProvider)
  provider?: AiProvider;
}
