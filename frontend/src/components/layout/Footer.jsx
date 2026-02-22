import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Star, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-background-paper border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <Shield className="w-10 h-10 text-primary" />
                <Star className="w-4 h-4 text-primary absolute -top-1 -right-1" />
              </div>
              <div>
                <h2 className="font-heading text-xl tracking-widest text-primary">MAJESTIC</h2>
                <p className="text-xs tracking-wider text-muted-foreground">GOVERNMENT</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Официальный портал Правительства Majestic Roleplay. 
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
                <Link to="/legislation" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Законодательство
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-subheading text-lg text-white mb-6">Контакты</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                Los Santos, Штат San Andreas
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 text-primary" />
                +1 (555) GOV-MRPL
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail className="w-4 h-4 text-primary" />
                gov@majestic-rp.com
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 Majestic Roleplay Government. Все права защищены.
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            GTA V ROLEPLAY • MAJESTIC RP
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
