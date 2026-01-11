"use client";

import React, { useState, useEffect } from "react";
import "@copilotkit/react-ui/styles.css";
import "./style.css";
import { CopilotKit, useCopilotAction, useHumanInTheLoop } from "@copilotkit/react-core";
import { useAgent } from "@copilotkit/react-core/v2";
import { CopilotChat } from "@copilotkit/react-ui";

const AgenticChat: React.FC = () => {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="default">
      <Chat />
    </CopilotKit>
  );
};

interface WeatherOption {
  description: string;
  status: "enabled" | "disabled";
  action: "forecast" | "alerts";
}

const Chat = () => {
  // Use the new useAgent() hook from v1.50 for enhanced agent control
  const { agent } = useAgent({ 
    agentId: "default",
  });

  // Human-in-the-loop for weather action selection
  useHumanInTheLoop({
    name: "confirm_weather_query",
    description: "Request user confirmation for which weather information to fetch",
    parameters: [
      { name: "location", type: "string", required: true },
      { name: "latitude", type: "number", required: true },
      { name: "longitude", type: "number", required: true },
      { name: "display_name", type: "string", required: true },
      { name: "state_code", type: "string", required: true },
      {
        name: "options",
        type: "object[]",
        required: true,
      },
    ],
    render: ({ args, respond, status }) => {
      return (
        <WeatherActionsSelection
          args={args}
          respond={respond}
          status={status || "complete"}
        />
      );
    },
  });

  // Tool rendering for get_forecast
  useCopilotAction({
    name: "get_forecast",
    available: "disabled",
    parameters: [
      { name: "latitude", type: "number", required: true },
      { name: "longitude", type: "number", required: true },
    ],
    render: ({ args, result, status }) => {
      if (status !== "complete" || !result) {
        return (
          <div className="bg-[#667eea] text-white p-4 rounded-lg max-w-md">
            <span className="animate-spin">⚙️ Retrieving weather forecast...</span>
          </div>
        );
      }

      const themeColor = getThemeColor(result.conditions || "clear");

      return (
        <WeatherCard
          location={result.location}
          temperature={result.temperature}
          temperature_f={result.temperature_f}
          conditions={result.conditions}
          windSpeed={result.windSpeed}
          windSpeedText={result.windSpeedText}
          windDirection={result.windDirection}
          feelsLike={result.feelsLike}
          humidity={result.humidity || 0}
          themeColor={themeColor}
          status={status || "complete"}
        />
      );
    },
  });

  // Tool rendering for get_alerts
  useCopilotAction({
    name: "get_alerts",
    available: "disabled",
    parameters: [
      { name: "state", type: "string", required: true },
    ],
    render: ({ args, result, status }) => {
      if (status !== "complete" || !result) {
        return (
          <div className="bg-gradient-to-br from-red-600 to-orange-500 text-white p-4 rounded-lg max-w-md">
            <span className="animate-spin">⚙️ Checking weather alerts...</span>
          </div>
        );
      }

      const alerts = result.alerts || [];
      const count = result.count || 0;

      return (
        <AlertsCard
          state={args.state}
          alerts={alerts}
          count={count}
          status={status || "complete"}
        />
      );
    },
  });

  return (
    <div className="flex justify-center items-center h-full w-full">
      <div className="h-full w-full md:w-8/10 md:h-8/10 rounded-lg">
        <CopilotChat
          className="h-full rounded-2xl max-w-6xl mx-auto"
          labels={{ 
            title: "Weather Assistant",
            initial: "Hi! I can look up the weather for you. Just ask!" 
          }}
          instructions="You are a helpful weather assistant. When users ask about weather, use the get_weather tool to fetch weather information."
          suggestions={[
            { title: "Weather in San Francisco", message: "What's the weather like in San Francisco?" },
            { title: "Weather in New York", message: "Tell me about the weather in New York." },
            { title: "Weather in Washington DC", message: "What is the weather in Washington DC?" },
          ]}
        />
      </div>
    </div>
  );
};

// Weather Action Selection Component (HITL)
const WeatherActionsSelection = ({ args, respond, status }: { args: any; respond: any; status: any }) => {
  const [localOptions, setLocalOptions] = useState<WeatherOption[]>([]);
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "executing" && localOptions.length === 0 && args.options) {
      setLocalOptions(args.options);
    }
  }, [status, args.options, localOptions.length]);

  if (!args.options || args.options.length === 0) {
    return <></>;
  }

  const options = localOptions.length > 0 ? localOptions : args.options;
  const enabledCount = options.filter((opt: WeatherOption) => opt.status === "enabled").length;

  const handleOptionToggle = (index: number) => {
    setLocalOptions((prevOptions) =>
      prevOptions.map((opt, i) =>
        i === index
          ? { ...opt, status: opt.status === "enabled" ? "disabled" : "enabled" }
          : opt
      )
    );
  };

  const handleReject = () => {
    if (respond) {
      setAccepted(false);
      respond({ accepted: false });
    }
  };

  const handleConfirm = () => {
    if (respond) {
      setAccepted(true);
      const selectedActions = localOptions
        .filter((opt) => opt.status === "enabled")
        .map((opt) => opt.action);
      respond({
        accepted: true,
        selected_actions: selectedActions,
        latitude: args.latitude,
        longitude: args.longitude,
        state_code: args.state_code,
        display_name: args.display_name,
      });
    }
  };

  return (
    <div className="flex" data-testid="weather-actions-selection">
      <div className="relative rounded-xl w-[600px] p-6 shadow-lg backdrop-blur-sm bg-gradient-to-br from-white via-gray-50 to-white text-gray-800 border border-gray-200/80">
        {/* Decorative Elements */}
        <div
          className={`absolute top-3 right-3 w-16 h-16 rounded-full blur-xl ${
            accepted === true
              ? "bg-gradient-to-br from-green-200/30 to-emerald-200/30"
              : accepted === false
                ? "bg-gradient-to-br from-red-200/30 to-pink-200/30"
                : "bg-gradient-to-br from-blue-200/30 to-purple-200/30"
          }`}
        />
        <div
          className={`absolute bottom-3 left-3 w-12 h-12 rounded-full blur-xl ${
            accepted === null ? "bg-gradient-to-br from-purple-200/30 to-pink-200/30" : "opacity-50"
          }`}
        />

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {args.display_name || args.location}
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                {enabledCount}/{options.length} Selected
              </div>
              {status === "executing" && (
                <div className="text-xs px-2 py-1 rounded-full font-medium bg-blue-50 text-blue-600 border border-blue-200">
                  Ready
                </div>
              )}
            </div>
          </div>

          <p className="text-sm mb-3 text-gray-600">
            Select which weather information you'd like to retrieve:
          </p>

          <div className="relative h-2 rounded-full overflow-hidden bg-gray-200">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${options.length > 0 ? (enabledCount / options.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {options.map((option: WeatherOption, index: number) => (
            <div
              key={index}
              className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                option.status === "enabled"
                  ? "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/60"
                  : "bg-gray-50/50 border border-gray-200/40"
              }`}
            >
              <label data-testid="option-item" className="flex items-center cursor-pointer w-full">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={option.status === "enabled"}
                    onChange={() => handleOptionToggle(index)}
                    className="sr-only"
                    disabled={status !== "executing"}
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      option.status === "enabled"
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 border-blue-500"
                        : "border-gray-300 bg-white"
                    } ${status !== "executing" ? "opacity-60" : ""}`}
                  >
                    {option.status === "enabled" && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span
                  data-testid="option-text"
                  className={`ml-3 font-medium transition-all duration-300 ${
                    option.status !== "enabled" && status !== "inProgress"
                      ? "line-through text-gray-400"
                      : "text-gray-800"
                  } ${status !== "executing" ? "opacity-60" : ""}`}
                >
                  {option.description}
                </span>
              </label>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        {accepted === null && (
          <div className="flex justify-center gap-4">
            <button
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                status !== "executing"
                  ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-500"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 hover:border-gray-400 hover:scale-105 shadow-md hover:shadow-lg"
              }`}
              disabled={status !== "executing"}
              onClick={handleReject}
            >
              <span className="mr-2">✗</span>
              Reject
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                status !== "executing"
                  ? "opacity-50 cursor-not-allowed bg-gray-400"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-105"
              }`}
              disabled={status !== "executing"}
              onClick={handleConfirm}
            >
              <span className="mr-2">✓</span>
              Confirm
              <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold bg-green-600/20">
                {enabledCount}
              </span>
            </button>
          </div>
        )}

        {/* Result State */}
        {accepted !== null && (
          <div className="flex justify-center">
            <div
              className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                accepted
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <span className="text-lg">{accepted ? "✓" : "✗"}</span>
              {accepted ? "Accepted" : "Rejected"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to determine theme color based on weather conditions
function getThemeColor(conditions: string): string {
  const conditionLower = conditions.toLowerCase();
  if (conditionLower.includes("clear") || conditionLower.includes("sunny")) {
    return "#667eea";
  }
  if (conditionLower.includes("rain") || conditionLower.includes("storm")) {
    return "#4A5568";
  }
  if (conditionLower.includes("cloud")) {
    return "#718096";
  }
  if (conditionLower.includes("snow")) {
    return "#63B3ED";
  }
  return "#764ba2";
}

interface Alert {
  event: string;
  area: string;
  severity: string;
  description: string;
  instructions: string;
}

function WeatherCard({
  location,
  temperature,
  temperature_f,
  conditions,
  windSpeed,
  windSpeedText,
  windDirection,
  feelsLike,
  humidity,
  themeColor,
  status,
}: {
  location?: string;
  temperature: number;
  temperature_f: number;
  conditions: string;
  windSpeed: number;
  windSpeedText?: string;
  windDirection?: string;
  feelsLike: number;
  humidity: number;
  themeColor: string;
  status: "inProgress" | "executing" | "complete";
}) {
  return (
    <div
      data-testid="weather-card"
      style={{ backgroundColor: themeColor }}
      className="rounded-xl mt-6 mb-4 max-w-md w-full"
    >
      <div className="bg-white/20 p-4 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h3 data-testid="weather-city" className="text-xl font-bold text-white capitalize">
            {location}
          </h3>
            <p className="text-white">Current Weather</p>
          </div>
          <WeatherIcon conditions={conditions} />
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div className="text-3xl font-bold text-white">
            <span className="">{temperature}° C</span>
            <span className="text-sm text-white/50">
              {" / "}
              {temperature_f}° F
        </span>
          </div>
          <div className="text-sm text-white capitalize">{conditions}</div>
        </div>
        <div className="mt-4 pt-4 border-t border-white">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div data-testid="weather-humidity">
              <p className="text-white text-xs">Humidity</p>
              <p className="text-white font-medium">{humidity}%</p>
            </div>
            <div data-testid="weather-wind">
              <p className="text-white text-xs">Wind</p>
              <p className="text-white font-medium">
                {windSpeedText || `${windSpeed} mph`} {windDirection}
              </p>
            </div>
            <div data-testid="weather-feels-like">
              <p className="text-white text-xs">Feels Like</p>
              <p className="text-white font-medium">{feelsLike}°C</p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertsCard({
  state,
  alerts,
  count,
  status,
}: {
  state?: string;
  alerts: Alert[];
  count: number;
  status: "inProgress" | "executing" | "complete";
}) {
  // Group alerts by severity
  const severeAlerts = alerts.filter(a => a.severity === "Severe");
  const moderateAlerts = alerts.filter(a => a.severity === "Moderate");
  const otherAlerts = alerts.filter(a => a.severity !== "Severe" && a.severity !== "Moderate");

  return (
    <div
      data-testid="alerts-card"
      className="rounded-xl mt-6 mb-4 max-w-2xl w-full bg-gradient-to-br from-red-600 to-orange-500 text-white"
    >
      <div className="bg-white/20 p-6 w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white capitalize flex items-center gap-2">
            <span className="text-3xl">🚨</span>
            Weather Alerts for {state}
          </h3>
          <div className="bg-white/30 px-3 py-1 rounded-full">
            <span className="font-bold">{count} Active</span>
          </div>
        </div>
        
        {count > 0 ? (
          <div className="space-y-3">
            {/* Severe Alerts First */}
            {severeAlerts.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>⚠️</span> Severe Alerts ({severeAlerts.length})
                </h4>
                {severeAlerts.map((alert, index) => (
                  <AlertItem key={`severe-${index}`} alert={alert} />
                ))}
              </div>
            )}

            {/* Moderate Alerts */}
            {moderateAlerts.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span>⚡</span> Moderate Alerts ({moderateAlerts.length})
                </h4>
                {moderateAlerts.map((alert, index) => (
                  <AlertItem key={`moderate-${index}`} alert={alert} />
                ))}
              </div>
            )}

            {/* Other Alerts */}
            {otherAlerts.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-2">
                  Other Alerts ({otherAlerts.length})
                </h4>
                {otherAlerts.map((alert, index) => (
                  <AlertItem key={`other-${index}`} alert={alert} />
                ))}
              </div>
            )}
            </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-lg">No active alerts. Weather is clear!</p>
          </div>
        )}
        </div>
    </div>
  );
}

function AlertItem({ alert }: { alert: Alert }) {
  const [expanded, setExpanded] = useState(false);
    
  return (
    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg mb-2 cursor-pointer hover:bg-white/30 transition-all"
         onClick={() => setExpanded(!expanded)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-bold text-lg">{alert.event}</p>
          <p className="text-sm opacity-90">{alert.area}</p>
        </div>
        <div className="ml-2">
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            alert.severity === "Severe" ? "bg-red-900" : 
            alert.severity === "Moderate" ? "bg-orange-700" : "bg-yellow-600"
          }`}>
            {alert.severity}
          </span>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/30 space-y-2">
          <div>
            <p className="font-semibold text-sm">Description:</p>
            <p className="text-sm opacity-90">{alert.description}</p>
          </div>
          {alert.instructions && (
            <div>
              <p className="font-semibold text-sm">Instructions:</p>
              <p className="text-sm opacity-90">{alert.instructions}</p>
            </div>
          )}
        </div>
      )}
      
      <div className="text-xs mt-2 opacity-75">
        {expanded ? "Click to collapse" : "Click to expand"}
      </div>
    </div>
  );
}

function WeatherIcon({ conditions }: { conditions: string }) {
  if (!conditions) return null;
  if (conditions.toLowerCase().includes("clear") || conditions.toLowerCase().includes("sunny")) {
    return <SunIcon />;
  }
  if (
    conditions.toLowerCase().includes("rain") ||
    conditions.toLowerCase().includes("drizzle") ||
    conditions.toLowerCase().includes("snow") ||
    conditions.toLowerCase().includes("thunderstorm")
  ) {
    return <RainIcon />;
  }
  if (
    conditions.toLowerCase().includes("fog") ||
    conditions.toLowerCase().includes("cloud") ||
    conditions.toLowerCase().includes("overcast")
  ) {
    return <CloudIcon />;
  }
  return <CloudIcon />;
}

// Simple sun icon for the weather card
function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-12 h-12 text-yellow-200"
    >
      <circle cx="12" cy="12" r="5" />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        strokeWidth="2"
        stroke="currentColor"
      />
    </svg>
  );
}

function RainIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-12 h-12 text-blue-200"
    >
      {/* Cloud */}
      <path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 10 0 4 4 0 0 1 0 8H7z" fill="currentColor" opacity="0.8" />
      {/* Rain drops */}
      <path d="M8 18l2 4M12 18l2 4M16 18l2 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-12 h-12 text-gray-200"
    >
      <path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 10 0 4 4 0 0 1 0 8H7z" fill="currentColor" />
    </svg>
  );
}

export default AgenticChat;
