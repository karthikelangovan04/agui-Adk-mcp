import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET() {
  // Health check endpoint
  return NextResponse.json({ 
    status: "ok", 
    backend: BACKEND_URL,
    message: "CopilotKit proxy is running. Use POST to send messages."
  });
}

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();

    // Handle CopilotKit v1.50 method-based requests (single-route transport)
    if (requestBody.method === "info") {
      // Return agent info for CopilotKit v1.50 agent discovery
      return NextResponse.json({
        version: "1.0.0",
        agents: {
          default: {
            id: "default",
            name: "default",
            description: "Weather assistant with MCP tools and human-in-the-loop approval",
          },
        },
      });
    }

    // Handle CopilotKit's agent/connect method wrapper
    let body = requestBody;

    // If the body has a "body" field, extract it (CopilotKit nests the actual body)
    if (requestBody.body && typeof requestBody.body === 'object') {
      body = requestBody.body;
    }

    // Generate IDs if not present
    const threadId = body.threadId || `thread-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const runId = body.runId || `run-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Ensure required fields are present for ag-ui
    const messages = body.messages || [];
    const toolResults = body.toolResults || [];

    // Transform messages to ag-ui format
    // ag-ui expects: { id: "msg-123", role: "user", content: "..." }
    // For tool messages, also include toolCallId
    const transformedMessages = messages.map((msg: any, index: number) => {
      const baseMsg: any = {
        id: msg.id || `msg-${Date.now()}-${index}`,
        role: msg.role,
        content: msg.content,
        name: msg.name
      };
      
      // If this is a tool message, include toolCallId (required by ADK)
      if (msg.role === 'tool' && msg.toolCallId) {
        baseMsg.toolCallId = msg.toolCallId;
      }
      
      // If this is an assistant message with tool calls, include them
      if (msg.role === 'assistant' && msg.toolCalls) {
        baseMsg.toolCalls = msg.toolCalls;
      }
      
      return baseMsg;
    });

    // If there are no messages and no tool results, return an immediate finish event
    if (transformedMessages.length === 0 && toolResults.length === 0) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Send RUN_STARTED first
          controller.enqueue(encoder.encode("event: message\n"));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "RUN_STARTED", threadId, runId })}\n\n`));
          // Then send RUN_FINISHED
          controller.enqueue(encoder.encode("event: message\n"));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "RUN_FINISHED", threadId, runId })}\n\n`));
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
      thread_id: threadId,
      run_id: runId,
      state: body.state || {},
      messages: transformedMessages,
      tools: body.tools || [],
      context: body.context || [],
      forwarded_props: body.forwardedProps || {}
    };
    
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(proxiedBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", response.status, errorText);
      return new NextResponse(errorText, { 
        status: response.status,
        headers: { "Content-Type": "text/plain" }
      });
    }

    // Transform the SSE stream to add "event: message" prefix for each data line
    // Also parse and unwrap the tool result content from ADK format
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    let buffer = '';  // Buffer for incomplete lines
    
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        // Add chunk to buffer
        buffer += decoder.decode(chunk, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data:')) {
            let dataLine = line;
            
            // Try to parse and transform TOOL_CALL_RESULT events
            try {
              const jsonData = JSON.parse(line.substring(5).trim());
              
              // If this is a TOOL_CALL_RESULT, unwrap the content
              if (jsonData.type === 'TOOL_CALL_RESULT' && jsonData.content) {
                // Parse the content field (it's a JSON string from ADK)
                const contentObj = JSON.parse(jsonData.content);
                
                // Extract the actual result from structuredContent.result
                if (contentObj.structuredContent && contentObj.structuredContent.result) {
                  // Parse the nested JSON string to get the actual object
                  const actualResult = JSON.parse(contentObj.structuredContent.result);
                  
                  // Keep content as a string (CopilotKit requires it for validation)
                  // but set it to the stringified result for compatibility
                  jsonData.content = JSON.stringify(actualResult);
                  
                  // Also provide result field for components that use it
                  jsonData.result = actualResult;
                  
                  // Re-serialize to JSON
                  dataLine = 'data: ' + JSON.stringify(jsonData);
                }
              }
            } catch (e) {
              // If parsing fails, just pass through the original line
              // This is fine - not all data lines are JSON or need transformation
            }
            
            // Add "event: message" before each data line
            controller.enqueue(encoder.encode('event: message\n'));
            controller.enqueue(encoder.encode(dataLine + '\n'));
          } else if (line.trim() && !line.startsWith('event:')) {
            // Pass through other non-empty lines that aren't already event lines
            controller.enqueue(encoder.encode(line + '\n'));
          } else if (line.startsWith('event:')) {
            // If event line already exists, pass it through
            controller.enqueue(encoder.encode(line + '\n'));
          } else if (line === '') {
            // Empty line (separator between events)
            controller.enqueue(encoder.encode('\n'));
          }
        }
      },
      flush(controller) {
        // Process any remaining data in buffer
        if (buffer.trim()) {
          if (buffer.startsWith('data:')) {
            controller.enqueue(encoder.encode('event: message\n'));
            controller.enqueue(encoder.encode(buffer + '\n'));
          } else if (buffer.startsWith('event:')) {
            controller.enqueue(encoder.encode(buffer + '\n'));
          }
        }
      }
    });

    const transformedStream = response.body?.pipeThrough(transformStream);

    return new NextResponse(transformedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse(JSON.stringify({ error: "Proxy failed" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
