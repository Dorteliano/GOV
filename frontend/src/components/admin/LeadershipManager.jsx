import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash2, Upload, Mail, CreditCard, Clock } from 'lucide-react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';
import { formatDate, calculateDaysInPosition } from '../../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LeadershipManager = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentLeader, setCurrentLeader] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    position: '',
    photo: '',
    email: '',
    passport_number: '',
    appointed_date: new Date().toISOString().split('T')[0],
    order: 0
  });

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    try {
      const response = await axios.get(`${API}/leadership`);
      setLeaders(response.data);
    } catch (error) {
      console.error('Failed to fetch leaders:', error);
      toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const response = await axios.post(`${API}/upload`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, photo: response.data.url });
      toast.success('Фото загружено');
    } catch (error) {
      toast.error('Ошибка загрузки фото');
    }
  };

  const openCreateDialog = () => {
    setEditMode(false);
    setCurrentLeader(null);
    setFormData({
      name: '',
      surname: '',
      position: '',
      photo: '',
      email: '',
      passport_number: '',
      appointed_date: new Date().toISOString().split('T')[0],
      order: leaders.length
    });
    setDialogOpen(true);
  };

  const openEditDialog = (leader) => {
    setEditMode(true);
    setCurrentLeader(leader);
    setFormData({
      name: leader.name,
      surname: leader.surname,
      position: leader.position,
      photo: leader.photo || '',
      email: leader.email || '',
      passport_number: leader.passport_number || '',
      appointed_date: leader.appointed_date?.split('T')[0] || '',
      order: leader.order || 0
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode && currentLeader) {
        await axios.put(`${API}/leadership/${currentLeader.id}`, formData);
        toast.success('Данные обновлены');
      } else {
        await axios.post(`${API}/leadership`, formData);
        toast.success('Руководитель добавлен');
      }
      
      setDialogOpen(false);
      fetchLeaders();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить руководителя?')) return;
    
    try {
      await axios.delete(`${API}/leadership/${id}`);
      toast.success('Удалено');
      fetchLeaders();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div data-testid="leadership-manager">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl tracking-widest text-primary flex items-center gap-3">
            <Users className="w-6 h-6" />
            РУКОВОДСТВО ШТАТА
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Губернатор и его команда
          </p>
        </div>
        <Button onClick={openCreateDialog} className="btn-gold" data-testid="add-leader-btn">
          <Plus className="w-4 h-4 mr-2" />
          Добавить
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-background-paper rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-white/5 rounded w-1/3 mb-3" />
              <div className="h-4 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : leaders.length > 0 ? (
        <div className="grid gap-4">
          {leaders.map((leader) => (
            <motion.div
              key={leader.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background-paper border border-white/10 rounded-lg p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-background flex items-center justify-center border border-white/10 overflow-hidden">
                    {leader.photo ? (
                      <img src={leader.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-primary font-mono">{leader.position}</span>
                    <h3 className="font-subheading text-lg text-white">
                      {leader.name} {leader.surname}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      {leader.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {leader.email}
                        </span>
                      )}
                      {leader.passport_number && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" /> {leader.passport_number}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary" />
                        <span className="text-primary">{calculateDaysInPosition(leader.appointed_date)} дней</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(leader)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(leader.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-background-paper rounded-lg border border-white/10">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Руководство не добавлено</p>
          <Button onClick={openCreateDialog} className="mt-4 btn-outline-gold">
            <Plus className="w-4 h-4 mr-2" />
            Добавить первого
          </Button>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-background-paper border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-wider text-primary">
              {editMode ? 'Редактировать' : 'Добавить руководителя'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Имя</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Имя"
                  className="input-dark"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Фамилия</label>
                <Input
                  value={formData.surname}
                  onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  placeholder="Фамилия"
                  className="input-dark"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Должность</label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Губернатор, Вице-губернатор..."
                className="input-dark"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@gov.seattle"
                  className="input-dark"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">№ Паспорта</label>
                <Input
                  value={formData.passport_number}
                  onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                  placeholder="123456"
                  className="input-dark"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Дата назначения</label>
                <Input
                  type="date"
                  value={formData.appointed_date}
                  onChange={(e) => setFormData({ ...formData, appointed_date: e.target.value })}
                  className="input-dark"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Порядок (0 = первый)</label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="input-dark"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Фото</label>
              <div className="flex items-center gap-4">
                {formData.photo ? (
                  <img src={formData.photo} alt="" className="w-16 h-16 object-cover rounded-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-background border border-white/10 flex items-center justify-center">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <span className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-md text-sm transition-colors inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Загрузить
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" className="btn-gold">
                {editMode ? 'Сохранить' : 'Добавить'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadershipManager;
