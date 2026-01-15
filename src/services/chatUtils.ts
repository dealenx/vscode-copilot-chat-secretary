// services/chatUtils.ts
import * as vscode from "vscode";
import { ChatData, ChatMonitorConfig } from "./chatTypes";
import { ChatExportService } from "./chatExportService";

/**
 * Получить рекомендуемые настройки ChatMonitor для работы с MCP серверами
 */
export function getRecommendedMCPConfig(): Partial<ChatMonitorConfig> {
  return {
    checkInterval: 4, // Проверка каждые 4 секунды
    pauseThreshold: 45, // Ожидание 45 секунд без изменений (достаточно для MCP операций)
    maxWaitTime: 600, // Максимальное время ожидания 10 минут
    enableEntryStatusCheck: true, // Включить проверку статуса записи
  };
}

/**
 * Тестовая функция для анализа JSON данных чата через ChatExportService
 * Используется для отладки и тестирования логики определения завершенности чата
 */
export async function testChatAnalysis(
  context?: vscode.ExtensionContext
): Promise<{
  status: string;
  requestsCount: number;
  statusDetails: any;
} | null> {
  try {
    const result = await ChatExportService.analyzeChatStatus(context);
    return result;
  } catch (error) {
    console.error("Ошибка анализа чата:", error);
    return null;
  }
}

/**
 * Анализирует содержимое чата из файла через библиотеку
 */
export async function analyzeChatFromFile(filePath: string): Promise<{
  status: string;
  requestsCount: number;
} | null> {
  try {
    const uri = vscode.Uri.file(filePath);
    const content = await vscode.workspace.fs.readFile(uri);
    const jsonString = Buffer.from(content).toString("utf8");
    const chatData = JSON.parse(jsonString);

    // Используем анализатор напрямую из библиотеки
    const analyzer = ChatExportService.getAnalyzer();
    const status = analyzer.getDialogStatus(chatData);
    const requestsCount = analyzer.getRequestsCount(chatData);

    return {
      status,
      requestsCount,
    };
  } catch (error) {
    console.error("Ошибка анализа файла чата:", error);
    return null;
  }
}

/**
 * Проверяет, прошло ли достаточно времени для срабатывания timeout
 */
export function shouldTriggerTimeout(
  lastChangeTime: number,
  pauseThreshold: number,
  summarizationDetected: boolean
): boolean {
  const timeSinceLastChange = (Date.now() - lastChangeTime) / 1000;
  const adjustedThreshold = summarizationDetected
    ? pauseThreshold * 2 // Удваиваем время ожидания после суммаризации
    : pauseThreshold;

  return timeSinceLastChange >= adjustedThreshold;
}

/**
 * Проверяет, превышено ли максимальное время обработки
 */
export function isMaxWaitTimeExceeded(
  processingStartTime: number,
  maxWaitTime: number
): boolean {
  const totalProcessingTime = (Date.now() - processingStartTime) / 1000;
  return totalProcessingTime >= maxWaitTime;
}

/**
 * Вычисляет оставшееся время обработки
 */
export function getRemainingProcessingTime(
  processingStartTime: number,
  maxWaitTime: number
): number {
  const totalProcessingTime = (Date.now() - processingStartTime) / 1000;
  return Math.max(0, maxWaitTime - totalProcessingTime);
}

/**
 * Форматирует время в удобочитаемый формат
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}с`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return remainingSeconds > 0
      ? `${minutes}м ${remainingSeconds}с`
      : `${minutes}м`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}ч ${minutes}м` : `${hours}ч`;
  }
}

/**
 * Создает сообщение о статусе мониторинга
 */
export function createStatusMessage(
  isMonitoring: boolean,
  lastChangeTime: number,
  currentEntryId?: string,
  currentEntryRowNumber?: number
): string {
  if (!isMonitoring) {
    return "Остановлен";
  }

  const timeSinceLastChange = (Date.now() - lastChangeTime) / 1000;
  const timeFormatted = formatTime(timeSinceLastChange);

  let message = `Активен (${timeFormatted} с последнего изменения)`;

  if (currentEntryId && currentEntryRowNumber) {
    message += ` - запись ${currentEntryRowNumber}`;
  }

  return message;
}
