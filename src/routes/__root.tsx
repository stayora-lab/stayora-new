import { useEffect } from "react";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { useBookingStore } from "@/lib/store";
import appCss from "../styles.css?url";

const APP_NAME = "Stayora";

function HydrateStore() {
  const setHydrated = useBookingStore((state) => state.setHydrated);
  const tickExpiry = useBookingStore((state) => state.tickExpiry);
  useEffect(() => {
    const persistApi = useBookingStore.persist;
    const startTick = () => {
      tickExpiry();
      const id = window.setInterval(() => {
        useBookingStore.getState().tickExpiry();
      }, 30_000);
      return id;
    };
    if (persistApi.hasHydrated()) {
      setHydrated(true);
      const id = startTick();
      return () => window.clearInterval(id);
    }
    let interval = 0;
    const result = persistApi.rehydrate();
    void Promise.resolve(result).then(() => {
      interval = startTick();
    });
    return () => window.clearInterval(interval);
  }, [setHydrated, tickExpiry]);
  return null;
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Stayora — private villas at Oceanami, Phước Hải. Chủ nhà sẽ xem và phản hồi.",
      },
      { name: "theme-color", content: "#F6F1EA" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-cream font-sans text-ink">
        <PreviewHostBridge />
        <AuthProvider>
          <HydrateStore />
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <div className="flex-1">
              <Outlet />
            </div>
            <SiteFooter />
          </div>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
