import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueEntity } from '../issues/entities/issue.entity';
import { CommentEntity } from '../comments/entities/comment.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { AiController } from './ai.controller';
import { AiAgentService } from './services/ai-agent.service';
import { AiToolsService } from './services/ai-tools.service';
import { AiToolExecutorService } from './services/ai-tool-executor.service';
import { AnthropicAgentProvider } from './services/providers/anthropic-agent.provider';
import { DeepseekAgentProvider } from './services/providers/deepseek-agent.provider';

@Module({
  imports: [TypeOrmModule.forFeature([IssueEntity, CommentEntity, ProjectEntity, User])],
  controllers: [AiController],
  providers: [
    AiAgentService,
    AiToolsService,
    AiToolExecutorService,
    AnthropicAgentProvider,
    DeepseekAgentProvider,
  ],
})
export class AiModule {}
