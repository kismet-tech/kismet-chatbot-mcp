import { MODEL } from "@/config/constants";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { messages, tools } = await request.json();
    console.log("🔧 API: Received messages:", messages);
    console.log("🔧 API: Received tools:", tools);
    console.log("🔧 API: Tools count:", tools?.length || 0);
    console.log("🔧 API: Raw request body:", JSON.stringify({ messages, tools }, null, 2));

    const openai = new OpenAI();

    console.log("🔧 API: Sending to OpenAI:", { model: MODEL, input: messages, toolsCount: tools?.length || 0 });

    const events = await openai.responses.create({
      model: MODEL,
      input: messages,
      tools,
      stream: true,
      parallel_tool_calls: false,
    });

    // Create a ReadableStream that emits SSE data
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events) {
            // Log all events for debugging
            console.log("🔧 API: Event:", event.type, JSON.stringify(event, null, 2));
            
            // Sending all events to the client
            const data = JSON.stringify({
              event: event.type,
              data: event,
            });
            controller.enqueue(`data: ${data}\n\n`);
          }
          // End of stream
          controller.close();
        } catch (error) {
          console.error("🔧 API: Error in streaming loop:", error);
          controller.error(error);
        }
      },
    });

    // Return the ReadableStream as SSE
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("🔧 API: Error in POST handler:", error);
    console.error("🔧 API: Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : "Unknown"
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
