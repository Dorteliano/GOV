import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, User, ArrowLeft, Calendar, Phone, Users, Clock } from 'lucide-react';
import axios from 'axios';
import { calculateDaysInPosition, formatDate } from '../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MinistryDetail = () => {
  const { id } = useParams();
  const [ministry, setMinistry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMinistry();
  }, [id]);

  const fetchMinistry = async () => {
    try {
      const response = await axios.get(`${API}/ministries/${id}`);
      setMinistry(response.data);
    } catch (error) {
      console.error('Failed to fetch ministry:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!ministry) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center text-center px-6">
        <Building2 className="w-16 h-16 text-muted-foreground mb-6" />
        <h2 className="font-heading text-2xl text-white mb-4">Министерство не найдено</h2>
        <Link to="/ministries" className="text-primary hover:underline">
          Вернуться к списку министерств
        </Link>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen pt-20" data-testid="ministry-detail-page">
      {/* Header */}
      <section className="py-16 px-6 sm:px-8 border-b border-white/5 bg-background-paper">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/ministries"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Все министерства
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row gap-8 items-start"
          >
            {/* Logo */}
            <div className="w-24 h-24 bg-background rounded-lg flex items-center justify-center border border-white/10 shrink-0">
              {ministry.logo ? (
                <img src={ministry.logo} alt={ministry.name} className="w-16 h-16 object-contain" />
              ) : (
                <Building2 className="w-12 h-12 text-primary" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="font-heading text-2xl sm:text-3xl tracking-widest text-white mb-4">
                {ministry.name}
              </h1>
              <p className="text-muted-foreground leading-relaxed">{ministry.description}</p>
              
              {ministry.contact_info && (
                <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm">{ministry.contact_info}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Chain of Command */}
      <section className="py-16 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-xl tracking-widest text-primary mb-8">РУКОВОДСТВО</h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Minister */}
            {ministry.minister && (
              <motion.div variants={itemVariants}>
                <div className="bg-background-paper border border-primary/30 rounded-lg p-8">
                  <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    {/* Photo */}
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-background border border-white/10 shrink-0">
                      {ministry.minister.photo ? (
                        <img
                          src={ministry.minister.photo}
                          alt={ministry.minister.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-16 h-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="text-center md:text-left flex-1">
                      <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-bold tracking-wider rounded-sm mb-3">
                        МИНИСТР
                      </span>
                      <h3 className="font-subheading text-2xl text-white mb-2">{ministry.minister.name}</h3>
                      
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                        {ministry.minister.appointed_date && (
                          <>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span>с {formatDate(ministry.minister.appointed_date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-primary" />
                              <span className="font-mono text-primary">
                                {calculateDaysInPosition(ministry.minister.appointed_date)} дней
                              </span>
                              <span>в должности</span>
                            </div>
                          </>
                        )}
                        {ministry.minister.contact && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-primary" />
                            <span>{ministry.minister.contact}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Deputies */}
            {ministry.minister?.deputies && ministry.minister.deputies.length > 0 && (
              <div>
                <h3 className="font-subheading text-lg text-white mb-6">Заместители министра</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {ministry.minister.deputies.map((deputy, idx) => (
                    <motion.div
                      key={deputy.id || idx}
                      variants={itemVariants}
                      className="bg-background-paper border border-white/10 rounded-lg p-6 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-background border border-white/10 shrink-0">
                          {deputy.photo ? (
                            <img
                              src={deputy.photo}
                              alt={deputy.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-xs text-primary font-mono">ЗАМЕСТИТЕЛЬ #{idx + 1}</span>
                          <h4 className="font-subheading text-white">{deputy.name}</h4>
                        </div>
                      </div>

                      {deputy.position && (
                        <p className="text-sm text-muted-foreground mb-3">{deputy.position}</p>
                      )}

                      {deputy.appointed_date && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-white/5">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-primary" />
                            <span className="font-mono text-primary">
                              {calculateDaysInPosition(deputy.appointed_date)} дней
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Staff */}
            {ministry.staff && ministry.staff.length > 0 && (
              <motion.div variants={itemVariants} className="mt-12">
                <h3 className="font-subheading text-lg text-white mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Состав министерства
                </h3>
                <div className="bg-background-paper border border-white/10 rounded-lg p-6">
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {ministry.staff.map((member, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-background rounded-md border border-white/5"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm text-gray-300">{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default MinistryDetail;
