#!/usr/bin/env python3
import asyncio
import httpx


async def test():
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            "http://localhost:3000/api/copilotkit",
            json={"messages": [{"role": "user", "content": "What's the weather in San Francisco?"}]},
            headers={"Content-Type": "application/json"}
        ) as response:
            async for line in response.aiter_lines():
                if "confirm_weather_query" in line or "RUN_ERROR" in line or "error" in line.lower():
                    print(line)


if __name__ == "__main__":
    asyncio.run(test())

