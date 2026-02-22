import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Newspaper, Scale, ChevronRight, Users, Mail, Clock, CreditCard } from 'lucide-react';
import axios from 'axios';
import { calculateDaysInPosition } from '../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Emblem and logo
const EMBLEM_URL = 'https://customer-assets.emergentagent.com/job_dark-gov-agency/artifacts/wn1znkuf_image.png';

const Home = () => {
  const [news, setNews] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [leadership, setLeadership] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [newsRes, ministriesRes, leadershipRes] = await Promise.all([
        axios.get(`${API}/news`),
        axios.get(`${API}/ministries`),
        axios.get(`${API}/leadership`)
      ]);
      setNews(newsRes.data.slice(0, 3));
      setMinistries(ministriesRes.data.slice(0, 4));
      setLeadership(leadershipRes.data);
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
      <section className="relative min-h-screen flex items-center justify-center bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background-paper/20 to-background" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative z-10 text-center px-6 max-w-4xl mx-auto"
        >
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-widest text-white mb-6">
            <span className="gold-shine">ПРАВИТЕЛЬСТВО</span>
          </h1>
          <h2 className="font-subheading text-xl sm:text-2xl text-gray-300 mb-4">
            ШТАТА SEATTLE
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
            Официальный портал Правительства штата Seattle. 
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
              to="/amendments"
              data-testid="hero-legislation-btn"
              className="px-8 py-4 btn-outline-gold rounded-sm inline-flex items-center justify-center gap-2"
            >
              <Scale className="w-5 h-5" />
              Поправки Сената
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

      {/* Leadership Section */}
      <section className="py-24 px-6 sm:px-8 bg-background-paper">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl tracking-widest text-primary mb-4">РУКОВОДСТВО ШТАТА</h2>
            <p className="text-muted-foreground">Губернатор и его команда</p>
          </motion.div>

          {leadership.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {leadership.map((leader, idx) => (
                <motion.div
                  key={leader.id}
                  variants={itemVariants}
                  className={`bg-background border border-white/10 rounded-lg p-6 hover:border-primary/30 transition-colors ${
                    idx === 0 ? 'md:col-span-2 lg:col-span-1 lg:row-span-1' : ''
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Photo */}
                    <div className={`${idx === 0 ? 'w-32 h-32' : 'w-24 h-24'} rounded-lg overflow-hidden bg-background-paper border border-white/10 mb-4`}>
                      {leader.photo ? (
                        <img
                          src={leader.photo}
                          alt={`${leader.name} ${leader.surname}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Position */}
                    <span className={`inline-block px-3 py-1 ${idx === 0 ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'} text-xs font-bold tracking-wider rounded-sm mb-3`}>
                      {leader.position}
                    </span>

                    {/* Name */}
                    <h3 className="font-subheading text-xl text-white mb-4">
                      {leader.name} {leader.surname}
                    </h3>

                    {/* Info */}
                    <div className="space-y-2 text-sm">
                      {leader.email && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4 text-primary" />
                          <span>{leader.email}</span>
                        </div>
                      )}
                      {leader.passport_number && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <CreditCard className="w-4 h-4 text-primary" />
                          <span>Паспорт: {leader.passport_number}</span>
                        </div>
                      )}
                      {leader.appointed_date && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-mono text-primary">
                            {calculateDaysInPosition(leader.appointed_date)} дней
                          </span>
                          <span>в должности</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Информация о руководстве скоро появится</p>
            </div>
          )}
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-6 sm:px-8">
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
              "Обеспечение благополучия и безопасности граждан штата Seattle, 
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
              { icon: Users, label: 'Руководителей', value: leadership.length || '—' },
              { icon: Scale, label: 'Поправок', value: '—' },
              { icon: Newspaper, label: 'Новостей', value: news.length || '—' },
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
      <section className="py-24 px-6 sm:px-8 bg-background-paper">
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
                  className="news-card bg-background p-6 rounded-md"
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
      <section className="py-24 px-6 sm:px-8">
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
                title: 'Поправки Сената', 
                desc: 'Последние поправки принятые Сенатом',
                link: '/amendments'
              },
            ].map((item, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Link
                  to={item.link}
                  data-testid={`quick-link-${item.link.replace('/', '')}`}
                  className="block ministry-card bg-background-paper p-8 rounded-md border border-white/5 relative overflow-hidden group"
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
