import { NextRequest } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { state } = await req.json();

    if (!state || typeof state !== "string") {
      return Response.json({ error: "Invalid state code" }, { status: 400 });
    }

    return new Promise((resolve) => {
      const weatherScriptPath = path.join(process.cwd(), "weather", "weather.py");
      // Use mcp CLI to call the tool directly
      const pythonProcess = spawn("uv", ["run", "python", "-c", `
import sys
import asyncio
import json
sys.path.insert(0, "${path.dirname(weatherScriptPath)}")

# Import the function directly from the module
import importlib.util
spec = importlib.util.spec_from_file_location("weather", "${weatherScriptPath}")
weather_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(weather_module)

async def main():
    try:
        # Call the get_alerts function directly
        result = await weather_module.get_alerts("${state}")
        print(json.dumps({"result": result}))
    except Exception as e:
        import traceback
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}))

asyncio.run(main())
      `]);

      let output = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            resolve(Response.json(result));
          } catch (e) {
            resolve(Response.json({ result: output.trim() || errorOutput }));
          }
        } else {
          resolve(Response.json({ error: errorOutput || "Failed to fetch alerts" }, { status: 500 }));
        }
      });
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

