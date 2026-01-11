# Quick Start Guide

## ✅ Current Status

- ✅ **Backend**: Next.js server is running on `http://localhost:3000`
- ✅ **Frontend**: React app with CopilotKit chat interface
- ✅ **MCP Server**: Weather tools configured and ready
- ✅ **Python Environment**: Virtual environment set up with all dependencies

## 🚀 Testing Steps

### 1. Open the Application

Open your browser and navigate to:
```
http://localhost:3000
```

### 2. Test Weather Forecast

**Try these queries in the chat:**

1. Click the suggestion: **"Weather in San Francisco"**
   - Or type: "What's the weather forecast for San Francisco? (37.7749, -122.4194)"

2. **Expected Result:**
   - Loading indicator appears
   - Weather card displays with:
     - Temperature (Fahrenheit and Celsius)
     - Weather conditions
     - Wind speed
     - Extended forecast

### 3. Test Weather Alerts

**Try these queries:**

1. Click: **"Weather alerts in California"**
   - Or type: "Get weather alerts for CA"

2. **Expected Result:**
   - Loading indicator appears
   - Alert cards display (if alerts exist) or "No active alerts" message

### 4. Test Natural Language

Try natural language queries:
- "What's the weather like in New York?"
- "Show me weather alerts for Texas"
- "Get forecast for coordinates 34.0522, -118.2437"

## 🔍 Verification Checklist

- [ ] Server is running (check terminal for "Ready" message)
- [ ] Browser opens `http://localhost:3000` without errors
- [ ] Chat interface appears with suggestions
- [ ] Weather forecast queries return data
- [ ] Weather cards render correctly
- [ ] Alert queries work (may show "no alerts" if none active)
- [ ] No console errors in browser DevTools

## 🐛 Troubleshooting

### Server Not Running?
```bash
cd /Users/karthike/Desktop/Vibe\ Coding/Weather-ADK-AGUI
npm run dev
```

### Python Errors?
```bash
cd weather
uv run python -c "from weather import get_forecast; print('OK')"
```

### Check API Endpoints Directly
```bash
# Test forecast
curl -X POST http://localhost:3000/api/weather/forecast \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7749, "longitude": -122.4194}'

# Test alerts
curl -X POST http://localhost:3000/api/weather/alerts \
  -H "Content-Type: application/json" \
  -d '{"state": "CA"}'
```

## 📝 Next Steps

1. Test with different locations
2. Try edge cases (invalid coordinates, non-US locations)
3. Check UI responsiveness
4. Review browser console for any warnings

For detailed testing instructions, see `TESTING.md`

