import { IsString, IsOptional, IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueStatus, IssuePriority } from '@bugflow-2026/shared-types';
import { AssigneeDto } from './assignee.dto';
import { Type } from 'class-transformer';

export class CreateIssueDto {
  @ApiProperty({ example: 'Login button is broken' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'The login button is not working as expected' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ enum: IssueStatus, default: IssueStatus.OPEN })
  @IsEnum(IssueStatus)
  status!: IssueStatus;

  @ApiProperty({ enum: IssuePriority, default: IssuePriority.MEDIUM })
  @IsEnum(IssuePriority)
  priority!: IssuePriority;

  @ApiPropertyOptional({
    type: AssigneeDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AssigneeDto)
  assignee?: AssigneeDto;

  @ApiPropertyOptional({ example: 'project-123' })
  @IsOptional()
  @IsString()
  projectId?: string | null;
}
