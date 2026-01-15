# Tasks: Add User Requests History

## Implementation Tasks

- [x] **1. Add UserRequest interface to copilot-chat-analyzer**

  - File: `copilot-chat-analyzer/src/index.ts`
  - Add interface with: id, message, timestamp (optional), index

- [x] **2. Add getUserRequests method to CopilotChatAnalyzer class**

  - File: `copilot-chat-analyzer/src/index.ts`
  - Parse chatData.requests and extract user messages
  - Return array of UserRequest objects

- [x] **3. Export UserRequest interface from library**

  - File: `copilot-chat-analyzer/src/index.ts`
  - Add to exports at the bottom of file

- [x] **4. Rebuild copilot-chat-analyzer library**

  - Run build in `copilot-chat-analyzer/` directory

- [x] **5. Update RequestsTreeProvider to use library method**

  - File: `src/providers/requestsTreeProvider.ts`
  - Import UserRequest from copilot-chat-analyzer
  - Remove inline parseRequests method
  - Use analyzer.getUserRequests(chatData)

- [x] **6. Update ChatMonitorTreeProvider to use library method**

  - File: `src/providers/chatMonitorTreeProvider.ts`
  - Remove inline parseRequests method
  - Use analyzer.getUserRequests(chatData)

- [x] **7. Build and test extension**
  - Run `pnpm run build`
  - Verify User Requests list displays correctly

## Validation

- [x] Library builds without errors
- [x] Extension builds without errors
- [x] User Requests view shows correct messages
- [x] Tooltip shows full message text
