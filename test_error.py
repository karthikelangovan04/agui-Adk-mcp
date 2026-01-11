#!/usr/bin/env python3
"""Check what the RUN_ERROR contains."""
import asyncio
import json
import httpx


async def test_error():
    """Check the RUN_ERROR details."""
    print("🔬 Checking RUN_ERROR Details")
    print("=" * 80)
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            "http://localhost:3000/api/copilotkit",
            json={
                "messages": [
                    {"role": "user", "content": "What's the weather in San Francisco?"}
                ]
            },
            headers={"Content-Type": "application/json"}
        ) as response:
            print(f"Status: {response.status_code}\n")
            
            async for line in response.aiter_lines():
                if line.startswith("data:"):
                    try:
                        parsed = json.loads(line[5:].strip())
                        
                        if parsed.get("type") == "RUN_ERROR":
                            print("❌ RUN_ERROR Found!")
                            print(json.dumps(parsed, indent=2))
                            break
                            
                        elif parsed.get("type") == "TOOL_CALL_START" and parsed.get("toolCallName") == "confirm_weather_query":
                            print("📋 HITL Tool Call Started")
                            print(json.dumps(parsed, indent=2))
                        
                        elif parsed.get("type") == "TOOL_CALL_ARGS" and "options" in str(parsed):
                            print("\n📦 HITL Tool Args")
                            print(json.dumps(parsed, indent=2))
                    except:
                        pass


if __name__ == "__main__":
    asyncio.run(test_error())

