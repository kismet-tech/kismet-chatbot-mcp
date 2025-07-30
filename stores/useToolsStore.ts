import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { defaultVectorStore } from "@/config/constants";

type File = {
  id: string;
  name: string;
  content: string;
};

type VectorStore = {
  id: string;
  name: string;
  files?: File[];
};

export type WebSearchConfig = {
  user_location?: {
    type: "approximate";
    country?: string;
    city?: string;
    region?: string;
  };
};

export type McpConfig = {
  server_label: string;
  server_url: string;
  allowed_tools: string;
  skip_approval: boolean;
};

export type ConnectionStatus = "idle" | "connecting" | "connected" | "failed";

export type ToolsValidationStatus = "idle" | "valid" | "error";

interface StoreState {
  fileSearchEnabled: boolean;
  //previousFileSearchEnabled: boolean;
  setFileSearchEnabled: (enabled: boolean) => void;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
  functionsEnabled: boolean;
  //previousFunctionsEnabled: boolean;
  setFunctionsEnabled: (enabled: boolean) => void;
  codeInterpreterEnabled: boolean;
  setCodeInterpreterEnabled: (enabled: boolean) => void;
  vectorStore: VectorStore | null;
  setVectorStore: (store: VectorStore) => void;
  webSearchConfig: WebSearchConfig;
  setWebSearchConfig: (config: WebSearchConfig) => void;
  mcpEnabled: boolean;
  setMcpEnabled: (enabled: boolean) => void;
  mcpConfig: McpConfig;
  setMcpConfig: (config: McpConfig) => void;
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  connectionError: string | null;
  setConnectionError: (error: string | null) => void;
  // Tools state (from custom-chat-element)
  tools: any[];
  setTools: (tools: any[]) => void;
  toolsValidationStatus: ToolsValidationStatus;
  setToolsValidationStatus: (status: ToolsValidationStatus) => void;
  // Global approval state (from custom-chat-element)
  globalApprovalGranted: boolean;
  setGlobalApprovalGranted: (granted: boolean) => void;
}

const useToolsStore = create<StoreState>()(
  persist(
    (set) => ({
      vectorStore: defaultVectorStore.id !== "" ? defaultVectorStore : null,
      webSearchConfig: {
        user_location: {
          type: "approximate",
          country: "",
          city: "",
          region: "",
        },
      },
      mcpConfig: {
        server_label: "",
        server_url: "",
        allowed_tools: "",
        skip_approval: true,
      },
      connectionStatus: "idle",
      connectionError: null,
      // Tools state
      tools: [],
      setTools: (tools) => set({ tools }),
      toolsValidationStatus: "idle",
      setToolsValidationStatus: (status) => set({ toolsValidationStatus: status }),
      fileSearchEnabled: false,
      previousFileSearchEnabled: false,
      setFileSearchEnabled: (enabled) => {
        set({ fileSearchEnabled: enabled });
      },
      webSearchEnabled: false,
      setWebSearchEnabled: (enabled) => {
        set({ webSearchEnabled: enabled });
      },
      functionsEnabled: false,
      previousFunctionsEnabled: true,
      setFunctionsEnabled: (enabled) => {
        set({ functionsEnabled: enabled });
      },
      mcpEnabled: false,
      setMcpEnabled: (enabled) => {
        set({ mcpEnabled: enabled });
      },
      codeInterpreterEnabled: false,
      setCodeInterpreterEnabled: (enabled) => {
        set({ codeInterpreterEnabled: enabled });
      },
      setVectorStore: (store) => {
        set({ vectorStore: store });
      },
      setWebSearchConfig: (config) => {
        set({ webSearchConfig: config });
      },
      setMcpConfig: (config) => {
        set({ mcpConfig: config });
      },
      setConnectionStatus: (status) => {
        set({ connectionStatus: status });
      },
      setConnectionError: (error) => {
        set({ connectionError: error });
      },
      // Global approval state
      globalApprovalGranted: false,
      setGlobalApprovalGranted: (granted) => {
        set({ globalApprovalGranted: granted });
      },
    }),
    {
      name: "tools-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mcpConfig: state.mcpConfig,
        mcpEnabled: state.mcpEnabled,
        functionsEnabled: state.functionsEnabled,
        tools: state.tools,
        toolsValidationStatus: state.toolsValidationStatus,
        globalApprovalGranted: state.globalApprovalGranted,
      }),
    }
  )
);

export default useToolsStore;
