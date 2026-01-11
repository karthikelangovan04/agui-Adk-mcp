import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  const { integrationId } = await params;

  try {
    const response = await fetch(`${BACKEND_URL}/info`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn("Backend /info endpoint not available, returning fallback");
      // Return fallback agent info
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
    
    // Ensure the response has the correct format for CopilotKit
    const formattedData = {
      agents: Array.isArray(data.agents) ? data.agents : [
        {
          id: "default",
          name: "default",
          description: "Weather assistant with MCP tools and human-in-the-loop approval",
        },
      ],
      actions: data.actions || [],
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Failed to fetch agent info:", error);
    // Return fallback agent info
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
}
