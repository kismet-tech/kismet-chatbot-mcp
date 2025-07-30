import { toolsList } from "../../config/tools-list";
import useToolsStore from "@/stores/useToolsStore";
import { WebSearchConfig } from "@/stores/useToolsStore";

interface WebSearchTool extends WebSearchConfig {
  type: "web_search";
}
export const getTools = () => {
  const {
    webSearchEnabled,
    fileSearchEnabled,
    functionsEnabled,
    codeInterpreterEnabled,
    vectorStore,
    webSearchConfig,
    mcpEnabled,
    mcpConfig,
    globalApprovalGranted,
  } = useToolsStore.getState();

  const tools = [];

  if (webSearchEnabled) {
    const webSearchTool: WebSearchTool = {
      type: "web_search",
    };
    if (
      webSearchConfig.user_location &&
      (webSearchConfig.user_location.country !== "" ||
        webSearchConfig.user_location.region !== "" ||
        webSearchConfig.user_location.city !== "")
    ) {
      webSearchTool.user_location = webSearchConfig.user_location;
    }
    tools.push(webSearchTool);
  }

  if (fileSearchEnabled) {
    const fileSearchTool = {
      type: "file_search",
      vector_store_ids: [vectorStore?.id],
    };
    tools.push(fileSearchTool);
  }

  if (codeInterpreterEnabled) {
    tools.push({ type: "code_interpreter", container: { type: "auto" } });
  }

  if (functionsEnabled) {
    tools.push(
      ...toolsList.map((tool) => {
        return {
          type: "function",
          name: tool.name,
          description: tool.description,
          parameters: {
            type: "object",
            properties: { ...tool.parameters },
            required: Object.keys(tool.parameters),
            additionalProperties: false,
          },
          strict: true,
        };
      })
    );
  }

  // Add MCP tool (single object, not individual function definitions)
  if (mcpEnabled && mcpConfig.server_url) {
    const mcpTool: any = {
      type: "mcp",
      server_label: mcpConfig.server_label || "mcp-server",
      server_url: mcpConfig.server_url,
    };
    if (mcpConfig.skip_approval || globalApprovalGranted) {
      mcpTool.require_approval = "never";
    }
    if (mcpConfig.allowed_tools?.trim()) {
      mcpTool.allowed_tools = mcpConfig.allowed_tools
        .split(",")
        .map((t: string) => t.trim())
        .filter((t: string) => t);
    }
    tools.push(mcpTool);
  }

  console.log("🔧 MCP State:", {
    mcpEnabled,
    server_url: mcpConfig.server_url,
    server_label: mcpConfig.server_label,
    globalApprovalGranted,
  });
  console.log("🔧 Functions Enabled:", functionsEnabled);
  console.log("🔧 Sending tools to OpenAI API:", tools);

  return tools;
};
