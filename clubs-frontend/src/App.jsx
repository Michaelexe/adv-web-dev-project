import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ClubProvider } from "./contexts/ClubContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ClubManagement from "./pages/ClubManagement";
import CreateClub from "./pages/CreateClub";
import EditClub from "./pages/EditClub";
import EventManagement from "./pages/EventManagement";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClubProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clubs"
              element={
                <ProtectedRoute>
                  <ClubManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clubs/create"
              element={
                <ProtectedRoute>
                  <CreateClub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clubs/:clubUid/edit"
              element={
                <ProtectedRoute>
                  <EditClub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/create"
              element={
                <ProtectedRoute>
                  <CreateEvent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:eventUid/edit"
              element={
                <ProtectedRoute>
                  <EditEvent />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ClubProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
