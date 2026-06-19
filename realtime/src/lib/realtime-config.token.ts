import { InjectionToken } from '@angular/core';

export interface RealtimeConfig {
  socketUrl: string;
}

export const REALTIME_CONFIG = new InjectionToken<RealtimeConfig>('REALTIME_CONFIG');
