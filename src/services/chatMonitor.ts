// services/chatMonitor.ts
import * as vscode from "vscode";
import { Entry } from "../models";
import { GraphQLApiClient } from "./graphqlClient";
import { ChatExportService } from "./chatExportService";
import {
  ChatMonitorConfig,
  ChatMonitorCallbacks,
  ChatMonitorState,
} from "./chatTypes";
import { buildPromptForEntry, sendPromptToChat } from "./promptService";
import {
  shouldTriggerTimeout,
  isMaxWaitTimeExceeded,
  getRemainingProcessingTime,
  formatTime,
  createStatusMessage,
} from "./chatUtils";

export class ChatMonitor {
  private checkInterval?: NodeJS.Timeout;
  private state: ChatMonitorState;
  private config: ChatMonitorConfig;
  private callbacks: ChatMonitorCallbacks;
  private readonly STATUS_CHECK_INTERVAL = 3; // Проверяем статус каждые 3 итерации (т.е. раз в ~15 секунд при интервале 5с)
  private graphqlClient: GraphQLApiClient;
  private currentChatStatus: string = "unknown"; // Текущий статус чата

  constructor(
    private context: vscode.ExtensionContext,
    config: ChatMonitorConfig,
    callbacks: ChatMonitorCallbacks,
    graphqlClient: GraphQLApiClient
  ) {
    this.config = config;
    this.callbacks = callbacks;
    this.graphqlClient = graphqlClient;
    this.state = this.initializeState();
  }

  private initializeState(): ChatMonitorState {
    return {
      isMonitoring: false,
      lastChangeTime: Date.now(),
      lastProgressTime: Date.now(),
      entryProcessingStartTime: 0,
      statusCheckCounter: 0,
      summarizationDetected: false,
    };
  }

  private log(message: string): void {
    const logMessage = `[ChatMonitor] ${message}`;
    console.log(logMessage); // Всегда выводим в консоль для отладки

    if (this.config.logToOutput || this.config.logToEditor) {
      // Дополнительно выводим в Output или Editor если настроено
    }
  }

  /**
   * Проверяет статус обработки записи через GraphQL запрос
   */
  private async checkEntryProcessingStatus(entryId: string): Promise<boolean> {
    try {
      this.log(`Проверяем статус обработки записи ${entryId}...`);

      const entry = await this.graphqlClient.getEntry(entryId);

      if (entry) {
        const isProcessed = entry.isAiProcessed;
        this.log(`Статус записи ${entryId}: isAiProcessed = ${isProcessed}`);
        return isProcessed;
      } else {
        this.log(`Запись ${entryId} не найдена в системе`);
        return false;
      }
    } catch (error) {
      this.log(`Ошибка при проверке статуса записи ${entryId}: ${error}`);
      // При ошибке считаем, что запись не обработана, чтобы не пропустить обработку
      return false;
    }
  }

  public async startProcessingEntry(entry: Entry): Promise<void> {
    this.state.currentEntry = entry;
    this.state.entryProcessingStartTime = Date.now(); // Устанавливаем время начала обработки

    try {
      // Проверяем, не обработана ли запись уже
      const isAlreadyProcessed = await this.checkEntryProcessingStatus(
        entry.id
      );
      if (isAlreadyProcessed) {
        this.log(
          `Запись ${entry.id} (документ: ${entry.documentId}) уже обработана ИИ, пропускаем`
        );
        vscode.window.showInformationMessage(
          `✅ Запись ${entry.rowNumber} уже обработана, переходим к следующей`
        );
        this.callbacks.onChatCompleted();
        return;
      }

      // Отправляем промпт с данными записи в чат
      await this.sendEntryToChat(entry);

      // Запускаем мониторинг чата
      this.start();

      this.log(
        `Начата обработка записи ${entry.id} (документ: ${entry.documentId}) в чате`
      );
    } catch (error) {
      this.log(`Ошибка при отправке записи в чат: ${error}`);
      this.callbacks.onError(`Ошибка при отправке записи в чат: ${error}`);
    }
  }

  private async sendEntryToChat(entry: Entry): Promise<void> {
    // Формируем промпт с данными записи
    const prompt = await buildPromptForEntry(
      entry,
      this.config,
      this.graphqlClient
    );

    try {
      await sendPromptToChat(prompt, entry);
    } catch (error) {
      this.log(`Ошибка при отправке промпта: ${error}`);
      throw error;
    }
  }

  public start(): void {
    if (this.state.isMonitoring) {
      this.log("Мониторинг уже запущен");
      return;
    }

    this.state.isMonitoring = true;
    this.state.lastChangeTime = Date.now();
    this.state.lastProgressTime = Date.now(); // Инициализируем время прогресса
    this.state.summarizationDetected = false; // Сбрасываем флаг суммаризации
    this.state.statusCheckCounter = 0; // Сбрасываем счетчик при старте

    this.log(
      `Запуск мониторинга чата: интервал проверки: ${this.config.checkInterval}с, порог паузы: ${this.config.pauseThreshold}с`
    );

    this.checkInterval = setInterval(() => {
      this.checkChatChanges();
    }, this.config.checkInterval * 1000);

    vscode.window.showInformationMessage("🤖 Мониторинг чата запущен");
  }

  public stop(): void {
    if (!this.state.isMonitoring) {
      this.log("Мониторинг уже остановлен");
      return;
    }

    this.state.isMonitoring = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    this.log("Мониторинг чата остановлен");
    vscode.window.showInformationMessage("🛑 Мониторинг чата остановлен");
  }

  public updateConfig(newConfig: ChatMonitorConfig): void {
    const wasMonitoring = this.state.isMonitoring;
    if (wasMonitoring) {
      this.stop();
    }

    this.config = newConfig;

    if (wasMonitoring) {
      this.start();
    }

    this.log("Конфигурация обновлена");
  }

  private async checkChatChanges(): Promise<void> {
    if (!this.state.isMonitoring) {
      return;
    }

    try {
      // Проверяем статус текущей записи во время мониторинга (если включено и пришло время)
      if (
        this.state.currentEntry &&
        this.config.enableEntryStatusCheck !== false
      ) {
        this.state.statusCheckCounter++;

        // Проверяем статус записи только каждые N итераций для экономии ресурсов
        if (this.state.statusCheckCounter >= this.STATUS_CHECK_INTERVAL) {
          this.state.statusCheckCounter = 0;

          const isNowProcessed = await this.checkEntryProcessingStatus(
            this.state.currentEntry.id
          );
          if (isNowProcessed) {
            this.log(
              `Запись ${this.state.currentEntry.id} (документ: ${this.state.currentEntry.documentId}) была обработана во время мониторинга, переходим к следующей`
            );
            vscode.window.showInformationMessage(
              `✅ Запись ${this.state.currentEntry.rowNumber} обработана, переходим к следующей`
            );
            this.stop();
            this.callbacks.onChatCompleted();
            return;
          }
        }
      }

      // Используем ChatExportService для анализа
      await this.analyzeChatFromJSON();
      return;

      // Fallback на старую логику с markdown экспортом
      await this.checkChatChangesMarkdown();
    } catch (error) {
      this.log(`Ошибка при проверке изменений чата: ${error}`);

      // Если команда не поддерживается, показываем предупреждение
      if (
        error instanceof Error &&
        (error.message.includes("command") ||
          error.message.includes("not found"))
      ) {
        vscode.window.showWarningMessage(
          "⚠️ Команда экспорта чата не поддерживается в текущей версии VS Code. Обновите VS Code до последней версии (1.95+)."
        );
        this.stop();
        this.callbacks.onError("Команда экспорта чата не поддерживается");
      }
    }
  }

  private async handleChatAnalysis(): Promise<void> {
    try {
      // Используем базовый анализ через библиотеку
      const analysisResult = await ChatExportService.analyzeChatStatus(
        this.context
      );

      if (!analysisResult) {
        this.log("Не удалось получить данные чата");
        return;
      }

      const { status, requestsCount, statusDetails } = analysisResult;

      this.log(`Статус чата: ${status}, Запросов: ${requestsCount}`);

      // Обновляем время прогресса при любой активности
      this.state.lastProgressTime = Date.now();

      // Простая обработка статусов через библиотеку
      switch (status) {
        case "canceled":
          this.log("🛑 Чат отменен пользователем. Остановка мониторинга.");
          this.stop();
          this.callbacks.onError("Обработка отменена пользователем");
          return;

        case "completed":
          this.log(
            "✅ Чат завершен. Проверяем выполнение операции сохранения."
          );

          // Проверяем, была ли выполнена операция update_entry_fields
          const hasSaveOperation = await this.detectSaveOperation();

          if (hasSaveOperation) {
            this.log(
              "✅ Операция update_entry_fields выполнена, переходим к следующей записи"
            );

            // Проверяем, обновилась ли текущая запись в БД
            if (this.state.currentEntry) {
              const isNowProcessed = await this.checkEntryProcessingStatus(
                this.state.currentEntry.id
              );

              if (isNowProcessed) {
                this.log(
                  `✅ Запись ${this.state.currentEntry.id} успешно обновлена`
                );
                vscode.window.showInformationMessage(
                  `✅ Запись ${this.state.currentEntry.rowNumber} обработана`
                );
              } else {
                this.log(
                  `⚠️ Запись ${this.state.currentEntry.id} не обновилась в БД`
                );
                vscode.window.showWarningMessage(
                  `⚠️ Запись ${this.state.currentEntry.rowNumber}: статус не изменился. Проверьте результат.`
                );
              }
            }

            this.stop();
            this.callbacks.onChatCompleted();
            return;
          } else {
            this.log(
              "⚠️ Операция update_entry_fields НЕ выполнена, отправляем 'Продолжить'"
            );
            await this.sendContinueMessage();
            return; // Продолжаем мониторинг, не завершаем
          }

        case "in_progress":
          this.log("📝 Чат в процессе выполнения, продолжаем мониторинг");
          this.state.lastChangeTime = Date.now();
          return;

        default:
          this.log(`ℹ️ Статус чата: ${status}, продолжаем мониторинг`);
          this.state.lastChangeTime = Date.now();
          return;
      }
    } catch (error) {
      this.log(`Ошибка анализа чата: ${error}`);
    }
  }

  private async analyzeChatFromJSON(): Promise<void> {
    // Используем упрощенный подход через ChatExportService
    await this.handleChatAnalysis();
  }

  private async checkChatChangesMarkdown(): Promise<void> {
    // Fallback метод - просто проверяем изменения в содержимом чата
    const tempUri = vscode.Uri.joinPath(
      this.context.globalStorageUri,
      `chat-export-${Date.now()}.md`
    );

    try {
      // Выполняем команду экспорта чата
      await vscode.commands.executeCommand(
        "workbench.action.chat.export",
        tempUri
      );

      // Читаем содержимое экспортированного файла
      const content = await vscode.workspace.fs.readFile(tempUri);
      const chatContent = Buffer.from(content).toString("utf8");

      // Проверяем, изменилось ли содержимое чата
      if (chatContent !== this.state.lastChatContent) {
        this.state.lastChatContent = chatContent;
        this.state.lastChangeTime = Date.now();
        this.state.lastProgressTime = Date.now();

        // Проверяем на суммаризацию
        if (
          chatContent.includes("Summarized conversation history") ||
          chatContent.includes("суммаризация истории")
        ) {
          this.state.summarizationDetected = true;
          this.log(
            "Обнаружена суммаризация истории чата - продолжаем мониторинг"
          );
        } else {
          this.state.summarizationDetected = false;
          this.log("Обнаружены изменения в чате (fallback метод)");
        }
      } else {
        await this.handleChatTimeout();
      }

      // Удаляем временный файл
      try {
        await vscode.workspace.fs.delete(tempUri);
      } catch (deleteError) {
        // Игнорируем ошибки удаления
      }
    } catch (readError) {
      this.log(`Не удалось прочитать экспортированный файл: ${readError}`);
      // Возможно, чат не активен или экспорт не сработал
    }
  }

  private async handleChatTimeout(): Promise<void> {
    // Проверяем, прошло ли достаточно времени без изменений
    if (
      !shouldTriggerTimeout(
        this.state.lastChangeTime,
        this.config.pauseThreshold,
        this.state.summarizationDetected
      )
    ) {
      return;
    }

    // Перед завершением по timeout проверяем статус текущей записи
    if (
      this.state.currentEntry &&
      this.config.enableEntryStatusCheck !== false
    ) {
      const isProcessed = await this.checkEntryProcessingStatus(
        this.state.currentEntry.id
      );

      if (!isProcessed) {
        const maxWaitTime = this.config.maxWaitTime || 600; // 10 минут по умолчанию для MCP операций

        if (
          isMaxWaitTimeExceeded(
            this.state.entryProcessingStartTime,
            maxWaitTime
          )
        ) {
          await this.handleMaxWaitTimeExceeded();
          return;
        } else {
          this.handleContinueWaiting(maxWaitTime);
          return;
        }
      }
    }

    const adjustedThreshold = this.state.summarizationDetected
      ? this.config.pauseThreshold * 2
      : this.config.pauseThreshold;

    this.log(
      `Чат неактивен более ${adjustedThreshold}с${
        this.state.summarizationDetected ? " (с учетом суммаризации)" : ""
      }, диалог завершен`
    );

    // Останавливаем мониторинг
    this.stop();

    // Уведомляем о завершении обработки записи
    this.callbacks.onChatCompleted();
  }

  private async handleMaxWaitTimeExceeded(): Promise<void> {
    const maxWaitTime = this.config.maxWaitTime || 600;

    this.log(
      `Превышено максимальное время ожидания (${maxWaitTime}с) для записи ${
        this.state.currentEntry!.id
      } (документ: ${
        this.state.currentEntry!.documentId
      }). Принудительно завершаем обработку.`
    );

    const errorMessage = `⚠️ Превышено время ожидания для записи ${
      this.state.currentEntry!.rowNumber
    }. Обработка остановлена.`;
    vscode.window.showErrorMessage(errorMessage);

    // Останавливаем мониторинг и сообщаем об ошибке
    this.stop();
    this.callbacks.onError(errorMessage);
  }

  private handleContinueWaiting(maxWaitTime: number): void {
    const remainingTime = getRemainingProcessingTime(
      this.state.entryProcessingStartTime,
      maxWaitTime
    );
    const totalProcessingTime =
      (Date.now() - this.state.entryProcessingStartTime) / 1000;

    this.log(
      `Чат неактивен более ${this.config.pauseThreshold}с, но запись ${
        this.state.currentEntry!.id
      } (документ: ${this.state.currentEntry!.documentId}) еще не обработана. ${
        this.state.summarizationDetected ? "Обнаружена суммаризация - " : ""
      }Продолжаем мониторинг. (${formatTime(totalProcessingTime)}/${formatTime(
        maxWaitTime
      )}, осталось: ${formatTime(remainingTime)})`
    );

    // Сбрасываем таймер если была суммаризация
    if (this.state.summarizationDetected) {
      this.state.lastChangeTime = Date.now();
      this.state.summarizationDetected = false;
      this.log("Таймер сброшен из-за суммаризации");
    } else {
      // Обновляем время, чтобы дать еще один цикл ожидания
      this.state.lastChangeTime = Date.now();
    }
  }

  public isActive(): boolean {
    return this.state.isMonitoring;
  }

  public getStatus(): string {
    const baseStatus = createStatusMessage(
      this.state.isMonitoring,
      this.state.lastChangeTime,
      this.state.currentEntry?.id,
      this.state.currentEntry?.rowNumber
    );

    return `${baseStatus} | Статус чата: ${this.currentChatStatus}`;
  }

  /**
   * Получает информацию о статусе чата через ChatExportService
   */
  public async getDetailedSaveAnalysis(): Promise<string> {
    if (!this.state.isMonitoring) {
      return "Мониторинг не активен";
    }

    try {
      const analysisResult = await ChatExportService.analyzeChatStatus(
        this.context
      );

      if (!analysisResult) {
        return "Не удалось получить данные чата";
      }

      const { status, requestsCount, statusDetails } = analysisResult;

      return `Статус чата: ${status}
Количество запросов: ${requestsCount}
Детали статуса: ${JSON.stringify(statusDetails, null, 2)}`;
    } catch (error) {
      return `Ошибка анализа: ${error}`;
    }
  }

  public getCurrentEntry(): Entry | undefined {
    return this.state.currentEntry;
  }

  public getCurrentChatStatus(): string {
    return this.currentChatStatus;
  }

  /**
   * Определяет, была ли выполнена операция сохранения update_entry_fields
   */
  private async detectSaveOperation(): Promise<boolean> {
    try {
      const analysisResult = await ChatExportService.analyzeChatStatus(
        this.context
      );

      if (!analysisResult || !analysisResult.chatData) {
        return false;
      }

      // Используем библиотеку для проверки вызовов MCP инструментов
      const analyzer = ChatExportService.getAnalyzer();
      const updateCalls = analyzer.getMcpToolCalls(
        analysisResult.chatData,
        "update_entry_fields"
      );

      // Проверяем, есть ли успешные вызовы update_entry_fields
      const hasSuccessfulCall = updateCalls.some((call) => !call.isError);

      this.log(
        `📞 Найдено вызовов update_entry_fields: ${
          updateCalls.length
        }, успешных: ${updateCalls.filter((c) => !c.isError).length}`
      );

      return hasSuccessfulCall;
    } catch (error) {
      this.log(`Ошибка при определении операции сохранения: ${error}`);
      return false;
    }
  }

  /**
   * Отправляет сообщение "Продолжить" в чат
   */
  private async sendContinueMessage(): Promise<void> {
    try {
      this.log("📝 Отправляем 'Продолжить' в чат");

      // Отправляем сообщение напрямую в чат
      await vscode.commands.executeCommand(
        "workbench.action.chat.open",
        "Продолжить"
      );

      vscode.window.showInformationMessage(
        "💬 Отправлено 'Продолжить' в чат - ожидаем ответа ИИ"
      );

      // Продолжаем мониторинг вместо завершения
      this.state.lastChangeTime = Date.now();
      this.state.lastProgressTime = Date.now();
    } catch (error) {
      this.log(`Ошибка при отправке 'Продолжить': ${error}`);
      vscode.window.showErrorMessage("Ошибка при отправке сообщения в чат");
    }
  }

  public dispose(): void {
    this.stop();
  }
}

// Экспортируем также функции из других модулей для обратной совместимости
export { getAvailableToolPrompts, getToolPrompt } from "./promptService";
export {
  getRecommendedMCPConfig,
  testChatAnalysis,
  analyzeChatFromFile,
} from "./chatUtils";
export * from "./chatTypes";
