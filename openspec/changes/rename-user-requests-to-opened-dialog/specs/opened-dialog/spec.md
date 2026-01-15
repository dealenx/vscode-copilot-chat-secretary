# Opened Dialog View Specification

## ADDED Requirements

### Requirement: Opened Dialog View

The extension MUST provide an "Opened Dialog" view showing the current active conversation between user and AI agent.

#### Scenario: Display empty state

**Given** no active chat session  
**When** the "Opened Dialog" view is rendered  
**Then** an empty state message is displayed  
**And** the message suggests starting a chat with Copilot

#### Scenario: Display user messages

**Given** an active chat with user messages  
**When** the "Opened Dialog" view is rendered  
**Then** each user message is displayed as a collapsible tree item  
**And** the message icon is a comment icon (💬)  
**And** the message shows turn number (#1, #2, etc.)

#### Scenario: Display AI responses under user messages

**Given** a user message with an AI response  
**When** the user expands the message item  
**Then** the AI response is shown as a child item  
**And** the response icon is a robot icon (🤖)  
**And** the response text is truncated to ~50 characters

---

### Requirement: Response Status Indicators

The extension MUST display visual status indicators for AI responses.

#### Scenario: Success status indicator

**Given** an AI response that completed successfully  
**When** the response item is rendered  
**Then** a success icon (✅ check) is displayed  
**And** the icon color indicates success (green)

#### Scenario: Error status indicator

**Given** an AI response that failed with an error  
**When** the response item is rendered  
**Then** an error icon (❌ error) is displayed  
**And** the icon color indicates error (red)

#### Scenario: In-progress status indicator

**Given** an AI response that is being generated  
**When** the response item is rendered  
**Then** a spinning sync icon (⏳ sync~spin) is displayed  
**And** the icon color indicates in-progress (blue)

#### Scenario: Pending status indicator

**Given** a user message without a response yet  
**When** the response area is rendered  
**Then** a clock icon (⏳ clock) is displayed  
**And** text indicates "waiting for response"

---

### Requirement: Tool Call Indicator

The extension MUST show when AI responses used tool calls.

#### Scenario: Response with tool calls

**Given** an AI response that used tool calls  
**When** the response item is rendered  
**Then** the tool call count is shown in format "[N tools]"  
**And** the count is appended to the response text

#### Scenario: Response without tool calls

**Given** an AI response without tool calls  
**When** the response item is rendered  
**Then** no tool count indicator is shown

---

### Requirement: Full Message Tooltips

The extension MUST show full message text in tooltips.

#### Scenario: User message tooltip

**Given** a truncated user message  
**When** the user hovers over the message item  
**Then** the full message text is shown in a tooltip

#### Scenario: AI response tooltip

**Given** a truncated AI response  
**When** the user hovers over the response item  
**Then** the full response text is shown in a tooltip

## REMOVED Requirements

### Requirement: User Requests View

The "User Requests" view is replaced by "Opened Dialog" view.

#### Scenario: View name changed

**Given** the extension is installed  
**When** the user opens the sidebar  
**Then** the view is named "Opened Dialog" instead of "User Requests"
