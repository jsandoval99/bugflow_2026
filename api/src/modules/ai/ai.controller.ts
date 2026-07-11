import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiAgentService } from './services/ai-agent.service';
import { AiChatDto } from './dto/ai-chat.dto';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Post('chat')
  chat(@Body() dto: AiChatDto) {
    return this.aiAgentService.ask(dto.message, dto.history ?? [], dto.provider);
  }
}
