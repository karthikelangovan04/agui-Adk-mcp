import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export const POST = async (req: NextRequest, { params }: { params: Promise<{ integrationId: string }> }) => {
  const { integrationId } = await params;
  const requestBody = await req.json();

  // Handle CopilotKit's agent/connect method wrapper
  let body = requestBody;
  
  // If the body has a "body" field, extract it (CopilotKit nests the actual body)
  if (requestBody.body && typeof requestBody.body === 'object') {
    body = requestBody.body;
  }

  // Ensure required fields are present for ag-ui-adk
  const messages = body.messages || [];
  const toolResults = body.toolResults || [];
  
  // If there are no messages and no tool results, return an immediate finish event
  // This prevents the "Both invocation_id and new_message are None" error
  if (messages.length === 0 && toolResults.length === 0) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("event: finish\n"));
        controller.enqueue(encoder.encode("data: {}\n\n"));
        controller.close();
      }
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

  const proxiedBody = {
    threadId: body.threadId || `thread-${integrationId || 'default'}-${Date.now()}`,
    runId: body.runId || `run-${Date.now()}`,
    state: body.state || {},
    messages: messages,
    tools: body.tools || [],
    context: body.context || [],
    forwardedProps: body.forwardedProps || {},
    ...body
  };

  // Proxy the request to the Python backend
  try {
    const response = await fetch(`${BACKEND_URL}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(proxiedBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Backend error status:", response.status);
      console.error("Backend error data:", errorData);
      return new NextResponse(errorData, { 
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Stream the response back to the client
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("text/event-stream")) {
      return new NextResponse(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch failed:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const GET = async (req: NextRequest, { params }: { params: Promise<{ integrationId: string }> }) => {
  const { integrationId } = await params;
  
  try {
    const response = await fetch(`${BACKEND_URL}/info`);
    
    if (!response.ok) {
      // Return a fallback response
      return NextResponse.json({
        agents: [
          {
            id: "default",
            name: "default",
            description: "Weather assistant with MCP tools and human-in-the-loop approval",
          },
        ],
        actions: [],
      });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch info failed:", error);
    return NextResponse.json({
      agents: [
        {
          id: "default",
          name: "default",
          description: "Weather assistant with MCP tools and human-in-the-loop approval",
        },
      ],
      actions: [],
    });
  }
};
