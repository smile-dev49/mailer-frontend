import { useState } from "react";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import { DashboardPage } from "./pages/DashboardPage";
import { ScrapingPage } from "./pages/ScrapingPage";
import { SendingPage } from "./pages/SendingPage";
import type { PageId } from "./types";

export default function App() {
  const [page, setPage] = useState<PageId>("dashboard");

  return (
    <div className="layout">
      <Sidebar page={page} onNavigate={setPage} />
      <main className="main-content">
        {page === "dashboard" && <DashboardPage />}
        {page === "scraping" && <ScrapingPage />}
        {page === "sending" && <SendingPage />}
      </main>
    </div>
  );
}
