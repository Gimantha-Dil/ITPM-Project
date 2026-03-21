import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import NoteDetail from './pages/NoteDetail';
import CreateNote from './pages/CreateNote';
import EditNote from './pages/EditNote';
import MyNotes from './pages/MyNotes';
import MyPurchases from './pages/MyPurchases';
import KuppiSessions from './pages/KuppiSessions';
import KuppiSessionDetail from './pages/KuppiSessionDetail';
import CreateSession from './pages/CreateSession';
import EditSession from './pages/EditSession';
import MySessions from './pages/MySessions';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import ChatPage from './pages/ChatPage';
import Notifications from './pages/Notifications';
import Bookmarks from './pages/Bookmarks';
import Chatbot from './pages/Chatbot';
import PaymentHistory from './pages/PaymentHistory';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;

  if (!user) {
    return (
      <div className="auth-layout">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-container">
        <Sidebar />
        <main className="content">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
            <Route path="/notes/:id" element={<ProtectedRoute><NoteDetail /></ProtectedRoute>} />
            <Route path="/create-note" element={<ProtectedRoute><CreateNote /></ProtectedRoute>} />
            <Route path="/edit-note/:id" element={<ProtectedRoute><EditNote /></ProtectedRoute>} />
            <Route path="/my-notes" element={<ProtectedRoute><MyNotes /></ProtectedRoute>} />
            <Route path="/my-purchases" element={<ProtectedRoute><MyPurchases /></ProtectedRoute>} />
            <Route path="/kuppi-sessions" element={<ProtectedRoute><KuppiSessions /></ProtectedRoute>} />
            <Route path="/kuppi-sessions/:id" element={<ProtectedRoute><KuppiSessionDetail /></ProtectedRoute>} />
            <Route path="/create-session" element={<ProtectedRoute><CreateSession /></ProtectedRoute>} />
            <Route path="/edit-session/:id" element={<ProtectedRoute><EditSession /></ProtectedRoute>} />
            <Route path="/my-sessions" element={<ProtectedRoute><MySessions /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/chat/:chatId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
            <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
            <Route path="/payment-history" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;