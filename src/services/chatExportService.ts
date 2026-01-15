// services/chatExportService.ts
import * as vscode from "vscode";
import CopilotChatAnalyzer from "copilot-chat-analyzer";

/**
 * Единый сервис для экспорта и анализа чата Copilot
 */
export class ChatExportService {
  private static analyzer = new CopilotChatAnalyzer();

  /**
   * Экспортирует чат в JSON и возвращает данные чата
   */
  static async exportChatData(
    context?: vscode.ExtensionContext
  ): Promise<any | null> {
    try {
      // Создаем временный файл для экспорта чата
      const tempUri = vscode.Uri.joinPath(
        context?.globalStorageUri ||
          vscode.workspace.workspaceFolders?.[0]?.uri ||
          vscode.Uri.file("."),
        `chat-export-${Date.now()}.json`
      );

      // Экспортируем чат в JSON формате
      try {
        await vscode.commands.executeCommand(
          "workbench.action.chat.export",
          tempUri
        );
      } catch (exportError) {
        console.log(`[ChatExportService] Ошибка экспорта чата: ${exportError}`);
        return null;
      }

      // Читаем содержимое JSON файла
      const content = await vscode.workspace.fs.readFile(tempUri);
      const jsonContent = Buffer.from(content).toString("utf8");

      // Парсим JSON данные чата
      let chatData;
      try {
        chatData = JSON.parse(jsonContent);
      } catch (parseError) {
        console.log(`[ChatExportService] Ошибка парсинга JSON: ${parseError}`);
        return null;
      }

      // Удаляем временный файл
      try {
        await vscode.workspace.fs.delete(tempUri);
      } catch (deleteError) {
        // Игнорируем ошибки удаления
      }

      return chatData;
    } catch (error) {
      console.error("[ChatExportService] Ошибка при экспорте чата:", error);
      return null;
    }
  }

  /**
   * Анализирует чат и возвращает полную информацию о статусе
   */
  static async analyzeChatStatus(context?: vscode.ExtensionContext): Promise<{
    status: string;
    requestsCount: number;
    statusDetails: any;
    chatData: any;
  } | null> {
    const chatData = await this.exportChatData(context);

    if (!chatData) {
      return null;
    }

    try {
      const status = this.analyzer.getDialogStatus(chatData);
      const requestsCount = this.analyzer.getRequestsCount(chatData);
      const statusDetails = this.analyzer.getDialogStatusDetails(chatData);

      return {
        status,
        requestsCount,
        statusDetails,
        chatData,
      };
    } catch (error) {
      console.error("[ChatExportService] Ошибка анализа чата:", error);
      return null;
    }
  }

  /**
   * Получает только статус диалога
   */
  static async getDialogStatus(
    context?: vscode.ExtensionContext
  ): Promise<string | null> {
    const chatData = await this.exportChatData(context);

    if (!chatData) {
      return null;
    }

    try {
      return this.analyzer.getDialogStatus(chatData);
    } catch (error) {
      console.error("[ChatExportService] Ошибка получения статуса:", error);
      return null;
    }
  }

  /**
   * Проверяет, отменен ли чат
   */
  static async isChatCanceled(
    context?: vscode.ExtensionContext
  ): Promise<boolean> {
    const status = await this.getDialogStatus(context);
    return status === "canceled";
  }

  /**
   * Проверяет, завершен ли чат
   */
  static async isChatCompleted(
    context?: vscode.ExtensionContext
  ): Promise<boolean> {
    const status = await this.getDialogStatus(context);
    return status === "completed";
  }

  /**
   * Получает статический анализатор для прямого использования
   */
  static getAnalyzer(): CopilotChatAnalyzer {
    return this.analyzer;
  }
}
