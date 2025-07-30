"use client";
import React from "react";
import useToolsStore from "@/stores/useToolsStore";
import McpConfig from "./mcp-config";

export default function ToolsPanel() {
  const { tools, toolsValidationStatus } = useToolsStore();

  return (
    <div className="h-full p-8 w-full bg-[#f9f9f9] rounded-t-xl md:rounded-none border-l-1 border-stone-100">
      <div className="flex flex-col overflow-y-scroll h-full">
        {/* MCP Configuration */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">MCP Configuration</h3>
          <McpConfig />
        </div>
        
        {/* List of available tools or error */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">Available Tools</h3>
          {toolsValidationStatus === "error" ? (
            <div className="text-red-500">Failed to load tools.</div>
          ) : tools.length === 0 ? (
            <div className="text-zinc-500">No tools available.</div>
          ) : (
            <ul>
              {tools.map((tool, idx) => {
                const fn = tool.function || tool;
                const name = fn.name || tool.name || `Tool ${idx + 1}`;
                const description = fn.description || tool.description || "";
                return (
                  <li key={name + idx} className="mb-2 p-2 bg-white rounded border">
                    <div className="font-semibold">{name}</div>
                    <div className="text-sm text-gray-600">{description}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
