#!/usr/bin/env python3
"""Test to capture the HITL confirmation tool call."""
import asyncio
import json
import httpx


async def test_hitl_flow():
    """Test to see what HITL tool sends."""
    print("🔬 Testing HITL Confirmation Flow")
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
            
            if response.status_code != 200:
                error_text = await response.aread()
                print(f"❌ Error: {error_text.decode()}")
                return
            
            line_count = 0
            
            async for line in response.aiter_lines():
                line_count += 1
                
                if line.startswith("data:"):
                    try:
                        data_json = line[5:].strip()
                        if data_json:
                            parsed = json.loads(data_json)
                            
                            # Look for confirm_weather_query tool call
                            if parsed.get("type") == "TOOL_CALL_START" and parsed.get("toolCallName") == "confirm_weather_query":
                                print(f"\n🎯 Found HITL Tool Call Start")
                                print(f"Line {line_count}: {json.dumps(parsed, indent=2)}")
                            
                            elif parsed.get("type") == "TOOL_CALL_ARGS" and "confirm_weather_query" in str(parsed):
                                print(f"\n📋 HITL Tool Args")
                                print(f"Line {line_count}: {json.dumps(parsed, indent=2)}")
                            
                            elif parsed.get("type") == "TOOL_CALL_RESULT":
                                print(f"\n📦 TOOL_CALL_RESULT")
                                print(f"Line {line_count}")
                                print(f"Tool Call ID: {parsed.get('toolCallId')}")
                                
                                # Check the format
                                if 'result' in parsed:
                                    print(f"✅ Has 'result' field")
                                    print(f"Result type: {type(parsed['result'])}")
                                    print(f"Result: {json.dumps(parsed['result'], indent=2)[:500]}")
                                
                                if 'content' in parsed:
                                    print(f"⚠️  Has 'content' field")
                                    print(f"Content type: {type(parsed['content'])}")
                                    print(f"Content preview: {str(parsed['content'])[:500]}")
                            
                            # Stop after we see RUN_FINISHED
                            if parsed.get("type") == "RUN_FINISHED":
                                print(f"\n✅ RUN_FINISHED at line {line_count}")
                                break
                                
                    except json.JSONDecodeError as e:
                        print(f"\n❌ JSON Parse Error at line {line_count}")
                        print(f"Error: {e}")
                        print(f"Line preview: {line[:300]}...")
                        break


if __name__ == "__main__":
    asyncio.run(test_hitl_flow())

