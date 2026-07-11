import { Injectable } from '@nestjs/common';
import { AiToolsService } from './ai-tools.service';

@Injectable()
export class AiToolExecutorService {
  constructor(private readonly tools: AiToolsService) {}

  execute(name: string, input: any) {
    switch (name) {
      case 'count_issues':
        return this.tools.countIssues(input);
      case 'list_issues':
        return this.tools.listIssues(input);
      case 'get_stale_issues':
        return this.tools.getStaleIssues(input.hoursWithoutStatusChange, input);
      case 'group_issues_by':
        return this.tools.groupIssuesBy(input.field, input);
      case 'get_user_workload':
        return this.tools.getUserWorkload(input.assigneeDbId);
      case 'get_comment_activity':
        return this.tools.getCommentActivity(input.dateFrom, input.dateTo, input.issueId);
      case 'get_average_resolution_time':
        return this.tools.getAverageResolutionTime(input);
      case 'generate_chart_data':
        return this.tools.generateChartData(input);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }
}
