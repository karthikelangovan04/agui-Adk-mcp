#!/usr/bin/env python3
"""Test to see ALL events, including any malformed JSON."""
import asyncio
import json
import httpx


async def test_all_events():
    """Capture all events to find the problematic one."""
    print("🔬 Capturing ALL Events to Find JSON Parse Error")
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
            event_count = 0
            
            async for line in response.aiter_lines():
                line_count += 1
                
                if line.startswith("data:"):
                    event_count += 1
                    data_str = line[5:].strip()
                    
                    if not data_str:
                        continue
                    
                    # Try to parse
                    try:
                        parsed = json.loads(data_str)
                        event_type = parsed.get("type", "UNKNOWN")
                        
                        # Show event summary
                        if event_type == "TOOL_CALL_START":
                            print(f"[{event_count:03d}] {event_type}: {parsed.get('toolCallName')}")
                        elif event_type == "TOOL_CALL_RESULT":
                            has_result = 'result' in parsed
                            has_content = 'content' in parsed
                            print(f"[{event_count:03d}] {event_type}: has_result={has_result}, has_content={has_content}")
                        elif event_type in ["RUN_STARTED", "RUN_FINISHED"]:
                            print(f"[{event_count:03d}] {event_type}")
                        elif event_type == "TEXT_MESSAGE_CONTENT":
                            delta = parsed.get("delta", "")[:50]
                            print(f"[{event_count:03d}] {event_type}: {repr(delta)}")
                        else:
                            print(f"[{event_count:03d}] {event_type}")
                        
                        # Stop at RUN_FINISHED
                        if event_type == "RUN_FINISHED":
                            break
                            
                    except json.JSONDecodeError as e:
                        print(f"\n❌❌❌ JSON PARSE ERROR at line {line_count}, event {event_count} ❌❌❌")
                        print(f"Error: {e}")
                        print(f"Position {e.pos}: '{data_str[max(0,e.pos-20):e.pos+20]}'")
                        print(f"\nFull data string ({len(data_str)} chars):")
                        print(f"{data_str[:500]}")
                        if len(data_str) > 500:
                            print(f"... ({len(data_str)-500} more chars)")
                        break
            
            print(f"\n{'=' * 80}")
            print(f"Processed {event_count} events successfully")
            print("=" * 80)


if __name__ == "__main__":
    asyncio.run(test_all_events())

