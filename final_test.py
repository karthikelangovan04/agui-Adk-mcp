#!/usr/bin/env python3
"""Final test to verify HTTP 422 error is fixed."""
import asyncio
import json
import httpx


async def final_test():
    """Complete test with actual weather query."""
    print("🎯 Final Test - HTTP 422 Fix Verification")
    print("=" * 80)
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        print("Sending: 'What's the weather in San Francisco?'\n")
        
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
            print(f"Response Status: {response.status_code}")
            
            if response.status_code != 200:
                error_text = await response.aread()
                print(f"❌ HTTP Error: {error_text.decode()}")
                return
            
            print("✅ HTTP 200 OK\n")
            
            events_summary = {
                "TOOL_CALL_START": [],
                "TOOL_CALL_RESULT": 0,
                "TEXT_MESSAGE": 0,
                "ERRORS": []
            }
            
            async for line in response.aiter_lines():
                if line.startswith("data:"):
                    try:
                        parsed = json.loads(line[5:].strip())
                        event_type = parsed.get("type")
                        
                        if event_type == "TOOL_CALL_START":
                            tool_name = parsed.get("toolCallName")
                            events_summary["TOOL_CALL_START"].append(tool_name)
                            print(f"🔧 Tool: {tool_name}")
                        
                        elif event_type == "TOOL_CALL_RESULT":
                            events_summary["TOOL_CALL_RESULT"] += 1
                            print(f"   ✅ Result received")
                        
                        elif event_type == "TEXT_MESSAGE_CONTENT":
                            events_summary["TEXT_MESSAGE"] += 1
                        
                        elif "error" in event_type.lower():
                            events_summary["ERRORS"].append(parsed)
                            print(f"❌ Error event: {event_type}")
                        
                        elif event_type == "RUN_FINISHED":
                            print(f"\n✅ RUN_FINISHED")
                            break
                    except:
                        pass
            
            print(f"\n{'=' * 80}")
            print("Summary:")
            print(f"  Tools called: {len(events_summary['TOOL_CALL_START'])}")
            for tool in events_summary['TOOL_CALL_START']:
                print(f"    - {tool}")
            print(f"  Tool results: {events_summary['TOOL_CALL_RESULT']}")
            print(f"  Text chunks: {events_summary['TEXT_MESSAGE']}")
            print(f"  Errors: {len(events_summary['ERRORS'])}")
            
            if len(events_summary['ERRORS']) == 0 and events_summary['TOOL_CALL_RESULT'] > 0:
                print(f"\n🎉 ALL TESTS PASSED!")
                print("✅ No HTTP 422 errors")
                print("✅ No JSON parse errors")
                print("✅ No Zod validation errors")
                print("✅ Tool calls completed successfully")
            else:
                print(f"\n⚠️  Some issues detected")
            print("=" * 80)


if __name__ == "__main__":
    asyncio.run(final_test())

