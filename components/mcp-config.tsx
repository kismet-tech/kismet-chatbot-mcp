"use client";
import React, { useState } from "react";
import useToolsStore from "@/stores/useToolsStore";
import useConversationStore from "@/stores/useConversationStore";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronRight, Code } from "lucide-react";

export default function McpConfig() {
  const { 
    mcpConfig, 
    setMcpConfig, 
    connectionStatus, 
    setConnectionStatus, 
    connectionError, 
    setConnectionError,
    tools,
    setTools,
    toolsValidationStatus,
    setToolsValidationStatus
  } = useToolsStore();

  const { addChatMessage } = useConversationStore();

  const [isTesting, setIsTesting] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);

  const handleClear = () => {
    setMcpConfig({
      server_label: "",
      server_url: "",
      allowed_tools: "",
      skip_approval: false,
    });
    setConnectionStatus("idle");
    setConnectionError(null);
    setTools([]);
    setToolsValidationStatus("idle");
    setToolsExpanded(false);
  };

  // URL validation function
  const isValidMcpUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "https:" || urlObj.protocol === "http:";
    } catch {
      return false;
    }
  };

  // Test MCP server connection and discover tools
  const testConnection = async () => {
    if (!mcpConfig.server_url) {
      setConnectionError("Please enter a server URL");
      setConnectionStatus("failed");
      return;
    }

    if (!isValidMcpUrl(mcpConfig.server_url)) {
      setConnectionError("Please enter a valid URL (e.g., https://example.com/mcp)");
      setConnectionStatus("failed");
      return;
    }

    setIsTesting(true);
    setConnectionStatus("connecting");
    setConnectionError(null);
    setToolsValidationStatus("idle");

    try {
      // Discover tools through OpenAI API (this is how it actually works)
      const tools = [
        {
          type: "mcp",
          server_label: mcpConfig.server_label || "mcp-server",
          server_url: mcpConfig.server_url,
          require_approval: mcpConfig.skip_approval ? "never" : "always",
          ...(mcpConfig.allowed_tools.trim() && {
            allowed_tools: mcpConfig.allowed_tools
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t)
          })
        }
      ];

      const toolsDiscoveryResponse = await fetch("/api/turn_response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: "What tools are available from the MCP server?"
            }
          ],
          tools: tools,
        }),
      });

      if (!toolsDiscoveryResponse.ok) {
        throw new Error(`OpenAI API error: ${toolsDiscoveryResponse.status}`);
      }

      // Read the streaming response to get tools
      const reader = toolsDiscoveryResponse.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let toolsFound = false;
      let discoveredTools = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        buffer += chunk;

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") {
              break;
            }
            
            try {
              const data = JSON.parse(dataStr);
              
              // Check for MCP tools list in the response
              if (data.event === "response.completed" && data.data?.response?.output) {
                const mcpListToolsMessage = data.data.response.output.find(
                  (m: any) => m.type === "mcp_list_tools"
                );
                
                if (mcpListToolsMessage) {
                  toolsFound = true;
                  discoveredTools = mcpListToolsMessage.tools || [];
                  console.log("✅ Discovered tools:", discoveredTools);
                }
              }
            } catch (e) {
              // Ignore parsing errors for partial data
            }
          }
        }
      }

      // If we get here, the connection was successful
      setConnectionStatus("connected");
      setConnectionError(null);
      
      if (toolsFound) {
        console.log(`✅ MCP server connection successful! Found ${discoveredTools.length} tools.`);
        setTools(discoveredTools);
        setToolsValidationStatus("valid");
        setToolsExpanded(true); // Auto-expand tools section when tools are found
        
        // Add the tools to the chat messages so they appear in the UI
        const mcpToolsListItem = {
          type: "mcp_list_tools" as const,
          id: `tools-discovery-${Date.now()}`,
          server_label: mcpConfig.server_label || "mcp-server",
          tools: discoveredTools,
        };
        addChatMessage(mcpToolsListItem);
      } else {
        console.log("✅ MCP server connection successful (no tools discovered)");
        setTools([]);
        setToolsValidationStatus("error");
      }

    } catch (error) {
      console.error("MCP connection test failed:", error);
      setConnectionStatus("failed");
      setConnectionError(error instanceof Error ? error.message : "Connection failed");
      setToolsValidationStatus("error");
    } finally {
      setIsTesting(false);
    }
  };

  // Get status display components
  const getStatusDisplay = () => {
    switch (connectionStatus) {
      case "connecting":
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Testing connection...</span>
          </div>
        );
      case "connected":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Connected</span>
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Connection failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-zinc-600 text-sm">Server details</div>
        <div
          className="text-zinc-400 text-sm px-1 transition-colors hover:text-zinc-600 cursor-pointer"
          onClick={handleClear}
        >
          Clear
        </div>
      </div>

      <div className="mt-3 space-y-3 text-zinc-400">
        <div className="flex items-center gap-2">
          <label htmlFor="server_label" className="text-sm w-24">
            Label
          </label>
          <Input
            id="server_label"
            type="text"
            placeholder="deepwiki"
            className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
            value={mcpConfig.server_label}
            onChange={(e) =>
              setMcpConfig({ ...mcpConfig, server_label: e.target.value })
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="server_url" className="text-sm w-24">
            URL
          </label>
          <div className="flex-1 space-y-2">
            <Input
              id="server_url"
              type="text"
              placeholder="https://example.com/mcp"
              className={`bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400 ${
                mcpConfig.server_url && !isValidMcpUrl(mcpConfig.server_url)
                  ? "border-red-300 focus:border-red-500"
                  : ""
              }`}
              value={mcpConfig.server_url}
              onChange={(e) => {
                setMcpConfig({ ...mcpConfig, server_url: e.target.value });
                // Reset connection status when URL changes
                if (connectionStatus !== "idle") {
                  setConnectionStatus("idle");
                  setConnectionError(null);
                }
              }}
            />
            {mcpConfig.server_url && !isValidMcpUrl(mcpConfig.server_url) && (
              <div className="flex items-center gap-1 text-red-500 text-xs">
                <AlertCircle className="h-3 w-3" />
                Please enter a valid URL
              </div>
            )}
          </div>
        </div>

        {/* Connection Status and Test Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusDisplay()}
            {connectionError && (
              <div className="text-red-500 text-xs max-w-xs">
                {connectionError}
              </div>
            )}
          </div>
          <Button
            onClick={testConnection}
            disabled={isTesting || !mcpConfig.server_url || !isValidMcpUrl(mcpConfig.server_url)}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
        </div>

        {/* Tools Dropdown Section */}
        {tools.length > 0 && (
          <div className="mt-4 border rounded-md bg-gray-50">
            <button
              onClick={() => setToolsExpanded(!toolsExpanded)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-zinc-700">
                  {tools.length} Tool{tools.length !== 1 ? 's' : ''} Available
                </span>
              </div>
              {toolsExpanded ? (
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              )}
            </button>
            
            {toolsExpanded && (
              <div className="border-t bg-white p-3 space-y-2">
                {tools.map((tool, index) => (
                  <div key={index} className="p-2 rounded border bg-gray-50">
                    <div className="flex items-center gap-2 mb-1">
                      <Code className="h-3 w-3 text-blue-500" />
                      <span className="font-mono text-xs font-medium text-zinc-700">
                        {tool.name}
                      </span>
                    </div>
                    {tool.description && (
                      <div className="text-xs text-zinc-600 ml-5">
                        {tool.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <label htmlFor="allowed_tools" className="text-sm w-24">
            Allowed
          </label>
          <Input
            id="allowed_tools"
            type="text"
            placeholder="tool1,tool2"
            className="bg-white border text-sm flex-1 text-zinc-900 placeholder:text-zinc-400"
            value={mcpConfig.allowed_tools}
            onChange={(e) =>
              setMcpConfig({ ...mcpConfig, allowed_tools: e.target.value })
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="skip_approval" className="text-sm w-24">
            Skip approval
          </label>
          <Switch
            id="skip_approval"
            checked={mcpConfig.skip_approval}
            onCheckedChange={(checked) =>
              setMcpConfig({ ...mcpConfig, skip_approval: checked })
            }
          />
        </div>
      </div>
    </div>
  );
}
