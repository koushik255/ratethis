import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import AnimeDetail from "./pages/AnimeDetail";
import ProfilePage from "./pages/ProfilePage";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/anime/:id" element={<AnimeDetail />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </BrowserRouter>
      </ConvexAuthProvider>
    </ConvexProvider>
  </React.StrictMode>,
);
