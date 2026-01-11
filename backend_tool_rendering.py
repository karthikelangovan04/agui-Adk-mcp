"""Weather Assistant with MCP Tools and HITL."""
from __future__ import annotations

from fastapi import FastAPI
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint
from google.adk.agents import Agent
from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams
from mcp import StdioServerParameters
import os
from dotenv import load_dotenv
import json

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

# Human-in-the-loop confirmation tool schema (for agent instructions reference)
# NOTE: This must be defined BEFORE the agent so it can be referenced in the f-string
# NOTE: This is NOT added to the agent's tools - it's intercepted by the frontend
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
                "display_name": {
                    "type": "string",
                    "description": "Full display name from geocoding"
                },
                "state_code": {
                    "type": "string",
                    "description": "US state code for alerts (e.g., 'CA', 'NY')"
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
                                "enum": ["enabled"],
                                "description": "The status of the option, always 'enabled'"
                            },
                            "action": {
                                "type": "string",
                                "enum": ["forecast", "alerts"],
                                "description": "The action this option represents"
                            }
                        },
                        "required": ["description", "status", "action"]
                    },
                    "description": "Array of 2 weather options (forecast and alerts), both enabled by default"
                }
            },
            "required": ["location", "latitude", "longitude", "display_name", "state_code", "options"]
        }
    }
}

# Create the weather agent with clear instructions
weather_agent = Agent(
    model='gemini-2.0-flash',
    name='default',
    instruction=f"""
You are a helpful weather assistant with MCP tools and human-in-the-loop approval.

**Available MCP Tools:**
1. geocode_location(location: str) - Converts location names to coordinates
   Returns: {{"latitude": float, "longitude": float, "display_name": str}}

2. get_forecast(latitude: float, longitude: float) - Gets detailed weather forecast
   Returns: {{
     "temperature": float (Celsius),
     "temperature_f": float (Fahrenheit),
     "conditions": "clear" | "rain" | "cloudy" | "snow" | "storm",
     "windSpeed": int,
     "windSpeedText": str,
     "location": str,
     "periods": [array of forecast periods]
   }}

3. get_alerts(state: str) - Gets weather alerts for a US state (2-letter code like "CA", "NY")
   Returns: {{"alerts": [array of alert objects], "count": int}}

**Workflow for weather requests:**

1. When user asks about weather for a location:
   a. Call geocode_location(location) to get coordinates
   b. Parse the display_name to extract state code (last 2 letters if US location)
   c. Call confirm_weather_query with the location info and both options enabled
   d. The user will see a UI with checkboxes to select which information they want
   e. After user confirms, you'll receive their selected actions
   f. Based on the user's selection:
      - If "forecast" selected: call get_forecast(lat, lon) and describe the weather
      - If "alerts" selected: call get_alerts(state_code) and summarize alerts
      - If both selected: call both tools and present both results
   g. Present results naturally in your response

2. When presenting forecast results, mention:
   - Temperature in both Celsius and Fahrenheit
   - Weather conditions
   - Wind speed and direction
   - Location name

3. When presenting alerts, summarize:
   - Number of active alerts
   - Most severe alerts first
   - Brief description of each

**Example conversation:**
User: "What's the weather in San Francisco?"

Step 1: Call geocode_location("San Francisco")
Result: {{"latitude": 37.7749, "longitude": -122.4194, "display_name": "San Francisco, California, United States"}}

Step 2: Extract state code "CA" from display_name

Step 3: Call confirm_weather_query(
    location="San Francisco",
    latitude=37.7749,
    longitude=-122.4194,
    display_name="San Francisco, California, United States",
    state_code="CA",
    options=[
        {{"description": "Get current forecast", "status": "enabled", "action": "forecast"}},
        {{"description": "Check weather alerts", "status": "enabled", "action": "alerts"}}
    ]
)

Step 4: [User sees UI with checkboxes and confirms their selection]

Step 5: Parse the response and call selected tools:
- If forecast selected: get_forecast(37.7749, -122.4194)
- If alerts selected: get_alerts("CA")

Step 6: Present the results naturally

**Important Notes:**
- ALWAYS call confirm_weather_query after geocoding and BEFORE calling get_forecast or get_alerts
- Extract state code from display_name (usually last part before country)
- The confirm_weather_query tool will show a UI to the user with checkboxes
- Only call the MCP tools (get_forecast, get_alerts) that the user selected in their response
- The tools (get_forecast, get_alerts) will render UI cards automatically on the frontend

Tool reference: {CONFIRM_WEATHER_TOOL}
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
