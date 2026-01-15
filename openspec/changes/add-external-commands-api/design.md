# Design: External Commands API

## Context

Copilot Chat Secretary собирает данные о статусе и истории чата. Другие расширения могут использовать эти данные для:

- Отображения статуса в status bar
- Автоматизации workflow на основе состояния чата
- Интеграции с другими инструментами разработки
- Аналитики и логирования

## Goals / Non-Goals

### Goals

- Простой доступ к данным через `vscode.commands.executeCommand()`
- Типизированные возвращаемые значения
- Стабильный API без breaking changes
- Документированные команды

### Non-Goals

- Push-модель с событиями (только polling через команды)
- Extension exports API (отложено)
- Прямой доступ к внутренним сервисам

## Decisions

### Decision: Commands API вместо Extension Exports

- **Причина**: Проще для потребителей — не нужно проверять активацию расширения
- **Альтернатива**: Extension exports с событиями — отложено на будущее

### Decision: Префикс `api.` для команд

- **Причина**: Отделение публичного API от внутренних команд
- **Формат**: `copilotChatSecretary.api.<method>`

### Decision: Immutable data copies

- **Причина**: Внешние расширения не должны мутировать внутреннее состояние
- **Реализация**: Возврат копий объектов, а не ссылок

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    External Extension                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ vscode.commands.executeCommand()
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Commands API Layer                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ copilotChatSecretary.api.getStatus                  │    │
│  │ copilotChatSecretary.api.getCurrentDialog           │    │
│  │ copilotChatSecretary.api.getDialogHistory           │    │
│  │ copilotChatSecretary.api.getSession                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ calls
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Core Services                             │
│  ┌───────────────────┐    ┌────────────────────────────┐    │
│  │ ChatMonitorTree   │    │ DialogSessionsService      │    │
│  │ Provider          │    │                            │    │
│  └───────────────────┘    └────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## API Response Types

```typescript
// Возвращается из getStatus
interface ChatStatusResponse {
  status: "pending" | "in_progress" | "completed" | "canceled" | "failed";
  sessionId: string | null;
  requestsCount: number;
  lastUpdate: number; // Unix timestamp ms
  isActive: boolean;
}

// Возвращается из getCurrentDialog и getSession
interface DialogSessionResponse {
  sessionId: string;
  status: string;
  firstSeen: number;
  lastSeen: number;
  requestsCount: number;
  firstRequestPreview: string;
  agentId?: string;
  modelId?: string;
}

// Аргументы для getDialogHistory
interface GetDialogHistoryOptions {
  limit?: number; // default: 100
  status?: string; // filter by status
}

// Аргументы для getSession
interface GetSessionOptions {
  sessionId: string;
}
```

## Risks / Trade-offs

| Risk                                                 | Mitigation                                               |
| ---------------------------------------------------- | -------------------------------------------------------- |
| API stability — изменения могут сломать потребителей | Версионирование через package.json, deprecation warnings |
| Performance — частые вызовы могут замедлить работу   | Возврат легковесных копий, без тяжелых операций          |
| Безопасность — утечка чувствительных данных          | Не включать полный текст сообщений в history API         |

## Open Questions

- Нужен ли rate limiting для защиты от злоупотреблений?
- Добавлять ли версию API в ответ для совместимости?
