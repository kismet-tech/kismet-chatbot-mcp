import { DEVELOPER_PROMPT } from "@/config/constants";
import { parse } from "partial-json";
import { handleTool } from "@/lib/tools/tools-handling";
import useConversationStore from "@/stores/useConversationStore";
import { getTools } from "./tools/tools";
import { Annotation } from "@/components/annotations";
import { functionsMap } from "@/config/functions";
import { HotelCarousel } from "../components/customChatElements/hotelCarousel/HotelCarousel";
import { PriceComparison } from "../components/customChatElements/priceComparison/PriceComparison";
import { DestinationCarousel } from "../components/customChatElements/destinationCarousel/DestinationCarousel";

const normalizeAnnotation = (annotation: any): Annotation => ({
  ...annotation,
  fileId: annotation.file_id ?? annotation.fileId,
  containerId: annotation.container_id ?? annotation.containerId,
});

export interface ContentItem {
  type: "input_text" | "output_text" | "refusal" | "output_audio";
  annotations?: Annotation[];
  text?: string;
}

// Message items for storing conversation history matching API shape
export interface MessageItem {
  type: "message";
  role: "user" | "assistant" | "system";
  id?: string;
  content: ContentItem[];
}

// Custom items to display in chat
export interface ToolCallItem {
  type: "tool_call";
  tool_type:
    | "file_search_call"
    | "web_search_call"
    | "function_call"
    | "mcp_call"
    | "code_interpreter_call";
  status: "in_progress" | "completed" | "failed" | "searching";
  id: string;
  name?: string | null;
  call_id?: string;
  arguments?: string;
  parsedArguments?: any;
  output?: string | null;
  code?: string;
  files?: {
    file_id: string;
    mime_type: string;
    container_id?: string;
    filename?: string;
  }[];
}

export interface McpListToolsItem {
  type: "mcp_list_tools";
  id: string;
  server_label: string;
  tools: { name: string; description?: string }[];
}

export interface McpApprovalRequestItem {
  type: "mcp_approval_request";
  id: string;
  server_label: string;
  name: string;
  arguments?: string;
}

export interface HotelListItem {
  type: "hotel_list";
  id: string;
  hotels: {
    hotel_id: string;
    name: string;
    description: string;
    starRating: {
      ratingValue: string;
    };
    address: {
      addressLocality: string;
    };
    image: string[];
    aggregateRating: {
      ratingValue: string;
      reviewCount: string;
    };
    nightlyPrice: string;
    amenityFeature: Array<{
      name: string;
    }>;
    url?: string;
    telephone?: string;
    checkinTime?: string;
    checkoutTime?: string;
    availability?: boolean;
    loyaltyAffiliation?: string[];
    suggestedNextActions?: string[];
  }[];
}

export interface PriceComparisonItem {
  type: "price_comparison_list";
  id: string;
  hotel_name: string;
  location: string;
  dates: {
    check_in: string;
    check_out: string;
  };
  prices: {
    provider: string;
    price: number;
    booking_url: string;
    logo_url?: string;
  }[];
}

export interface DestinationListItem {
  type: "destination_list";
  id: string;
  destinations: {
    id: string;
    name: string;
    description: string;
    image_url?: string;
    activities?: string[];
  }[];
}

export interface SocialMediaFeedItem {
  type: "social_media_feed";
  id: string;
  posts: {
    id: string;
    platform: string;
    content: string;
    image_url?: string;
    engagement: {
      likes: number;
      comments: number;
      shares: number;
    };
  }[];
}

export interface HotelRoomsItem {
  type: "hotel_rooms";
  id: string;
  rooms: {
    name: string;
    description: string;
    occupancy: {
      maxValue: number;
      unitText: string;
    };
    bed: {
      typeOfBed: string;
    };
    floorSize: {
      value: number;
      unitText: string;
    };
    price: {
      price: string;
      priceCurrency: string;
    };
    amenityFeature: string[];
    image: string[];
    suggestedNextActions: string[];
  }[];
}

export type Item =
  | MessageItem
  | ToolCallItem
  | McpListToolsItem
  | McpApprovalRequestItem
  | HotelListItem
  | PriceComparisonItem
  | DestinationListItem
  | SocialMediaFeedItem
  | HotelRoomsItem;

export const handleTurn = async (
  messages: any[],
  tools: any[],
  onMessage: (data: any) => void
) => {
  try {
    // Get response from the API (defined in app/api/turn_response/route.ts)
    const response = await fetch("/api/turn_response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages,
        tools: tools,
      }),
    });

    if (!response.ok) {
      console.error(`Error: ${response.status} - ${response.statusText}`);
      return;
    }

    // Reader for streaming data
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let buffer = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      buffer += chunkValue;

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6);
          if (dataStr === "[DONE]") {
            done = true;
            break;
          }
          const data = JSON.parse(dataStr);
          onMessage(data);
        }
      }
    }

    // Handle any remaining data in buffer
    if (buffer && buffer.startsWith("data: ")) {
      const dataStr = buffer.slice(6);
      if (dataStr !== "[DONE]") {
        const data = JSON.parse(dataStr);
        onMessage(data);
      }
    }
  } catch (error) {
    console.error("Error handling turn:", error);
  }
};

export const processMessages = async () => {
  const {
    chatMessages,
    conversationItems,
    setChatMessages,
    setConversationItems,
    setAssistantLoading,
  } = useConversationStore.getState();

  const tools = getTools();
  const allConversationItems = [
    // Adding developer prompt as first item in the conversation
    {
      role: "developer",
      content: DEVELOPER_PROMPT,
    },
    ...conversationItems,
  ];

  let assistantMessageContent = "";
  let functionArguments = "";
  // For streaming MCP tool call arguments
  let mcpArguments = "";

  await handleTurn(allConversationItems, tools, async ({ event, data }) => {
    switch (event) {
      case "response.output_text.delta":
      case "response.output_text.annotation.added": {
        const { delta, item_id, annotation } = data;

        let partial = "";
        if (typeof delta === "string") {
          partial = delta;
        }
        assistantMessageContent += partial;

        // If the last message isn't an assistant message, create a new one
        const lastItem = chatMessages[chatMessages.length - 1];
        if (
          !lastItem ||
          lastItem.type !== "message" ||
          lastItem.role !== "assistant" ||
          (lastItem.id && lastItem.id !== item_id)
        ) {
          chatMessages.push({
            type: "message",
            role: "assistant",
            id: item_id,
            content: [
              {
                type: "output_text",
                text: assistantMessageContent,
              },
            ],
          } as MessageItem);
        } else {
          const contentItem = lastItem.content[0];
          if (contentItem && contentItem.type === "output_text") {
            contentItem.text = assistantMessageContent;
            if (annotation) {
              contentItem.annotations = [
                ...(contentItem.annotations ?? []),
                normalizeAnnotation(annotation),
              ];
            }
          }
        }

        setChatMessages([...chatMessages]);
        setAssistantLoading(false);
        break;
      }

      case "response.output_item.added": {
        const { item } = data || {};
        // New item coming in
        if (!item || !item.type) {
          break;
        }
        setAssistantLoading(false);
        // Handle differently depending on the item type
        switch (item.type) {
          case "message": {
            const text = item.content?.text || "";
            const annotations =
              item.content?.annotations?.map(normalizeAnnotation) || [];
            chatMessages.push({
              type: "message",
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text,
                  ...(annotations.length > 0 ? { annotations } : {}),
                },
              ],
            });
            conversationItems.push({
              role: "assistant",
              content: [
                {
                  type: "output_text",
                  text,
                  ...(annotations.length > 0 ? { annotations } : {}),
                },
              ],
            });
            setChatMessages([...chatMessages]);
            setConversationItems([...conversationItems]);
            break;
          }
          case "function_call": {
            functionArguments += item.arguments || "";
            chatMessages.push({
              type: "tool_call",
              tool_type: "function_call",
              status: "in_progress",
              id: item.id,
              name: item.name, // function name,e.g. "get_weather"
              arguments: item.arguments || "",
              parsedArguments: {},
              output: null,
            });
            setChatMessages([...chatMessages]);
            break;
          }
          case "web_search_call": {
            chatMessages.push({
              type: "tool_call",
              tool_type: "web_search_call",
              status: item.status || "in_progress",
              id: item.id,
            });
            setChatMessages([...chatMessages]);
            break;
          }
          case "file_search_call": {
            chatMessages.push({
              type: "tool_call",
              tool_type: "file_search_call",
              status: item.status || "in_progress",
              id: item.id,
            });
            setChatMessages([...chatMessages]);
            break;
          }
          case "mcp_call": {
            mcpArguments = item.arguments || "";
            chatMessages.push({
              type: "tool_call",
              tool_type: "mcp_call",
              status: "in_progress",
              id: item.id,
              name: item.name,
              arguments: item.arguments || "",
              parsedArguments: item.arguments ? parse(item.arguments) : {},
              output: null,
            });
            setChatMessages([...chatMessages]);
            break;
          }
          case "code_interpreter_call": {
            chatMessages.push({
              type: "tool_call",
              tool_type: "code_interpreter_call",
              status: item.status || "in_progress",
              id: item.id,
              code: "",
              files: [],
            });
            setChatMessages([...chatMessages]);
            break;
          }
        }
        break;
      }

      case "response.output_item.done": {
        const { item } = data || {};
        
        // Handle MCP tool completion
        if (item.type === "mcp_call") {
          console.log("🔧 MCP tool completed:", item.name);
          
          // Process tool output based on tool name (like custom-chat-element)
          switch (item.name) {
            case "find_hotel_by_query": {
              let hotels = [];
              if (item.output) {
                // Try to parse hotels data from different possible formats
                if (typeof item.output === 'string') {
                  try {
                    hotels = JSON.parse(item.output);
                  } catch (e) {
                    console.error("Failed to parse hotel data from string:", e);
                  }
                } else if (item.output && typeof item.output === 'object') {
                  // Check if output has content array (MCP format)
                  if (Array.isArray(item.output.content)) {
                    // Try to parse the text content
                    const textContent = item.output.content.find((c: any) => c.type === 'text');
                    if (textContent && textContent.text) {
                      try {
                        hotels = JSON.parse(textContent.text);
                      } catch (e) {
                        console.error("Failed to parse hotel data from MCP content:", e);
                      }
                    }
                  } else if (Array.isArray(item.output)) {
                    // Direct array of hotels
                    hotels = item.output;
                  }
                }
              }
              
              if (Array.isArray(hotels) && hotels.length > 0) {
                // Create hotel list item
                const hotelListItem: HotelListItem = {
                  type: "hotel_list",
                  id: item.id,
                  hotels: hotels,
                };
                
                chatMessages.push(hotelListItem);
                setChatMessages([...chatMessages]);
                console.log("✅ Added HotelListItem to chatMessages with", hotels.length, "hotels");
              } else {
                console.log("No valid hotels found in output");
              }
              break;
            }
            
            case "book_hotel": {
              let priceComparisons = [];
              let hotelName = "Hotel";
              let hotelLocation = "";
              let checkInDate = "";
              let checkOutDate = "";
              
              if (item.output) {
                // Try to parse price comparison data from different possible formats
                if (typeof item.output === 'string') {
                  try {
                    const parsed = JSON.parse(item.output);
                    // Handle new structured response
                    if (parsed.priceComparisons && Array.isArray(parsed.priceComparisons)) {
                      priceComparisons = parsed.priceComparisons;
                      hotelName = parsed.hotelName || "Hotel";
                      hotelLocation = parsed.hotelLocation || "";
                      checkInDate = parsed.checkInDate || "";
                      checkOutDate = parsed.checkOutDate || "";
                    } else {
                      // Fallback to old format
                      priceComparisons = parsed;
                    }
                  } catch (e) {
                    console.error("Failed to parse price comparison data from string:", e);
                  }
                } else if (item.output && typeof item.output === 'object') {
                  // Check if output has content array (MCP format)
                  if (Array.isArray(item.output.content)) {
                    // Try to parse the text content
                    const textContent = item.output.content.find((c: any) => c.type === 'text');
                    if (textContent && textContent.text) {
                      try {
                        const parsed = JSON.parse(textContent.text);
                        // Handle new structured response
                        if (parsed.priceComparisons && Array.isArray(parsed.priceComparisons)) {
                          priceComparisons = parsed.priceComparisons;
                          hotelName = parsed.hotelName || "Hotel";
                          hotelLocation = parsed.hotelLocation || "";
                          checkInDate = parsed.checkInDate || "";
                          checkOutDate = parsed.checkOutDate || "";
                        } else {
                          // Fallback to old format
                          priceComparisons = parsed;
                        }
                      } catch (e) {
                        console.error("Failed to parse price comparison data from MCP content:", e);
                      }
                    }
                  } else if (Array.isArray(item.output)) {
                    // Direct array of price comparisons (old format)
                    priceComparisons = item.output;
                  }
                }
              }
              
              if (Array.isArray(priceComparisons) && priceComparisons.length > 0) {
                // Create price comparison item
                const priceComparisonItem: PriceComparisonItem = {
                  type: "price_comparison_list",
                  id: item.id,
                  hotel_name: hotelName,
                  location: hotelLocation,
                  dates: {
                    check_in: checkInDate,
                    check_out: checkOutDate,
                  },
                  prices: priceComparisons,
                };
                
                chatMessages.push(priceComparisonItem);
                setChatMessages([...chatMessages]);
                console.log("✅ Added PriceComparisonItem to chatMessages with", priceComparisons.length, "price comparisons");
              } else {
                console.log("No valid price comparisons found in output");
              }
              break;
            }
            
            case "find_destination_by_query": {
              let destinations = [];
              if (item.output) {
                // Try to parse destinations data from different possible formats
                if (typeof item.output === 'string') {
                  try {
                    destinations = JSON.parse(item.output);
                  } catch (e) {
                    console.error("Failed to parse destination data from string:", e);
                  }
                } else if (item.output && typeof item.output === 'object') {
                  // Check if output has content array (MCP format)
                  if (Array.isArray(item.output.content)) {
                    // Try to parse the text content
                    const textContent = item.output.content.find((c: any) => c.type === 'text');
                    if (textContent && textContent.text) {
                      try {
                        destinations = JSON.parse(textContent.text);
                      } catch (e) {
                        console.error("Failed to parse destination data from MCP content:", e);
                      }
                    }
                  } else if (Array.isArray(item.output)) {
                    // Direct array of destinations
                    destinations = item.output;
                  }
                }
              }
              
              if (Array.isArray(destinations) && destinations.length > 0) {
                // Create destination list item
                const destinationListItem: DestinationListItem = {
                  type: "destination_list",
                  id: item.id,
                  destinations: destinations,
                };
                
                chatMessages.push(destinationListItem);
                setChatMessages([...chatMessages]);
                console.log("✅ Added DestinationListItem to chatMessages with", destinations.length, "destinations");
              } else {
                console.log("No valid destinations found in output");
              }
              break;
            }
            
            case "get_social_media_feed": {
              let posts = [];
              if (item.output) {
                // Try to parse social media feed data from different possible formats
                if (typeof item.output === 'string') {
                  try {
                    posts = JSON.parse(item.output);
                  } catch (e) {
                    console.error("Failed to parse social media feed data from string:", e);
                  }
                } else if (item.output && typeof item.output === 'object') {
                  // Check if output has content array (MCP format)
                  if (Array.isArray(item.output.content)) {
                    // Try to parse the text content
                    const textContent = item.output.content.find((c: any) => c.type === 'text');
                    if (textContent && textContent.text) {
                      try {
                        posts = JSON.parse(textContent.text);
                      } catch (e) {
                        console.error("Failed to parse social media feed data from MCP content:", e);
                      }
                    }
                  } else if (Array.isArray(item.output)) {
                    // Direct array of posts
                    posts = item.output;
                  }
                }
              }
              
              if (Array.isArray(posts) && posts.length > 0) {
                // Create social media feed item
                const socialMediaFeedItem: SocialMediaFeedItem = {
                  type: "social_media_feed",
                  id: item.id,
                  posts: posts,
                };
                
                chatMessages.push(socialMediaFeedItem);
          setChatMessages([...chatMessages]);
                console.log("✅ Added SocialMediaFeedItem to chatMessages with", posts.length, "posts");
              } else {
                console.log("No valid social media posts found in output");
              }
              break;
            }
            
            case "show_hotel_rooms_at_hotel": {
              let rooms = [];
              if (item.output) {
                // Try to parse rooms data from different possible formats
                if (typeof item.output === 'string') {
                  try {
                    rooms = JSON.parse(item.output);
                  } catch (e) {
                    console.error("Failed to parse hotel rooms data from string:", e);
                  }
                } else if (item.output && typeof item.output === 'object') {
                  // Check if output has content array (MCP format)
                  if (Array.isArray(item.output.content)) {
                    // Try to parse the text content
                    const textContent = item.output.content.find((c: any) => c.type === 'text');
                    if (textContent && textContent.text) {
                      try {
                        rooms = JSON.parse(textContent.text);
                      } catch (e) {
                        console.error("Failed to parse hotel rooms data from MCP content:", e);
                      }
                    }
                  } else if (Array.isArray(item.output)) {
                    // Direct array of rooms
                    rooms = item.output;
                  }
                }
              }
              
              if (Array.isArray(rooms) && rooms.length > 0) {
                // Debug: Log the first room structure to understand the data format
                console.log("🔧 Room data structure:", rooms[0]);
                console.log("🔧 Room image type:", typeof rooms[0]?.image);
                console.log("🔧 Room image value:", rooms[0]?.image);
                
                // Create hotel rooms item
                const hotelRoomsItem: HotelRoomsItem = {
                  type: "hotel_rooms",
                  id: item.id,
                  rooms: rooms,
                };
                
                chatMessages.push(hotelRoomsItem);
                setChatMessages([...chatMessages]);
                console.log("✅ Added HotelRoomsItem to chatMessages with", rooms.length, "rooms");
              } else {
                console.log("No valid hotel rooms found in output");
              }
              break;
            }
            
            default:
              console.warn(`⚠️ Unhandled MCP tool: ${item.name}`);
              break;
          }
        }
        
        // Add the item to llmApiMessages for API format
        // llmApiMessages.push(item); // This line was removed as per the new_code, as llmApiMessages is not defined in this file.
        // setLlmApiMessages([...llmApiMessages]); // This line was removed as per the new_code, as llmApiMessages is not defined in this file.
        conversationItems.push(item);
        setConversationItems([...conversationItems]);
        if (
          item &&
          item.type === "tool_call" &&
          item.tool_type === "function_call"
        ) {
          // Handle tool call (execute function)
          const toolResult = await handleTool(
            item.name as keyof typeof functionsMap,
            item.parsedArguments
          );

          // Record tool output
          item.output = JSON.stringify(toolResult);
          setChatMessages([...chatMessages]);
          conversationItems.push({
            type: "function_call_output",
            call_id: item.call_id,
            status: "completed",
            output: JSON.stringify(toolResult),
          });
          setConversationItems([...conversationItems]);

          // Create another turn after tool output has been added
          await processMessages();
        }
        if (
          item &&
          item.type === "tool_call" &&
          item.tool_type === "mcp_call"
        ) {
          item.output = item.output;
          item.status = "completed";
          setChatMessages([...chatMessages]);
        }
        break;
      }

      case "response.function_call_arguments.delta": {
        // Streaming arguments delta to show in the chat
        functionArguments += data.delta || "";
        let parsedFunctionArguments = {};

        const toolCallMessage = chatMessages.find((m) => m.id === data.item_id);
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.arguments = functionArguments;
          try {
            if (functionArguments.length > 0) {
              parsedFunctionArguments = parse(functionArguments);
            }
            toolCallMessage.parsedArguments = parsedFunctionArguments;
          } catch {
            // partial JSON can fail parse; ignore
          }
          setChatMessages([...chatMessages]);
        }
        break;
      }

      case "response.function_call_arguments.done": {
        // This has the full final arguments string
        const { item_id, arguments: finalArgs } = data;

        functionArguments = finalArgs;

        // Mark the tool_call as "completed" and parse the final JSON
        const toolCallMessage = chatMessages.find((m) => m.id === item_id);
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.arguments = finalArgs;
          toolCallMessage.parsedArguments = parse(finalArgs);
          toolCallMessage.status = "completed";
          setChatMessages([...chatMessages]);
        }
        break;
      }
      // Streaming MCP tool call arguments
      case "response.mcp_call_arguments.delta": {
        // Append delta to MCP arguments
        mcpArguments += data.delta || "";
        let parsedMcpArguments: any = {};
        const toolCallMessage = chatMessages.find((m) => m.id === data.item_id);
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.arguments = mcpArguments;
          try {
            if (mcpArguments.length > 0) {
              parsedMcpArguments = parse(mcpArguments);
            }
            toolCallMessage.parsedArguments = parsedMcpArguments;
          } catch {
            // partial JSON can fail parse; ignore
          }
          setChatMessages([...chatMessages]);
        }
        break;
      }
      case "response.mcp_call_arguments.done": {
        // Final MCP arguments string received
        const { item_id, arguments: finalArgs } = data;
        mcpArguments = finalArgs;
        const toolCallMessage = chatMessages.find((m) => m.id === item_id);
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.arguments = finalArgs;
          toolCallMessage.parsedArguments = parse(finalArgs);
          toolCallMessage.status = "completed";
          setChatMessages([...chatMessages]);
        }
        break;
      }

      case "response.web_search_call.completed": {
        const { item_id, output } = data;
        const toolCallMessage = chatMessages.find((m) => m.id === item_id);
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.output = output;
          toolCallMessage.status = "completed";
          setChatMessages([...chatMessages]);
        }
        break;
      }

      case "response.file_search_call.completed": {
        const { item_id, output } = data;
        const toolCallMessage = chatMessages.find((m) => m.id === item_id);
        if (toolCallMessage && toolCallMessage.type === "tool_call") {
          toolCallMessage.output = output;
          toolCallMessage.status = "completed";
          setChatMessages([...chatMessages]);
        }
        break;
      }

      case "response.code_interpreter_call_code.delta": {
        const { delta, item_id } = data;
        const toolCallMessage = [...chatMessages]
          .reverse()
          .find(
            (m) =>
              m.type === "tool_call" &&
              m.tool_type === "code_interpreter_call" &&
              m.status !== "completed" &&
              m.id === item_id
          ) as ToolCallItem | undefined;
        // Accumulate deltas to show the code streaming
        if (toolCallMessage) {
          toolCallMessage.code = (toolCallMessage.code || "") + delta;
          setChatMessages([...chatMessages]);
        }
        break;
      }

      case "response.code_interpreter_call_code.done": {
        const { code, item_id } = data;
        const toolCallMessage = [...chatMessages]
          .reverse()
          .find(
            (m) =>
              m.type === "tool_call" &&
              m.tool_type === "code_interpreter_call" &&
              m.status !== "completed" &&
              m.id === item_id
          ) as ToolCallItem | undefined;

        // Mark the call as completed and set the code
        if (toolCallMessage) {
          toolCallMessage.code = code;
          toolCallMessage.status = "completed";
          setChatMessages([...chatMessages]);
        }
        break;
      }

      case "response.code_interpreter_call.completed": {
        const { item_id } = data;
        const toolCallMessage = chatMessages.find(
          (m) => m.type === "tool_call" && m.id === item_id
        ) as ToolCallItem | undefined;
        if (toolCallMessage) {
          toolCallMessage.status = "completed";
          setChatMessages([...chatMessages]);
        }
        break;
      }

      case "response.completed": {
        console.log("response completed", data);
        const { response } = data;

        // Handle MCP tools list
        const mcpListToolsMessage = response.output.find(
          (m: Item) => m.type === "mcp_list_tools"
        );

        if (mcpListToolsMessage) {
          chatMessages.push({
            type: "mcp_list_tools",
            id: mcpListToolsMessage.id,
            server_label: mcpListToolsMessage.server_label,
            tools: mcpListToolsMessage.tools || [],
          });
          setChatMessages([...chatMessages]);
        }

        // Handle MCP approval request
        const mcpApprovalRequestMessage = response.output.find(
          (m: Item) => m.type === "mcp_approval_request"
        );

        if (mcpApprovalRequestMessage) {
          chatMessages.push({
            type: "mcp_approval_request",
            id: mcpApprovalRequestMessage.id,
            server_label: mcpApprovalRequestMessage.server_label,
            name: mcpApprovalRequestMessage.name,
            arguments: mcpApprovalRequestMessage.arguments,
          });
          setChatMessages([...chatMessages]);
        }

        // MCP tool outputs are now handled in response.output_item.done
        break;
      }

      // Handle other events as needed
    }
  });
};
