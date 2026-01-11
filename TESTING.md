# Testing Guide for Weather ADK AGUI

## Prerequisites

1. ✅ Python virtual environment set up with dependencies
2. ✅ Node.js dependencies installed
3. ✅ `.env.local` file with `GEMINI_API_KEY` configured
4. ✅ Next.js development server running

## Starting the Application

### Step 1: Start the Next.js Development Server

The server should already be running. If not, run:

```bash
cd /Users/karthike/Desktop/Vibe\ Coding/Weather-ADK-AGUI
npm run dev
```

The server will start on `http://localhost:3000`

### Step 2: Verify Server is Running

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the CopilotKit chat interface.

## Testing Steps

### Test 1: Weather Forecast Query

1. **Open the chat interface** at `http://localhost:3000`
2. **Type or click a suggestion**: 
   - "What's the weather forecast for San Francisco? (37.7749, -122.4194)"
   - Or manually type: "Get weather forecast for latitude 37.7749 and longitude -122.4194"

3. **Expected Result**:
   - A loading indicator appears: "⚙️ Retrieving weather forecast..."
   - A weather card displays showing:
     - Location coordinates
     - Current temperature (in Fahrenheit and Celsius)
     - Weather conditions (clear, cloudy, rain, etc.)
     - Wind speed
     - Extended forecast for upcoming periods

### Test 2: Weather Alerts Query

1. **In the chat interface**, type:
   - "Get weather alerts for California" or "Get weather alerts for CA"
   - Or click suggestion: "Weather alerts in California"

2. **Expected Result**:
   - A loading indicator appears: "⚙️ Retrieving weather alerts..."
   - Alert cards display showing:
     - Event type (if any active alerts)
     - Area affected
     - Severity level (color-coded)
     - Description
     - Instructions

### Test 3: Natural Language Queries

Try these natural language queries:

1. **"What's the weather like in New York?"**
   - The system should extract coordinates (40.7128, -74.0060) and fetch forecast

2. **"Tell me about weather alerts in Texas"**
   - Should fetch alerts for TX state

3. **"Show me the forecast for coordinates 34.0522, -118.2437"**
   - Should fetch forecast for Los Angeles

### Test 4: Error Handling

Test error scenarios:

1. **Invalid coordinates**: "Get weather for latitude 999, longitude 999"
   - Should show an error message

2. **Invalid state code**: "Get alerts for state XYZ"
   - Should show an error or "No active alerts" message

## API Endpoint Testing (Optional)

You can also test the API endpoints directly:

### Test Forecast API

```bash
curl -X POST http://localhost:3000/api/weather/forecast \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7749, "longitude": -122.4194}'
```

### Test Alerts API

```bash
curl -X POST http://localhost:3000/api/weather/alerts \
  -H "Content-Type: application/json" \
  -d '{"state": "CA"}'
```

## Troubleshooting

### Issue: "Unable to fetch forecast"
- **Check**: Ensure `uv` is installed and in PATH
- **Check**: Python dependencies are installed (`uv run python -c "import httpx; print('OK')"`)
- **Check**: Network connectivity to NWS API

### Issue: Server not starting
- **Check**: Port 3000 is not already in use
- **Check**: Node modules are installed (`npm install`)
- **Check**: TypeScript compilation errors

### Issue: Actions not triggering
- **Check**: Browser console for errors
- **Check**: Network tab to see if API calls are being made
- **Check**: CopilotKit runtime URL is correct

### Issue: Python process errors
- **Check**: Virtual environment exists (`ls weather/.venv`)
- **Check**: Dependencies installed (`cd weather && uv run python -c "from weather import get_forecast"`)

## Expected UI Components

When queries succeed, you should see:

1. **WeatherCard**: 
   - Colored background (theme based on conditions)
   - Weather icon (sun, cloud, rain)
   - Temperature display
   - Wind and humidity info

2. **ForecastList**: 
   - Multiple forecast periods
   - Temperature and conditions for each period

3. **AlertCard**: 
   - Severity-colored background (red=extreme, orange=severe, yellow=moderate)
   - Event name and area
   - Description and instructions

## Success Criteria

✅ Chat interface loads without errors  
✅ Weather forecast queries return data and display cards  
✅ Weather alert queries return data and display alerts  
✅ UI components render correctly with proper styling  
✅ Loading states show during API calls  
✅ Error messages display for invalid inputs  

## Next Steps

Once basic functionality works:
1. Test with different locations
2. Test edge cases (no alerts, invalid coordinates)
3. Verify UI responsiveness on different screen sizes
4. Check browser console for any warnings or errors

