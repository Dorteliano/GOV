import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// New logo from user
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_dark-gov-agency/artifacts/ezxmaarb_image%20%285%29.png';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const navLinks = [
    { path: '/', label: 'Главная' },
    { path: '/ministries', label: 'Министерства' },
    { path: '/news', label: 'Новости' },
    { path: '/amendments', label: 'Поправки Сената' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" data-testid="header-logo">
            <img 
              src={LOGO_URL} 
              alt="Seattle Government" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="font-heading text-lg tracking-widest text-primary">SEATTLE</h1>
              <p className="text-xs tracking-wider text-muted-foreground">GOVERNMENT</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`nav-link-${link.path.replace('/', '') || 'home'}`}
                className={`relative py-2 text-sm font-medium tracking-wide transition-colors ${
                  isActive(link.path) ? 'text-primary' : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
            <Link
              to={isAuthenticated ? '/admin' : '/login'}
              data-testid="nav-admin-btn"
              className="px-6 py-2 btn-outline-gold rounded-sm text-sm"
            >
              {isAuthenticated ? 'Админ' : 'Войти'}
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10"
          >
            <nav className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2 text-lg font-medium ${
                    isActive(link.path) ? 'text-primary' : 'text-gray-300'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to={isAuthenticated ? '/admin' : '/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="mt-4 px-6 py-3 btn-gold rounded-sm text-center"
              >
                {isAuthenticated ? 'Админ-панель' : 'Войти'}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
