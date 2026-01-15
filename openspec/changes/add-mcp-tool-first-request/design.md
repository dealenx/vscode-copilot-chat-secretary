# Design: MCP Tools for Dialog Request Retrieval

## Context

Copilot Chat Secretary отслеживает все диалоги и сохраняет запросы пользователей. AI агенты в чате часто теряют контекст из-за сжатия истории сообщений.

Model Context Protocol (MCP) в VS Code позволяет расширениям предоставлять инструменты (tools) для AI моделей через `vscode.lm.registerTool`.

## Goals / Non-Goals

### Goals

- Предоставить MCP tool для получения первого запроса из диалога
- Предоставить MCP tool для получения любого запроса по позиции/индексу
- Поддержать два сценария:
  - Получение из текущего активного диалога
  - Получение из конкретного диалога по sessionId
- Детальные описания инструментов для AI агента с примерами использования
- Обработка ошибок (нет активного диалога, sessionId не найден, индекс вне диапазона)
- Базовая архитектура для добавления других MCP tools в будущем

### Non-Goals

- Поддержка получения всех запросов диалога за один вызов
- Возврат полного текста сообщений (используем existing данные)
- Streaming ответов
- Авторизация/аутентификация для доступа к данным

## Decisions

### Decision: Использовать VS Code Language Model API

- **Причина**: Официальный API для интеграции с Copilot Chat
- **API**: `vscode.lm.registerTool(toolName, tool)`
- **Требует**: VS Code 1.104+ (уже в engines)

### Decision: Базовый класс Tool с паттерном Template Method

- **Причина**: Переиспользование логики обработки ошибок и форматирования ответов
- **Паттерн**: Абстрактный класс `Tool` с методом `invoke()` и абстрактным `call()`
- **Альтернатива**: Дублировать логику в каждом tool - менее поддерживаемо

### Decision: Tool Names

- **First Request Tool**: `copilot_chat_secretary_get_first_request`
- **Get Request by Index Tool**: `copilot_chat_secretary_get_request`
- **Причина**: Уникальные имена, префикс с названием расширения
- **Формат**: snake_case (соглашение для tool names в MCP)

### Decision: Параметры инструментов

**GetFirstRequestTool**:

```typescript
interface GetFirstRequestToolOptions {
  sessionId?: string; // optional: если не указан - берем текущий диалог
}
```

**GetRequestTool**:

```typescript
interface GetRequestToolOptions {
  index: number; // required: позиция запроса (1-based)
  sessionId?: string; // optional: если не указан - берем текущий диалог
}
```

### Decision: Формат ответа

**GetFirstRequestTool**:

```json
{
  "success": true,
  "sessionId": "abc-123-def-456",
  "firstRequest": "Как создать React компонент?",
  "timestamp": 1768490000000,
  "requestsCount": 5
}
```

**GetRequestTool**:

```json
{
  "success": true,
  "sessionId": "abc-123-def-456",
  "request": "Добавь валидацию формы",
  "index": 2,
  "timestamp": 1768490500000,
  "totalRequests": 5
}
```

Или в случае ошибки:

```json
{
  "success": false,
  "error": "No active dialog found"
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Copilot Chat (AI Agent)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ calls MCP tool
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              VS Code Language Model API                      │
│  vscode.lm.registerTool(toolName, tool)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ invoke()
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   GetFirstRequestTool                        │
│  extends Tool                                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ call(options, token): Promise<string>               │    │
│  │   1. Parse sessionId from options                   │    │
│  │   2. Get session from DialogSessionsService         │    │
│  │   3. Return firstRequestPreview as JSON             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   GetRequestTool                             │
│  extends Tool                                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ call(options, token): Promise<string>               │    │
│  │   1. Parse sessionId and index from options         │    │
│  │   2. Load chat JSON file from session               │    │
│  │   3. Get requests using CopilotChatAnalyzer         │    │
│  │   4. Return request at index as JSON                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Core Services                                 │
│  ┌───────────────────┐    ┌────────────────────────────┐    │
│  │ ChatMonitorTree   │    │ DialogSessionsService      │    │
│  │ Provider          │    │ - getCurrentSessionId()    │    │
│  │ - getCurrentSess..│    │ - getSession(id)           │    │
│  └───────────────────┘    └────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## MCP Tool Descriptions Template

### GetFirstRequestTool

```typescript
{
  name: "copilot_chat_secretary_get_first_request",
  description: `Retrieves the first user request from a Copilot Chat dialog.

**Use this tool when:**
- You need to recall the original user request after context compression
- User asks "what was my original question?" or similar
- You need to understand the initial context of the conversation

**Parameters:**
- sessionId (optional): Specific dialog session ID. If not provided, returns from current active dialog.

**Returns:**
JSON with:
- success: boolean
- sessionId: string (if found)
- firstRequest: string (first 80 chars of the initial message)
- timestamp: number (Unix ms)
- requestsCount: number
- error: string (if failed)

**Example usage scenarios:**
1. Get first request from current dialog:
   Call without parameters

2. Get first request from specific dialog:
   Call with { sessionId: "abc-123-def-456" }`,

  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "Optional: Dialog session ID. If omitted, uses current active dialog."
      }
    }
  }
}
```

### GetRequestTool

```typescript
{
  name: "copilot_chat_secretary_get_request",
  description: `Retrieves a specific user request by position from a Copilot Chat dialog.

**Use this tool when:**
- You need to recall a specific request from the dialog history
- User asks about their Nth question or request
- You need to reference a particular point in the conversation

**Parameters:**
- index (required): Position of the request (1-based, where 1 is the first request)
- sessionId (optional): Specific dialog session ID. If not provided, uses current active dialog.

**Returns:**
JSON with:
- success: boolean
- sessionId: string (if found)
- request: string (full request message)
- index: number (the requested position)
- timestamp: number (Unix ms)
- totalRequests: number (total requests in dialog)
- error: string (if failed)

**Example usage scenarios:**
1. Get 2nd request from current dialog:
   Call with { index: 2 }

2. Get 3rd request from specific dialog:
   Call with { index: 3, sessionId: "abc-123-def-456" }`,

  inputSchema: {
    type: "object",
    properties: {
      index: {
        type: "number",
        description: "Required: Position of the request (1-based). 1 = first request, 2 = second, etc."
      },
      sessionId: {
        type: "string",
        description: "Optional: Dialog session ID. If omitted, uses current active dialog."
      }
    },
    required: ["index"]
  }
}
```

## Implementation Flow

```typescript
// 1. AI Agent decides to use tool
"I need to recall the original request..."

// 2. Copilot calls MCP tool
vscode.lm.tools.call("copilot_chat_secretary_get_first_request", {})

// 3. GetFirstRequestTool.invoke() is called
//    -> calls call(options, token)
//    -> gets sessionId from chatMonitorProvider or options
//    -> retrieves session from dialogSessionsService
//    -> formats response as JSON

// 4. Tool returns result
{
  "success": true,
  "firstRequest": "Как создать React компонент?",
  ...
}

// 5. AI Agent uses the result
"Based on your original request about creating React components..."
```

## Error Handling

| Scenario                        | Response                                                                  |
| ------------------------------- | ------------------------------------------------------------------------- |
| **GetFirstRequestTool**         |                                                                           |
| No active dialog & no sessionId | `{ success: false, error: "No active dialog found" }`                     |
| Invalid sessionId               | `{ success: false, error: "Session not found: {id}" }`                    |
| Session has no first request    | `{ success: false, error: "First request not available" }`                |
| **GetRequestTool**              |                                                                           |
| Index < 1                       | `{ success: false, error: "Index must be 1 or greater" }`                 |
| Index > totalRequests           | `{ success: false, error: "Index {n} exceeds total requests ({total})" }` |
| No chat JSON file for session   | `{ success: false, error: "Chat data not available for session" }`        |
| **Both Tools**                  |                                                                           |
| Service unavailable             | `{ success: false, error: "Service temporarily unavailable" }`            |

## Risks / Trade-offs

| Risk                                      | Mitigation                                            |
| ----------------------------------------- | ----------------------------------------------------- |
| AI агент не знает когда использовать tool | Детальное описание с примерами в `description`        |
| Performance - частые вызовы               | Данные уже в памяти (DialogSessionsService)           |
| Безопасность - утечка данных              | Возвращаем только preview (80 chars), не полный текст |
| Расширение не активировано                | Добавить activation event для `onLanguageModelTool`   |

## Open Questions

- Нужно ли добавлять rate limiting для MCP tool вызовов?
- Стоит ли логировать все вызовы MCP tools для аналитики?
- Нужен ли отдельный MCP tool для получения всех запросов диалога?
