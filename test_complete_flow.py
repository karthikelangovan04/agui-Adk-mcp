#!/usr/bin/env python3
"""Complete end-to-end test."""
import asyncio
import json
import httpx


async def complete_test():
    """Full test including all 3 tool calls."""
    print("🔬 Complete End-to-End Test")
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
            
            tool_calls = {}
            events = []
            
            async for line in response.aiter_lines():
                if line.startswith("data:"):
                    try:
                        parsed = json.loads(line[5:].strip())
                        event_type = parsed.get("type")
                        events.append(event_type)
                        
                        if event_type == "TOOL_CALL_START":
                            tool_name = parsed.get("toolCallName")
                            tool_id = parsed.get("toolCallId")
                            tool_calls[tool_id] = {"name": tool_name, "complete": False}
                            print(f"🔧 Tool Call: {tool_name}")
                        
                        elif event_type == "TOOL_CALL_RESULT":
                            tool_id = parsed.get("toolCallId")
                            if tool_id in tool_calls:
                                tool_calls[tool_id]["complete"] = True
                                has_content = 'content' in parsed
                                has_result = 'result' in parsed
                                print(f"   ✅ Result: content={has_content}, result={has_result}")
                                
                                # Check if content is valid JSON
                                if has_content:
                                    try:
                                        json.loads(parsed['content'])
                                        print(f"   ✅ Content is valid JSON")
                                    except:
                                        print(f"   ⚠️  Content is not valid JSON")
                        
                        elif event_type == "RUN_FINISHED":
                            break
                    except:
                        pass
            
            print(f"\n{'=' * 80}")
            print(f"Summary:")
            print(f"  Total events: {len(events)}")
            print(f"  Tool calls: {len(tool_calls)}")
            
            for tool_id, info in tool_calls.items():
                status = "✅" if info['complete'] else "⚠️"
                print(f"  {status} {info['name']}")
            
            if all(t['complete'] for t in tool_calls.values()):
                print(f"\n🎉 All tool calls completed successfully!")
            print("=" * 80)


if __name__ == "__main__":
    asyncio.run(complete_test())

