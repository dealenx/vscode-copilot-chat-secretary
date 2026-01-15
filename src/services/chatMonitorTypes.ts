// services/chatMonitorTypes.ts
import { DialogStatusType } from "copilot-chat-analyzer";

export interface ChatMonitorData {
  status: DialogStatusType;
  requestsCount: number;
  lastUpdate: Date;
  hasActivity: boolean;
  lastRequestId?: string;
  statusDetails?: {
    status: DialogStatusType;
    statusText: string;
    hasResult: boolean;
    hasFollowups: boolean;
    isCanceled: boolean;
    isFailed: boolean;
    lastRequestId?: string;
    errorCode?: string;
    errorMessage?: string;
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
