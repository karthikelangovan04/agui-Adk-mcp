from google.adk.agents import LlmAgent
from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams
from mcp import StdioServerParameters
import os
from dotenv import load_dotenv

# Load environment variables from .env.local
# Try loading from project root first
env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    # Fallback to current directory
    load_dotenv()

# Get the absolute path to the weather.py script
weather_script_path = os.path.join(os.path.dirname(__file__), "weather.py")

# Weather MCP toolset
# Use uv run to execute the weather server without needing to activate venv
weather_toolset = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command="uv",
            args=["run", "python", weather_script_path]
        )
    )
)

# Create the agent with weather toolset
# The GEMINI_API_KEY will be automatically used from environment
agent = LlmAgent(
    model="gemini-2.0-flash",
    name="weather_agent",
    tools=[weather_toolset],
    # API key is read from GEMINI_API_KEY environment variable
    system_instruction="""You are a helpful weather assistant. When users ask about weather for a location:

1. If they provide a location NAME (like "San Francisco", "New York", "Paris"), first use the geocode_location tool to get the latitude and longitude.
2. Once you have coordinates (either from geocoding or directly from the user), use the get_forecast tool with those coordinates.
3. If users ask for weather alerts, use the get_alerts tool with the state code.

Always use the geocode_location tool when users mention a place name without coordinates. Be conversational and friendly in your responses."""
)

# Export for use in API routes
__all__ = ["agent"]

