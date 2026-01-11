"use client";

import React, { useState, useEffect } from "react";
import "@copilotkit/react-ui/styles.css";
import "./style.css";
import { CopilotKit } from "@copilotkit/react-core";
import { useAgent } from "@copilotkit/react-core/v2";
import { CopilotChat } from "@copilotkit/react-ui";

const AgenticChat: React.FC = () => {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <Chat />
    </CopilotKit>
  );
};

const Chat = () => {
  // Use the new useAgent() hook from v1.50 for enhanced agent control
  // Using "default" agent ID which is CopilotKit's convention
  const { agent } = useAgent({ 
    agentId: "default",
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
            { title: "Weather alerts in California", message: "Get weather alerts for California." },
          ]}
        />
      </div>
    </div>
  );
};

interface Alert {
  event: string;
  area: string;
  severity: string;
  description: string;
  instructions: string;
}

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
      className="w-14 h-14 text-yellow-200"
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
      className="w-14 h-14 text-blue-200"
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
      className="w-14 h-14 text-gray-200"
    >
      <path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 10 0 4 4 0 0 1 0 8H7z" fill="currentColor" />
    </svg>
  );
}

export default AgenticChat;
