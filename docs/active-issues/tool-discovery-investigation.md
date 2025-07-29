# MCP Tool Discovery Investigation

## **🔍 Problem Statement**

The "Test Connection" button in the MCP config is not working properly. Need to understand how tool discovery actually works in the platform and custom-chat-element repos and apply the same approach.

## **📋 Investigation Findings**

### **How Platform Actually Handles MCP Tools**

After examining the platform codebase, here's how MCP tools are actually handled:

#### **1. Platform Architecture**

```
Frontend → /ask endpoint → Backend chatProxy → OpenAI API → MCP Server
```

**Key Insight**: The platform uses a **chatProxy endpoint** (`/chatProxy/stream-chat-completion`) that handles MCP tools, not direct MCP server calls.

#### **2. Platform Flow**

**Frontend (`platform/frontend/public/chat-interface.js`)**:

```javascript
async getResponse(message) {
  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('query', message);
  queryParams.append('site', selectedSite);
  // ... other params

  const url = `/ask?${queryString}`;
  this.eventSource = new ManagedEventSource(url);
}
```

**Frontend API Route (`platform/frontend/src/app/ask/route.ts`)**:

```typescript
// Proxies to backend
const backendUrl = `${BACKEND_API_URL}/ask?${queryString}`;
const response = await fetchWithTLS(backendUrl, {
  method: "POST",
  headers: { "Content-Type": contentType },
  body,
});
```

**Backend ChatProxy (`platform/backend/src/controllers/chatProxy/streamChatCompletion/handleStreamChatCompletion.ts`)**:

```typescript
// Build the OpenAI request parameters
const requestParams: any = {
  model: "gpt-4o",
  input: processedInput,
  tools: dto.tools, // ← MCP tools are passed here
  stream: true,
  parallel_tool_calls: false,
};

// Make the OpenAI responses.create request
const events = await openai.responses.create(requestParams);
```

#### **3. How Tools Are Discovered**

The platform doesn't discover tools directly. Instead:

1. **Tools are configured** in the backend (database, config files)
2. **Tools are sent** to the chatProxy endpoint via the `tools` parameter
3. **OpenAI handles** the MCP protocol communication
4. **Tools are returned** in the streaming response

#### **4. Platform vs Custom-chat-element**

**Platform Approach**:

- ✅ Uses chatProxy endpoint
- ✅ Tools configured in backend
- ✅ No direct MCP server calls from frontend
- ✅ No CORS issues

**Custom-chat-element Approach**:

- ✅ Uses OpenAI API directly
- ✅ Tools configured in frontend
- ✅ No direct MCP server calls from frontend
- ✅ No CORS issues

**My Wrong Approach**:

- ❌ Tried direct MCP server calls from frontend
- ❌ Caused CORS errors
- ❌ Didn't follow either pattern

## **🚨 Problems with Current Implementation**

### **1. Wrong Architecture**

- ❌ **Current**: Trying to call MCP server directly from frontend
- ✅ **Should be**: Use chatProxy endpoint like platform OR OpenAI API like custom-chat-element

### **2. CORS Issues**

- ❌ **Current**: Direct frontend calls to MCP server cause CORS errors
- ✅ **Should be**: Never call MCP servers directly from browser

### **3. Missing Tool Configuration**

- ❌ **Current**: Not properly configuring tools for the chatProxy endpoint
- ✅ **Should be**: Send tools configuration to the backend

## **🔧 Correct Implementation Options**

### **Option 1: Follow Platform Pattern (Recommended)**

Use the chatProxy endpoint approach:

```typescript
// Test connection by sending a message to chatProxy
const testConnection = async () => {
  const response = await fetch("/api/turn_response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: "test-client",
      chatInstanceUUID: "test-chat",
      messages: [
        {
          role: "user",
          content: "What tools are available?",
        },
      ],
      tools: [
        {
          type: "mcp",
          server_label: mcpConfig.server_label,
          server_url: mcpConfig.server_url,
          require_approval: mcpConfig.skip_approval ? "never" : "always",
        },
      ],
    }),
  });

  // Handle streaming response for tool discovery
  // Look for mcp_list_tools in the response
};
```

### **Option 2: Follow Custom-chat-element Pattern**

Use the OpenAI API approach (current implementation, but fix the CORS issue):

```typescript
// Remove direct MCP server calls
// Only use OpenAI API approach
const testConnection = async () => {
  const tools = [
    {
      type: "mcp",
      server_label: mcpConfig.server_label,
      server_url: mcpConfig.server_url,
      require_approval: mcpConfig.skip_approval ? "never" : "always",
    },
  ];

  const response = await fetch("/api/turn_response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: "What tools are available from the MCP server?",
        },
      ],
      tools: tools,
    }),
  });

  // Handle streaming response for tool discovery
};
```

## **📝 Next Steps**

1. **Choose an approach**: Platform pattern (chatProxy) or custom-chat-element pattern (OpenAI API)
2. **Remove direct MCP server calls** from test connection function
3. **Use the chosen pattern** for tool discovery
4. **Test with a real MCP server** to verify the flow works

## **🎯 Key Takeaway**

Both the platform and custom-chat-element avoid direct MCP server calls from the frontend due to CORS restrictions. The platform uses a chatProxy endpoint, while custom-chat-element uses the OpenAI API directly. **Never call MCP servers directly from the browser.**
