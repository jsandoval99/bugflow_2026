export const AI_TOOLS = [
  {
    name: 'count_issues',
    description: 'Counts how many issues match certain filters. Ideal for questions like "how many issues are open?" or "how many were created yesterday?".',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'array', items: { type: 'string', enum: ['open', 'in-progress', 'in-test', 'closed'] } },
        priority: { type: 'array', items: { type: 'string', enum: ['low', 'medium', 'high'] } },
        projectId: { type: 'string' },
        unassigned: { type: 'boolean' },
        assigneeDbId: { type: 'string' },
        createdAfter: { type: 'string', description: 'ISO datetime' },
        createdBefore: { type: 'string', description: 'ISO datetime' },
        updatedAfter: { type: 'string', description: 'ISO datetime' },
        updatedBefore: { type: 'string', description: 'ISO datetime' },
        search: { type: 'string' },
      },
    },
  },
  {
    name: 'find_users',
    description: 'Search users by name or email. Useful when the user mentions a person instead of a database id.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Partial name or email' },
        role: { type: 'string', enum: ['admin', 'developer', 'tester'] },
        limit: { type: 'number' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_issues',
    description: 'Returns a paginated list of issues (max 20 per page) with their main fields, applying filters. The response includes "meta" (with the true total count matching the filters, not just the page size) and "items". Use it when the user asks to see concrete examples, not just a number. If meta.hasMore is true and the user wants to see more, call this tool again with an incremented "page".',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'array', items: { type: 'string', enum: ['open', 'in-progress', 'in-test', 'closed'] } },
        priority: { type: 'array', items: { type: 'string', enum: ['low', 'medium', 'high'] } },
        projectId: { type: 'string' },
        unassigned: { type: 'boolean' },
        assigneeDbId: { type: 'string' },
        createdAfter: { type: 'string' },
        createdBefore: { type: 'string' },
        search: { type: 'string' },
        pageSize: { type: 'number', description: 'Max 20' },
        page: { type: 'number', description: 'Page number, starting at 1' },
        sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'statusChangedAt'] },
        sortOrder: { type: 'string', enum: ['ASC', 'DESC'] },
      },
    },
  },
  {
    name: 'get_stale_issues',
    description: 'Returns a paginated list (max 20 per page) of issues whose status has not changed in more than N hours. Use it for "stale issues" or "issues with no movement". The response includes "meta" (with the true total count matching the filters) and "items". If meta.hasMore is true and the user wants to see more, call this tool again with an incremented "page".',
    input_schema: {
      type: 'object',
      properties: {
        hoursWithoutStatusChange: { type: 'number' },
        status: { type: 'array', items: { type: 'string', enum: ['open', 'in-progress', 'in-test', 'closed'] } },
        projectId: { type: 'string' },
        pageSize: { type: 'number', description: 'Max 20' },
        page: { type: 'number', description: 'Page number, starting at 1' },
      },
      required: ['hoursWithoutStatusChange'],
    },
  },
  {
    name: 'group_issues_by',
    description: 'Groups issues by status, priority, projectId, or assignee and returns counts. Useful for summaries.',
    input_schema: {
      type: 'object',
      properties: {
        field: { type: 'string', enum: ['status', 'priority', 'projectId', 'assigneeDbId'] },
        projectId: { type: 'string' },
        status: { type: 'array', items: { type: 'string', enum: ['open', 'in-progress', 'in-test', 'closed'] } },
      },
      required: ['field'],
    },
  },
  {
    name: 'get_user_workload',
    description: 'Returns how many issues are assigned to a user, grouped by status.',
    input_schema: {
      type: 'object',
      properties: { assigneeDbId: { type: 'string' } },
      required: ['assigneeDbId'],
    },
  },
  {
    name: 'get_comment_activity',
    description: 'Counts comments created within a date range, optionally for a specific issue.',
    input_schema: {
      type: 'object',
      properties: {
        dateFrom: { type: 'string' },
        dateTo: { type: 'string' },
        issueId: { type: 'string' },
      },
      required: ['dateFrom', 'dateTo'],
    },
  },
  {
    name: 'get_average_resolution_time',
    description: 'Calculates the average time (in hours) that closed issues take, from creation to their last status change. Use it for questions like "what is the average resolution time?" or "how fast do we resolve high-priority issues?".',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        priority: { type: 'array', items: { type: 'string', enum: ['low', 'medium', 'high'] } },
        closedAfter: { type: 'string', description: 'ISO datetime' },
        closedBefore: { type: 'string', description: 'ISO datetime' },
      },
    },
  },
  {
    name: 'generate_chart_data',
    description: 'Generates aggregated issue data formatted for rendering a bar, pie, or line chart. Use when the user asks to "see", "visualize", "graph", "plot" or "chart" issue data — including breakdowns by assignee/user (e.g. "show me a pie chart of issues by assignee").',
    input_schema: {
      type: 'object',
      properties: {
        chartType: { type: 'string', enum: ['bar', 'pie', 'line'] },
        groupBy: { type: 'string', enum: ['status', 'priority', 'projectId', 'assigneeDbId'] },
        status: { type: 'array', items: { type: 'string', enum: ['open', 'in-progress', 'in-test', 'closed'] } },
        priority: { type: 'array', items: { type: 'string', enum: ['low', 'medium', 'high'] } },
        projectId: { type: 'string' },
      },
      required: ['chartType', 'groupBy'],
    },
  },
] as const;

export function toOpenAiTools(tools: readonly (typeof AI_TOOLS)[number][]) {
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));
}
