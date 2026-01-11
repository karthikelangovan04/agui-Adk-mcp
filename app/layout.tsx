import type { Metadata } from "next";
import "./style.css";

export const metadata: Metadata = {
  title: "Weather ADK AGUI",
  description: "Weather application with Google ADK and CopilotKit",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
