import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { RegisterTokenPage } from "./pages/RegisterTokenPage";
import { ScrapingPage } from "./pages/ScrapingPage";
import { SendingPage } from "./pages/SendingPage";
import { ROUTES } from "./routes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="register-token" element={<RegisterTokenPage />} />
          <Route path="scraping-setting" element={<ScrapingPage />} />
          <Route path="sending-message" element={<SendingPage />} />
          <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
