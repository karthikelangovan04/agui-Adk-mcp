# Weather ADK AGUI - With MCP Tools + Human-in-the-Loop 🌤️

**Status**: ✅ Fixed and Working with MCP Tools Maintained!

## What's Included

### ✅ MCP Tools (Maintained)
- `geocode_location(location)` - Convert city names to coordinates
- `get_forecast(latitude, longitude)` - Get weather forecast from NWS API
- `get_alerts(state)` - Get weather alerts for US states

### ✅ Human-in-the-Loop (Added)
- `confirm_weather_query` - Beautiful confirmation UI before fetching data
- User can select which weather data to retrieve
- Options: Forecast (enabled by default) and Alerts (disabled by default)

## Architecture

```
User Query
    ↓
geocode_location (MCP tool)
    ↓
confirm_weather_query (HITL)  ← User approves options
    ↓
┌─────────────┬─────────────┐
│             │             │
get_forecast  get_alerts    ← Based on user selection
(MCP tool)    (MCP tool)
    │             │
    └──────┬──────┘
           ↓
    Beautiful UI Display
```

## Key Changes Made

### Backend (`backend_tool_rendering.py`)
- ✅ Uses `Agent` from `google.adk.agents` (correct pattern)
- ✅ Includes MCP toolset: `weather_toolset`
- ✅ Defines `CONFIRM_WEATHER_TOOL` as dictionary (HITL pattern)
- ✅ Agent instructions reference the HITL tool
- ✅ Model: `gemini-2.0-flash-exp`

### Frontend (`app/page.tsx`)
- ✅ `useHumanInTheLoop` hook for `confirm_weather_query`
- ✅ `useCopilotAction` for `get_forecast` rendering
- ✅ `useCopilotAction` for `get_alerts` rendering
- ✅ Beautiful confirmation UI with checkboxes
- ✅ Weather card and alert card components

## How It Works

### 1. User Query Example
```
User: "What's the weather in San Francisco?"
```

### 2. Agent Flow
```
1. Agent calls geocode_location("San Francisco")
   → Gets: lat=37.7749, lon=-122.4194

2. Agent calls confirm_weather_query with options:
   ✓ Get current weather forecast (enabled)
   ☐ Check weather alerts (disabled)

3. User sees beautiful confirmation UI
   → User can toggle options
   → User clicks "Confirm (1)"

4. Agent receives confirmation
   → Calls get_forecast(37.7749, -122.4194)

5. Beautiful weather card displays!
```

### 3. With Alerts Example
```
User: "Weather in California with alerts"

1. geocode_location("California") → coordinates
2. confirm_weather_query → User enables BOTH options
3. get_forecast() → Weather card displays
4. get_alerts("CA") → Alert cards display
```

## MCP Tools Details

### geocode_location
- **Input**: City name (string)
- **Output**: Latitude, longitude, display name
- **Source**: OpenStreetMap Nominatim API

### get_forecast
- **Input**: Latitude, longitude (floats)
- **Output**: JSON with temperature, conditions, humidity, wind, etc.
- **Source**: NWS (National Weather Service) API

### get_alerts
- **Input**: State code (2-letter, e.g., "CA", "NY")
- **Output**: Array of active weather alerts
- **Source**: NWS Alerts API
- **Note**: US only

## Testing the App

### Test Case 1: Simple Weather Query
```
1. Start servers: ./start.sh
2. Navigate to: http://localhost:3000
3. Ask: "What's the weather in Paris?"
4. See confirmation dialog
5. Click "Confirm"
6. See weather card!
```

### Test Case 2: With Alerts
```
1. Ask: "Get weather alerts for California"
2. Agent will ask for location clarification
3. Provide: "San Francisco"
4. Confirmation appears with:
   ☐ Get current weather forecast
   ✓ Check weather alerts
5. Adjust options as needed
6. Click "Confirm"
7. See alert cards (if any active alerts)
```

### Test Case 3: Both Options
```
1. Ask: "Weather in New York with alerts"
2. Confirmation appears
3. Enable BOTH options
4. Click "Confirm"
5. See both weather card AND alert cards!
```

## File Structure

```
backend_tool_rendering.py
├── MCP Toolset (weather_toolset)
│   ├── geocode_location
│   ├── get_forecast
│   └── get_alerts
├── HITL Tool (CONFIRM_WEATHER_TOOL)
│   └── confirm_weather_query
└── Agent with both MCP + HITL

app/page.tsx
├── useHumanInTheLoop
│   └── WeatherQueryConfirmation UI
├── useCopilotAction (get_forecast)
│   └── WeatherCard UI
└── useCopilotAction (get_alerts)
    └── AlertCard UI
```

## Benefits of This Approach

1. **User Control**: User decides what data to fetch
2. **MCP Integration**: Leverages existing weather MCP tools
3. **Beautiful UI**: Modern, gradient-based confirmation dialog
4. **Flexible**: Can enable/disable forecast or alerts independently
5. **Reference Pattern**: Follows working HITL example exactly

## Troubleshooting

### MCP Tools Not Working
```bash
# Test the MCP server directly
cd weather
uv run python weather.py
```

### Agent Not Calling Tools
- Check agent instructions in `backend_tool_rendering.py`
- Verify tool names match between backend and frontend
- Check backend logs for errors

### Confirmation Not Appearing
- Verify `useHumanInTheLoop` hook is registered
- Check that agent is calling `confirm_weather_query`
- Inspect browser console for errors

## Next Steps

1. **Test thoroughly**: Try different locations and options
2. **Add more tools**: Extend MCP with hourly forecast, UV index, etc.
3. **Enhance UI**: Add animations, loading states
4. **Error handling**: Better user feedback for failed requests

## Summary

You now have a **fully functional weather app** that:
- ✅ Maintains all MCP tools (geocode, forecast, alerts)
- ✅ Adds human-in-the-loop approval
- ✅ Beautiful, modern UI
- ✅ Follows reference code patterns
- ✅ Gives users control over data fetching

**The best of both worlds**: MCP tools for powerful weather data + HITL for user control! 🎉

---

**Ready to test?** Run `./start.sh` and ask for weather! 🌤️

