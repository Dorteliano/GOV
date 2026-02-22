import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, User, ChevronRight, Users } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Ministries = () => {
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    try {
      const response = await axios.get(`${API}/ministries`);
      setMinistries(response.data);
    } catch (error) {
      console.error('Failed to fetch ministries:', error);
    } finally {
      setLoading(false);
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
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen pt-20" data-testid="ministries-page">
      {/* Header */}
      <section className="py-16 px-6 sm:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-8 h-8 text-primary" />
              <h1 className="font-heading text-3xl sm:text-4xl tracking-widest text-white">МИНИСТЕРСТВА</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Структура и руководство правительственных органов штата San Andreas. 
              Каждое министерство отвечает за определённую сферу деятельности государства.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Ministries Grid */}
      <section className="py-16 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-background-paper rounded-md p-8 animate-pulse">
                  <div className="w-16 h-16 bg-white/5 rounded-lg mb-6" />
                  <div className="h-6 bg-white/5 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-white/5 rounded w-full mb-2" />
                  <div className="h-4 bg-white/5 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : ministries.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {ministries.map((ministry) => (
                <motion.div key={ministry.id} variants={itemVariants}>
                  <Link
                    to={`/ministries/${ministry.id}`}
                    data-testid={`ministry-card-${ministry.id}`}
                    className="block ministry-card bg-background-paper p-8 rounded-md border border-white/5 relative overflow-hidden group h-full"
                  >
                    {/* Ministry Logo */}
                    <div className="w-16 h-16 bg-background rounded-lg flex items-center justify-center mb-6 border border-white/10 group-hover:border-primary/30 transition-colors">
                      {ministry.logo ? (
                        <img
                          src={ministry.logo}
                          alt={ministry.name}
                          className="w-12 h-12 object-contain img-desaturate"
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-primary" />
                      )}
                    </div>

                    {/* Ministry Info */}
                    <h3 className="font-subheading text-xl text-white mb-3 group-hover:text-primary transition-colors">
                      {ministry.name}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-6">
                      {ministry.description}
                    </p>

                    {/* Minister Info */}
                    {ministry.minister && (
                      <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                        {ministry.minister.photo ? (
                          <img
                            src={ministry.minister.photo}
                            alt={ministry.minister.name}
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-white/10">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-white">{ministry.minister.name}</p>
                          <p className="text-xs text-muted-foreground">Министр</p>
                        </div>
                      </div>
                    )}

                    {/* Staff count */}
                    {ministry.staff && ministry.staff.length > 0 && (
                      <div className="flex items-center gap-2 mt-4 text-muted-foreground text-xs">
                        <Users className="w-4 h-4" />
                        <span>{ministry.staff.length} сотрудников</span>
                      </div>
                    )}

                    <ChevronRight className="absolute bottom-8 right-8 w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-50" />
              <h3 className="font-subheading text-xl text-white mb-3">Министерства не найдены</h3>
              <p className="text-muted-foreground">Информация о министерствах скоро будет добавлена</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Ministries;
