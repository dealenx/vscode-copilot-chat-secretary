// services/chatTypes.ts
import { Entry } from "../models";

export interface ChatMonitorConfig {
  /** Интервал проверки изменений в чате в секундах (рекомендуется 3-5 секунд) */
  checkInterval: number;
  /** Время ожидания без изменений перед отправкой сообщения в секундах (увеличено для MCP операций) */
  pauseThreshold: number;
  /** Базовый промпт для обработки данных */
  basePrompt: string;
  /** Логировать в панель Output */
  logToOutput: boolean;
  /** Логировать в редактор */
  logToEditor: boolean;
  /**
   * ID инструмента для обработки (переопределяет конфигурацию)
   * @deprecated Use scenarioId instead
   */
  toolId?: string;
  /** ID сценария для обработки (новый API) */
  scenarioId?: string;
  /** Включить проверку статуса записи во время мониторинга */
  enableEntryStatusCheck?: boolean;
  /** Максимальное время ожидания обработки записи в секундах (по умолчанию 600 = 10 минут для MCP операций) */
  maxWaitTime?: number;
}

export interface ChatMonitorCallbacks {
  /** Вызывается когда чат завершился и нужно перейти к следующей записи */
  onChatCompleted: () => void;
  /** Вызывается при ошибке в мониторинге чата */
  onError: (error: string) => void;
}

export interface ChatData {
  requesterUsername: string;
  responderUsername: string;
  initialLocation: string;
  requests: ChatRequest[];
}

export interface ChatRequest {
  requestId: string;
  message: any;
  response: ChatResponse[];
  responseId: string;
  isCanceled: boolean;
  agent?: any;
  timestamp?: number;
  result?: {
    errorDetails?: {
      code: string;
      message: string;
      confirmationButtons?: any[];
      responseIsIncomplete?: boolean;
    };
    timings?: any;
    metadata?: any;
    details?: any;
  };
}

export interface ChatResponse {
  kind?: string;
  value?: string;
  toolId?: string;
  toolName?: string;
  isComplete?: boolean;
  toolInvocationSerialized?: any;
  pastTenseMessage?: any;
  isConfirmed?: any;
  content?: {
    value?: string;
    uris?: any;
  };
  progress?: any[];
  toolSpecificData?: {
    kind?: string;
    sessionId?: string;
  };
}

export interface ChatMonitorState {
  isMonitoring: boolean;
  currentEntry?: Entry;
  lastChatContent?: string;
  lastChangeTime: number;
  lastProgressTime: number;
  entryProcessingStartTime: number;
  statusCheckCounter: number;
  summarizationDetected: boolean;
}
