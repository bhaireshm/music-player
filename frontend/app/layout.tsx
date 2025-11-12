import type { Metadata } from "next";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import ClientLayout from "@/components/ClientLayout";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Music Player - Stream Your Music",
  description: "Upload, organize, and stream your music collection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body suppressHydrationWarning>
        <MantineProvider
          defaultColorScheme="auto"
          theme={{
            primaryColor: "blue",
            fontFamily: "Inter, system-ui, sans-serif",
            headings: {
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: "600",
            },
            other: {
              gradient: "linear-gradient(135deg, var(--mantine-color-blue-0) 0%, var(--mantine-color-indigo-1) 100%)",
            },
          }}
        >
          <Notifications position="top-right" />
          <ClientLayout>{children}</ClientLayout>
        </MantineProvider>
      </body>
    </html>
  );
}
