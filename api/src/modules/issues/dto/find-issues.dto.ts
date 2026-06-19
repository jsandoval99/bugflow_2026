import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@bugflow-2026/shared-types';

export class FindIssuesDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @IsIn(PAGE_SIZE_OPTIONS)
  pageSize = DEFAULT_PAGE_SIZE;
}
