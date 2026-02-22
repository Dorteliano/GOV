import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Newspaper, Scale, LogOut, Menu, X,
  Users, Home, ChevronRight, Crown, Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MinistryManager from '../components/admin/MinistryManager';
import NewsManager from '../components/admin/NewsManager';
import AmendmentsManager from '../components/admin/AmendmentsManager';
import RoleManager from '../components/admin/RoleManager';
import LeadershipManager from '../components/admin/LeadershipManager';

const Admin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('ministries');
  const { user, logout, isAuthenticated, loading, isGovernor, hasPermission } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const allLinks = [
    { id: 'leadership', label: 'Руководство', icon: Users, permission: 'can_manage_leadership' },
    { id: 'ministries', label: 'Министерства', icon: Building2, permission: 'can_manage_ministries' },
    { id: 'news', label: 'Новости', icon: Newspaper, permission: 'can_manage_news' },
    { id: 'amendments', label: 'Поправки Сената', icon: Scale, permission: 'can_manage_legislation' },
    { id: 'roles', label: 'Должности', icon: Key, permission: 'can_manage_roles' },
  ];

  const sidebarLinks = allLinks.filter(link => 
    isGovernor || hasPermission(link.permission)
  );

  useEffect(() => {
    if (sidebarLinks.length > 0 && !sidebarLinks.find(l => l.id === activeTab)) {
      setActiveTab(sidebarLinks[0].id);
    }
  }, [sidebarLinks, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen pt-20 flex" data-testid="admin-page">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-20 bottom-0 w-64 bg-background-paper border-r border-white/5 z-30 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isGovernor ? 'bg-primary/20' : 'bg-white/5'
            }`}>
              {isGovernor ? (
                <Crown className="w-5 h-5 text-primary" />
              ) : (
                <Users className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm text-white font-medium">{user?.username}</p>
              <p className={`text-xs ${isGovernor ? 'text-primary' : 'text-muted-foreground'}`}>
                {user?.role_name || 'Администратор'}
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            {sidebarLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                data-testid={`admin-nav-${link.id}`}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors sidebar-link ${
                  activeTab === link.id ? 'active' : 'text-muted-foreground hover:text-white'
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>На сайт</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:text-red-400 transition-colors"
            data-testid="admin-logout-btn"
          >
            <LogOut className="w-5 h-5" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-black rounded-full flex items-center justify-center shadow-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-6 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <span>Админ</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-primary">
              {sidebarLinks.find((l) => l.id === activeTab)?.label}
            </span>
          </div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'leadership' && <LeadershipManager />}
            {activeTab === 'ministries' && <MinistryManager />}
            {activeTab === 'news' && <NewsManager />}
            {activeTab === 'amendments' && <AmendmentsManager />}
            {activeTab === 'roles' && <RoleManager />}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
