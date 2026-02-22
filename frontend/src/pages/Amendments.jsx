import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Calendar, Search, FileText, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { formatDate } from '../lib/utils';
import { Input } from '../components/ui/input';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Amendments = () => {
  const [amendments, setAmendments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAmendment, setSelectedAmendment] = useState(null);

  useEffect(() => {
    fetchAmendments();
  }, []);

  const fetchAmendments = async () => {
    try {
      const response = await axios.get(`${API}/amendments`);
      setAmendments(response.data);
    } catch (error) {
      console.error('Failed to fetch amendments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAmendments = amendments.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const isPassed = status.toLowerCase() === 'принято' || status.toLowerCase() === 'passed';
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium ${
          isPassed ? 'badge-signed' : 'badge-pending'
        }`}
      >
        {isPassed ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <Clock className="w-3 h-3" />
        )}
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen pt-20" data-testid="amendments-page">
      {/* Header */}
      <section className="py-16 px-6 sm:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-8 h-8 text-primary" />
              <h1 className="font-heading text-3xl sm:text-4xl tracking-widest text-white">ПОПРАВКИ СЕНАТА</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Последние поправки принятые Сенатом штата Seattle.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search & Table */}
      <section className="py-16 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск по номеру или названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 input-dark font-mono"
                data-testid="amendments-search"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Table */}
            <div className="lg:col-span-2 overflow-x-auto">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-background-paper rounded-md p-6 animate-pulse">
                      <div className="h-4 bg-white/5 rounded w-24 mb-3" />
                      <div className="h-5 bg-white/5 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : filteredAmendments.length > 0 ? (
                <div className="bg-background-paper rounded-lg border border-white/10 overflow-hidden">
                  <table className="w-full table-dark">
                    <thead>
                      <tr>
                        <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase tracking-wider">
                          № Поправки
                        </th>
                        <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase tracking-wider">
                          Название
                        </th>
                        <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                          Дата
                        </th>
                        <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase tracking-wider">
                          Статус
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAmendments.map((item) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => setSelectedAmendment(item)}
                          className={`cursor-pointer transition-colors ${
                            selectedAmendment?.id === item.id ? 'bg-primary/5' : 'hover:bg-white/5'
                          }`}
                          data-testid={`amendment-row-${item.id}`}
                        >
                          <td className="p-4">
                            <span className="font-mono text-primary">{item.number}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-white">{item.title}</span>
                          </td>
                          <td className="p-4 hidden sm:table-cell">
                            <span className="font-mono text-sm text-muted-foreground">
                              {formatDate(item.created_at)}
                            </span>
                          </td>
                          <td className="p-4">{getStatusBadge(item.status)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20">
                  <Scale className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-50" />
                  <h3 className="font-subheading text-xl text-white mb-3">
                    {searchQuery ? 'Ничего не найдено' : 'Поправок пока нет'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? 'Попробуйте изменить поисковый запрос'
                      : 'Поправки Сената скоро появятся'}
                  </p>
                </div>
              )}
            </div>

            {/* Selected Amendment Detail */}
            <div className="lg:col-span-1">
              {selectedAmendment ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={selectedAmendment.id}
                  className="sticky top-28 bg-background-paper border border-white/10 rounded-lg p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-mono text-primary">{selectedAmendment.number}</span>
                  </div>
                  
                  <h2 className="font-subheading text-xl text-white mb-4">{selectedAmendment.title}</h2>
                  
                  <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{formatDate(selectedAmendment.created_at)}</span>
                    </div>
                    {getStatusBadge(selectedAmendment.status)}
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <h4 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-3">
                      Содержание
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedAmendment.content}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="sticky top-28 bg-background-paper border border-white/10 rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground text-sm">
                    Выберите поправку для просмотра
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

export default Amendments;
