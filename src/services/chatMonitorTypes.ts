// services/chatMonitorTypes.ts
export interface ChatMonitorData {
  status: "completed" | "canceled" | "in_progress" | "unknown";
  requestsCount: number;
  lastUpdate: Date;
  hasActivity: boolean;
  lastRequestId?: string;
  statusDetails?: {
    status: string;
    statusText: string;
    hasResult: boolean;
    hasFollowups: boolean;
    isCanceled: boolean;
    lastRequestId?: string;
  };
}

export interface ChatMonitorSubscriber {
  onChatStatusUpdate(data: ChatMonitorData): void;
  onChatCompleted?(): void;
  onChatError?(error: string): void;
}

export interface ChatMonitorService {
  subscribe(subscriber: ChatMonitorSubscriber): void;
  unsubscribe(subscriber: ChatMonitorSubscriber): void;
  getCurrentStatus(): ChatMonitorData;
  refreshStatus(): Promise<void>;
  startMonitoring(): void;
  stopMonitoring(): void;
  isMonitoring(): boolean;
}
