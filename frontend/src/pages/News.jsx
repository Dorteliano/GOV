import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Calendar, ChevronRight, Archive } from 'lucide-react';
import axios from 'axios';
import { formatDate } from '../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const News = () => {
  const [news, setNews] = useState([]);
  const [archiveNews, setArchiveNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [activeTab, setActiveTab] = useState('news');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const [newsRes, archiveRes] = await Promise.all([
        axios.get(`${API}/news?archive=false`),
        axios.get(`${API}/news?archive=true`)
      ]);
      setNews(newsRes.data);
      setArchiveNews(archiveRes.data);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentNews = activeTab === 'news' ? news : archiveNews;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen pt-20" data-testid="news-page">
      {/* Header */}
      <section className="py-16 px-6 sm:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Newspaper className="w-8 h-8 text-primary" />
              <h1 className="font-heading text-3xl sm:text-4xl tracking-widest text-white">НОВОСТИ</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Актуальные события, объявления и новости правительства штата Seattle.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-6 sm:px-8 pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => { setActiveTab('news'); setSelectedNews(null); }}
              className={`px-6 py-3 rounded-sm font-medium transition-colors ${
                activeTab === 'news'
                  ? 'bg-primary text-black'
                  : 'bg-white/5 text-muted-foreground hover:text-white'
              }`}
            >
              <Newspaper className="w-4 h-4 inline mr-2" />
              Новости ({news.length})
            </button>
            <button
              onClick={() => { setActiveTab('archive'); setSelectedNews(null); }}
              className={`px-6 py-3 rounded-sm font-medium transition-colors ${
                activeTab === 'archive'
                  ? 'bg-primary text-black'
                  : 'bg-white/5 text-muted-foreground hover:text-white'
              }`}
            >
              <Archive className="w-4 h-4 inline mr-2" />
              Архив штата ({archiveNews.length})
            </button>
          </div>
        </div>
      </section>

      {/* News List */}
      <section className="py-8 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* News List */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-background-paper rounded-md p-6 animate-pulse">
                      <div className="h-4 bg-white/5 rounded w-32 mb-4" />
                      <div className="h-6 bg-white/5 rounded w-3/4 mb-3" />
                      <div className="h-4 bg-white/5 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : currentNews.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {currentNews.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      onClick={() => setSelectedNews(item)}
                      className={`news-card bg-background-paper p-6 rounded-md cursor-pointer ${
                        selectedNews?.id === item.id ? 'border-l-primary bg-white/5' : ''
                      }`}
                      data-testid={`news-item-${item.id}`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatDate(item.created_at)}
                        </span>
                        {item.is_archive && (
                          <span className="px-2 py-0.5 bg-white/10 text-xs rounded">Архив</span>
                        )}
                      </div>
                      <h3 className="font-subheading text-lg text-white mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">{item.content}</p>
                      <div className="flex items-center gap-1 mt-4 text-primary text-sm">
                        <span>Читать далее</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-20">
                  {activeTab === 'archive' ? (
                    <Archive className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-50" />
                  ) : (
                    <Newspaper className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-50" />
                  )}
                  <h3 className="font-subheading text-xl text-white mb-3">
                    {activeTab === 'archive' ? 'Архив пуст' : 'Новостей пока нет'}
                  </h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'archive' ? 'Документы архива скоро появятся' : 'Новости скоро появятся'}
                  </p>
                </div>
              )}
            </div>

            {/* Selected News Detail */}
            <div className="lg:col-span-1">
              {selectedNews ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={selectedNews.id}
                  className="sticky top-28 bg-background-paper border border-white/10 rounded-lg overflow-hidden"
                >
                  {selectedNews.image && (
                    <img
                      src={selectedNews.image}
                      alt={selectedNews.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatDate(selectedNews.created_at)}
                      </span>
                    </div>
                    <h2 className="font-subheading text-xl text-white mb-4">{selectedNews.title}</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedNews.content}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="sticky top-28 bg-background-paper border border-white/10 rounded-lg p-8 text-center">
                  <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground text-sm">
                    Выберите новость для просмотра
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default News;
