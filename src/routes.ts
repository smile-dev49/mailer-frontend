export const ROUTES = {
  dashboard: "/dashboard",
  registerToken: "/register-token",
  scrapingSetting: "/scraping-setting",
  sendingMessage: "/sending-message",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export const NAV_ITEMS: { path: RoutePath; label: string; icon: string }[] = [
  { path: ROUTES.dashboard, label: "Dashboard", icon: "◫" },
  { path: ROUTES.registerToken, label: "Register Token", icon: "🔑" },
  { path: ROUTES.scrapingSetting, label: "Scraping Setting", icon: "⌕" },
  { path: ROUTES.sendingMessage, label: "Message Setting", icon: "✉" },
];
