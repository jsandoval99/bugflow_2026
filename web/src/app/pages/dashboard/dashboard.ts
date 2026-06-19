import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardFacade } from '@bugflow-2026/data-access';
import { CardComponent } from '../../shared/ui/card/card';
import { BadgeComponent } from '../../shared/ui/badge/badge';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardComponent, BadgeComponent],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  private facade = inject(DashboardFacade);

  activities = [
    'John commented on "Login issue"',
    'Maria closed "API timeout error"',
    'Carlos created a new issue',
  ];
  state = this.facade.statsState;
  stats = computed(() => {
    const data = this.state().data;

    if (!data) {
      return [];
    }

    return [
      { label: 'Open Issues', value: data.open },
      { label: 'In Progress', value: data.inProgress },
      { label: 'In Testing', value: data.inTest },
      { label: 'Closed Issues', value: data.closed },
    ];
  });
  recentIssues = computed(() => {
    return this.state().data?.recentIssues ?? [];
  });

}
