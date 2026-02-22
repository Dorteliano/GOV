import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Building2, Newspaper, Scale, ChevronRight, Star, Users } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Home = () => {
  const [news, setNews] = useState([]);
  const [ministries, setMinistries] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [newsRes, ministriesRes] = await Promise.all([
        axios.get(`${API}/news`),
        axios.get(`${API}/ministries`)
      ]);
      setNews(newsRes.data.slice(0, 3));
      setMinistries(ministriesRes.data.slice(0, 4));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center hero-bg">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative z-10 text-center px-6 max-w-4xl mx-auto"
        >
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Shield className="w-24 h-24 text-primary" />
              <Star className="w-8 h-8 text-primary absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-widest text-white mb-6">
            <span className="gold-shine">GOVERNMENT</span>
          </h1>
          <h2 className="font-subheading text-xl sm:text-2xl text-gray-300 mb-4">
            MAJESTIC ROLEPLAY
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
            Официальный портал Правительства штата San Andreas. 
            Служим народу с честью и достоинством.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/ministries"
              data-testid="hero-ministries-btn"
              className="px-8 py-4 btn-gold rounded-sm inline-flex items-center justify-center gap-2"
            >
              <Building2 className="w-5 h-5" />
              Министерства
            </Link>
            <Link
              to="/legislation"
              data-testid="hero-legislation-btn"
              className="px-8 py-4 btn-outline-gold rounded-sm inline-flex items-center justify-center gap-2"
            >
              <Scale className="w-5 h-5" />
              Законодательство
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
          </div>
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-6 sm:px-8 bg-background-paper">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="font-heading text-3xl tracking-widest text-primary mb-6">НАША МИССИЯ</h2>
            <p className="text-lg text-gray-300 leading-relaxed font-subheading italic">
              "Обеспечение благополучия и безопасности граждан штата San Andreas, 
              поддержание закона и порядка, развитие экономики и социальной инфраструктуры 
              для процветания нашего общества."
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
          >
            {[
              { icon: Building2, label: 'Министерств', value: ministries.length || '—' },
              { icon: Users, label: 'Сотрудников', value: '50+' },
              { icon: Scale, label: 'Законов', value: '100+' },
              { icon: Shield, label: 'Лет службы', value: '3+' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="glass p-6 rounded-lg text-center"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                <p className="font-heading text-3xl text-white mb-2">{stat.value}</p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="py-24 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-heading text-2xl tracking-widest text-primary">ПОСЛЕДНИЕ НОВОСТИ</h2>
              <p className="text-muted-foreground mt-2">Актуальные события правительства</p>
            </div>
            <Link
              to="/news"
              data-testid="view-all-news-btn"
              className="hidden sm:flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
            >
              Все новости <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {news.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-6"
            >
              {news.map((item, idx) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  className="news-card bg-background-paper p-6 rounded-md"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Newspaper className="w-4 h-4 text-primary" />
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <h3 className="font-subheading text-lg text-white mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-3">{item.content}</p>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Новости скоро появятся</p>
            </div>
          )}

          <Link
            to="/news"
            className="sm:hidden flex items-center justify-center gap-2 mt-8 text-primary"
          >
            Все новости <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-24 px-6 sm:px-8 bg-background-paper">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { 
                icon: Building2, 
                title: 'Министерства', 
                desc: 'Структура и руководство правительственных органов',
                link: '/ministries'
              },
              { 
                icon: Newspaper, 
                title: 'Новости', 
                desc: 'Последние события и объявления правительства',
                link: '/news'
              },
              { 
                icon: Scale, 
                title: 'Законодательство', 
                desc: 'Законы, указы и нормативные акты штата',
                link: '/legislation'
              },
            ].map((item, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Link
                  to={item.link}
                  data-testid={`quick-link-${item.link.replace('/', '')}`}
                  className="block ministry-card bg-background p-8 rounded-md border border-white/5 relative overflow-hidden group"
                >
                  <item.icon className="w-10 h-10 text-primary mb-6 transition-transform group-hover:scale-110" />
                  <h3 className="font-subheading text-xl text-white mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                  <ChevronRight className="absolute bottom-8 right-8 w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
