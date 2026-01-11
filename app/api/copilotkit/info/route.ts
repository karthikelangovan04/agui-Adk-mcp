import { NextResponse } from "next/server";

export async function GET() {
  // This endpoint is called by CopilotKit v1.50 to discover agents
  // It must return agent metadata in the expected format
  return NextResponse.json({
    version: "1.0.0", // Add version field required by v1.50
    agents: {
      default: {
        id: "default",
        name: "default",
        description: "Weather assistant with MCP tools and human-in-the-loop approval",
      },
    },
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}
