interface AnalyticsEvent {
  eventName: string;
  eventData: Record<string, any>;
  timestamp: number;
}

interface AnalyticsService {
  trackEvent(event: AnalyticsEvent): void;
  getEvents(): AnalyticsEvent[];
  clearEvents(): void;
}