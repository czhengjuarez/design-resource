import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import AboutPage from "./AboutPage";
import SuggestPage from "./SuggestPage";
import AdminLayout from "./admin/AdminLayout";
import AdminLogin from "./admin/AdminLogin";
import AdminResources from "./admin/AdminResources";
import AdminCategories from "./admin/AdminCategories";
import AdminSuggestions from "./admin/AdminSuggestions";
import { useTheme } from "./hooks/useTheme";
import "./index.css";

const queryClient = new QueryClient();

// index.html hardcodes data-mode="dark" so the initial paint has a theme
// before React loads. useTheme() here applies the user's saved preference
// to <html> on every route, not just the ones that render <App />.
function ThemedRoutes() {
  useTheme();
  return (
    <Routes>
      <Route path="/about" element={<AboutPage />} />
      <Route path="/suggest" element={<SuggestPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminResources />} />
        <Route path="resources" element={<AdminResources />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="suggestions" element={<AdminSuggestions />} />
      </Route>
      <Route path="/*" element={<App />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemedRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
