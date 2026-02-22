import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_dark-gov-agency/artifacts/ezxmaarb_image%20%285%29.png';

const Footer = () => {
  return (
    <footer className="bg-background-paper border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img 
                src={LOGO_URL} 
                alt="Seattle Government" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h2 className="font-heading text-xl tracking-widest text-primary">SEATTLE</h2>
                <p className="text-xs tracking-wider text-muted-foreground">GOVERNMENT</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Официальный портал Правительства штата Seattle. 
              Служим народу штата с честью и достоинством.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-subheading text-lg text-white mb-6">Навигация</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/ministries" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Министерства
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Новости
                </Link>
              </li>
              <li>
                <Link to="/amendments" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Поправки Сената
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 Правительство штата Seattle. Все права защищены.
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            SEATTLE STATE GOVERNMENT
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
