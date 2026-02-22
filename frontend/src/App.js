import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Ministries from "./pages/Ministries";
import MinistryDetail from "./pages/MinistryDetail";
import News from "./pages/News";
import Amendments from "./pages/Amendments";
import Login from "./pages/Login";
import Admin from "./pages/Admin";

function App() {
  return (
    <AuthProvider>
      <div className="App min-h-screen bg-background text-foreground">
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ministries" element={<Ministries />} />
            <Route path="/ministries/:id" element={<MinistryDetail />} />
            <Route path="/news" element={<News />} />
            <Route path="/amendments" element={<Amendments />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
          <Footer />
        </BrowserRouter>
        <Toaster position="top-right" theme="dark" />
      </div>
    </AuthProvider>
  );
}

export default App;
