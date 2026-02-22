import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scale, Plus, Edit, Trash2, FileText, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AmendmentsManager = () => {
  const [amendments, setAmendments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAmendment, setCurrentAmendment] = useState(null);
  
  const [formData, setFormData] = useState({
    number: '',
    title: '',
    content: '',
    status: 'Принято'
  });

  useEffect(() => {
    fetchAmendments();
  }, []);

  const fetchAmendments = async () => {
    try {
      const response = await axios.get(`${API}/amendments`);
      setAmendments(response.data);
    } catch (error) {
      console.error('Failed to fetch amendments:', error);
      toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditMode(false);
    setCurrentAmendment(null);
    setFormData({
      number: '',
      title: '',
      content: '',
      status: 'Принято'
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditMode(true);
    setCurrentAmendment(item);
    setFormData({
      number: item.number,
      title: item.title,
      content: item.content,
      status: item.status
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode && currentAmendment) {
        await axios.put(`${API}/amendments/${currentAmendment.id}`, formData);
        toast.success('Поправка обновлена');
      } else {
        await axios.post(`${API}/amendments`, formData);
        toast.success('Поправка добавлена');
      }
      
      setDialogOpen(false);
      fetchAmendments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить поправку?')) return;
    
    try {
      await axios.delete(`${API}/amendments/${id}`);
      toast.success('Поправка удалена');
      fetchAmendments();
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const getStatusBadge = (status) => {
    const isPassed = status.toLowerCase() === 'принято';
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium ${
        isPassed ? 'badge-signed' : 'badge-pending'
      }`}>
        {isPassed ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
        {status}
      </span>
    );
  };

  return (
    <div data-testid="amendments-manager">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl tracking-widest text-primary flex items-center gap-3">
            <Scale className="w-6 h-6" />
            ПОПРАВКИ СЕНАТА
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Последние поправки принятые Сенатом
          </p>
        </div>
        <Button onClick={openCreateDialog} className="btn-gold" data-testid="add-amendment-btn">
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
      ) : amendments.length > 0 ? (
        <div className="grid gap-4">
          {amendments.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background-paper border border-white/10 rounded-lg p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center border border-white/10 shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-mono text-primary">{item.number}</span>
                      {getStatusBadge(item.status)}
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <h3 className="font-subheading text-lg text-white mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">{item.content}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
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
          <Scale className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Поправок не найдено</p>
          <Button onClick={openCreateDialog} className="mt-4 btn-outline-gold">
            <Plus className="w-4 h-4 mr-2" />
            Добавить первую
          </Button>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-background-paper border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-wider text-primary">
              {editMode ? 'Редактировать поправку' : 'Новая поправка'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Номер поправки</label>
                <Input
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="№ 001-2024"
                  className="input-dark font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Статус</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="input-dark">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background-paper border-white/10">
                    <SelectItem value="Принято">Принято</SelectItem>
                    <SelectItem value="На рассмотрении">На рассмотрении</SelectItem>
                    <SelectItem value="Отклонено">Отклонено</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Название</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Название поправки"
                className="input-dark"
                required
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Содержание</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Текст поправки..."
                className="input-dark min-h-[200px]"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" className="btn-gold">
                {editMode ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AmendmentsManager;
