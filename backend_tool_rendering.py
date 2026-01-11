"""Weather Assistant with MCP Tools and HITL."""
from __future__ import annotations

from fastapi import FastAPI
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint
from google.adk.agents import Agent
from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams
from mcp import StdioServerParameters
import os
from dotenv import load_dotenv

# Load environment variables from .env.local file
load_dotenv(".env.local")

# Load Gemini API key and set it as GOOGLE_API_KEY for the SDK
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable is required. Please set it in your .env.local file.")

# Set it as GOOGLE_API_KEY which is what the Google SDK expects
os.environ["GOOGLE_API_KEY"] = gemini_api_key

# Get the absolute path to the weather directory
weather_dir = os.path.join(os.path.dirname(__file__), "weather")
weather_script = os.path.join(weather_dir, "weather.py")

# Setup MCP weather toolset
weather_toolset = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command="uv",
            args=["run", "python", weather_script],
            env={"UV_NO_CACHE": "1"}
        )
    )
)

# Human-in-the-loop confirmation tool
CONFIRM_WEATHER_TOOL = {
    "type": "function",
    "function": {
        "name": "confirm_weather_query",
        "description": "Request human confirmation before fetching weather data with selected options",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The location name the user asked about"
                },
                "latitude": {
                    "type": "number",
                    "description": "The latitude coordinate from geocoding"
                },
                "longitude": {
                    "type": "number",
                    "description": "The longitude coordinate from geocoding"
                },
                "options": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "description": {
                                "type": "string",
                                "description": "Human-readable description of this option"
                            },
                            "status": {
                                "type": "string",
                                "enum": ["enabled", "disabled"],
                                "description": "Whether this option should be enabled by default"
                            },
                            "action": {
                                "type": "string",
                                "enum": ["forecast", "alerts"],
                                "description": "The action this option represents"
                            }
                        },
                        "required": ["description", "status", "action"]
                    },
                    "description": "Available weather information options for user to select"
                }
            },
            "required": ["location", "options"]
        }
    }
}

# Create the weather agent with clear instructions
weather_agent = Agent(
    model='gemini-2.0-flash',
    name='default',
    instruction="""
You are a helpful weather assistant with MCP tools and human-in-the-loop approval.

**Available MCP Tools:**
1. geocode_location(location: str) - Converts location names to coordinates
   Returns: {"latitude": float, "longitude": float, "display_name": str}

2. get_forecast(latitude: float, longitude: float) - Gets detailed weather forecast
   Returns: {
     "temperature": float (Celsius),
     "temperature_f": float (Fahrenheit),
     "conditions": "clear" | "rain" | "cloudy" | "snow" | "storm",
     "windSpeed": int,
     "windSpeedText": str,
     "location": str,
     "periods": [array of forecast periods]
   }

3. get_alerts(state: str) - Gets weather alerts for a US state (2-letter code like "CA", "NY")
   Returns: {"alerts": [array of alert objects], "count": int}

**Workflow for weather requests:**

1. When user asks about weather for a location:
   a. Call geocode_location(location) to get coordinates
   b. Extract the state from location if asking for alerts
   c. Call confirm_weather_query with:
      - location: the display_name from geocoding
      - latitude & longitude: from geocoding result
      - options: Array with both forecast and alerts options:
        [
          {"description": "Get current forecast", "status": "enabled", "action": "forecast"},
          {"description": "Check weather alerts", "status": "enabled", "action": "alerts"}
        ]
   d. Wait for user confirmation with selected options
   e. Based on what user selected:
      - If "forecast" selected: call get_forecast(lat, lon)
      - If "alerts" selected: call get_alerts(state_code)
   f. Present results naturally

2. When presenting forecast results, mention:
   - Temperature in both Celsius and Fahrenheit
   - Weather conditions
   - Wind speed and direction
   - Location name

3. When presenting alerts, summarize:
   - Number of active alerts
   - Most severe alerts first
   - Brief description of each

**Example:**
User: "What's the weather in San Francisco?"
You: 
1. geocode_location("San Francisco") -> {lat: 37.78, lon: -122.40, display_name: "San Francisco, California"}
2. confirm_weather_query with forecast + alerts options
3. [Wait for user selection]
4. If forecast selected: get_forecast(37.78, -122.40)
5. If alerts selected: get_alerts("CA")
6. Present: "In San Francisco, it's currently 13°C (55°F) and clear. Wind is 9 mph from the northeast."
    """,
    tools=[weather_toolset],
)

# Create ADK middleware agent instance
weather_adk_agent = ADKAgent(
    adk_agent=weather_agent,
    app_name="weather_app",
    user_id="default_user",  # Default user ID, can be overridden per request
    session_timeout_seconds=3600,
    use_in_memory_services=True,
)

# Create FastAPI app
app = FastAPI(title="Weather ADK Agent with MCP Tools and HITL")

# Add the ADK endpoint - this registers the agent
add_adk_fastapi_endpoint(
    app, 
    weather_adk_agent, 
    path="/",
    extract_headers=["x-user-id"]  # Extract user ID from headers if provided
)

# Health check
@app.get("/health")
async def health():
    return {"status": "healthy"}

# Info endpoint for agent discovery
@app.get("/info")
async def info():
    return {
        "version": "1.0.0",
        "agents": {
            "default": {
                "id": "default",
                "name": "default",
                "description": "Weather assistant with MCP tools and human-in-the-loop approval",
            }
        },
    }
