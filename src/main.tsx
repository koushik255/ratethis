import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Lazy load all page components for code splitting
const App = lazy(() => import("./App"));
const AnimeDetail = lazy(() => import("./pages/AnimeDetail"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const LogPage = lazy(() => import("./pages/LogPage"));
const ListsPage = lazy(() => import("./pages/ListsPage"));
const ListView = lazy(() => import("./pages/ListView"));
const ListBuilder = lazy(() => import("./pages/ListBuilder"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="board">
      <div className="loading">
        <p>loading...</p>
      </div>
    </div>
  );
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL, {
  verbose: true,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/anime/:id" element={<AnimeDetail />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:username" element={<PublicProfilePage />} />
              <Route path="/log" element={<LogPage />} />
              <Route path="/lists" element={<ListsPage />} />
              <Route path="/lists/:id" element={<ListView />} />
              <Route path="/lists/:id/edit" element={<ListBuilder />} />
              <Route path="/friends" element={<FriendsPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ConvexAuthProvider>
    </ConvexProvider>
  </React.StrictMode>,
);
