#!/usr/bin/env python3
"""Verify the Zod error is fixed."""
import asyncio
import json
import httpx


async def test_zod_fix():
    """Test that TOOL_CALL_RESULT now has content field."""
    print("🔬 Testing Zod Validation Fix")
    print("=" * 80)
    
    await asyncio.sleep(6)  # Wait for server to start
    
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
            
            tool_results = []
            
            async for line in response.aiter_lines():
                if line.startswith("data:"):
                    try:
                        parsed = json.loads(line[5:].strip())
                        
                        if parsed.get("type") == "TOOL_CALL_RESULT":
                            result_info = {
                                'toolCallId': parsed.get('toolCallId'),
                                'has_content': 'content' in parsed,
                                'has_result': 'result' in parsed,
                                'content_type': type(parsed.get('content')).__name__ if 'content' in parsed else None,
                                'result_type': type(parsed.get('result')).__name__ if 'result' in parsed else None,
                            }
                            tool_results.append(result_info)
                            print(f"📦 TOOL_CALL_RESULT #{len(tool_results)}")
                            print(f"   has_content: {result_info['has_content']} (type: {result_info['content_type']})")
                            print(f"   has_result: {result_info['has_result']} (type: {result_info['result_type']})")
                        
                        if parsed.get("type") == "RUN_FINISHED":
                            break
                    except json.JSONDecodeError:
                        pass
            
            print(f"\n{'=' * 80}")
            if all(r['has_content'] for r in tool_results):
                print(f"✅ All {len(tool_results)} tool results have 'content' field (Zod happy!)")
            else:
                print(f"⚠️  Some tool results missing 'content' field")
            
            if all(r['has_result'] for r in tool_results):
                print(f"✅ All {len(tool_results)} tool results have 'result' field")
            print("=" * 80)


if __name__ == "__main__":
    asyncio.run(test_zod_fix())

