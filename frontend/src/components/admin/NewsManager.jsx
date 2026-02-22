import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Plus, Edit, Trash2, Upload, Calendar, Archive } from 'lucide-react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NewsManager = () => {
  const [news, setNews] = useState([]);
  const [archiveNews, setArchiveNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentNews, setCurrentNews] = useState(null);
  const [activeTab, setActiveTab] = useState('news');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    is_archive: false
  });

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
      toast.error('Ошибка загрузки новостей');
    } finally {
      setLoading(false);
    }
  };

  const currentList = activeTab === 'news' ? news : archiveNews;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const response = await axios.post(`${API}/upload`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, image: response.data.url });
      toast.success('Изображение загружено');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Ошибка загрузки изображения');
    }
  };

  const openCreateDialog = () => {
    setEditMode(false);
    setCurrentNews(null);
    setFormData({ title: '', content: '', image: '', is_archive: activeTab === 'archive' });
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditMode(true);
    setCurrentNews(item);
    setFormData({
      title: item.title,
      content: item.content,
      image: item.image || '',
      is_archive: item.is_archive || false
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode && currentNews) {
        await axios.put(`${API}/news/${currentNews.id}`, formData);
        toast.success('Новость обновлена');
      } else {
        await axios.post(`${API}/news`, formData);
        toast.success('Новость создана');
      }
      
      setDialogOpen(false);
      fetchNews();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить новость?')) return;
    
    try {
      await axios.delete(`${API}/news/${id}`);
      toast.success('Новость удалена');
      fetchNews();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div data-testid="news-manager">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl tracking-widest text-primary flex items-center gap-3">
            <Newspaper className="w-6 h-6" />
            НОВОСТИ
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Управление новостями и архивом
          </p>
        </div>
        <Button onClick={openCreateDialog} className="btn-gold" data-testid="add-news-btn">
          <Plus className="w-4 h-4 mr-2" />
          Добавить
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('news')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'news'
              ? 'bg-primary text-black'
              : 'bg-white/5 text-muted-foreground hover:text-white'
          }`}
        >
          <Newspaper className="w-4 h-4 inline mr-2" />
          Новости ({news.length})
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'archive'
              ? 'bg-primary text-black'
              : 'bg-white/5 text-muted-foreground hover:text-white'
          }`}
        >
          <Archive className="w-4 h-4 inline mr-2" />
          Архив штата ({archiveNews.length})
        </button>
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
      ) : currentList.length > 0 ? (
        <div className="grid gap-4">
          {currentList.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background-paper border border-white/10 rounded-lg p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {item.image && (
                    <img
                      src={item.image}
                      alt=""
                      className="w-20 h-20 object-cover rounded-lg shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </span>
                      {item.is_archive && (
                        <span className="px-2 py-0.5 bg-white/10 text-xs rounded">Архив</span>
                      )}
                    </div>
                    <h3 className="font-subheading text-lg text-white mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">{item.content}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(item)}
                    data-testid={`edit-news-${item.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-400"
                    data-testid={`delete-news-${item.id}`}
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
          {activeTab === 'archive' ? (
            <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          ) : (
            <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          )}
          <p className="text-muted-foreground">
            {activeTab === 'archive' ? 'Архив пуст' : 'Новостей не найдено'}
          </p>
          <Button onClick={openCreateDialog} className="mt-4 btn-outline-gold">
            <Plus className="w-4 h-4 mr-2" />
            Добавить {activeTab === 'archive' ? 'в архив' : 'новость'}
          </Button>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-background-paper border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-wider text-primary">
              {editMode ? 'Редактировать новость' : 'Новая новость'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Заголовок</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Заголовок новости"
                className="input-dark"
                required
                data-testid="news-title-input"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Содержание</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Текст новости..."
                className="input-dark min-h-[200px]"
                required
                data-testid="news-content-input"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Изображение</label>
              <div className="flex items-center gap-4">
                {formData.image ? (
                  <img src={formData.image} alt="" className="w-24 h-16 object-cover rounded-lg border border-white/10" />
                ) : (
                  <div className="w-24 h-16 rounded-lg bg-background border border-white/10 flex items-center justify-center">
                    <Newspaper className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <span className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-md text-sm transition-colors inline-flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Загрузить
                  </span>
                </label>
                {formData.image && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="text-red-500"
                  >
                    Удалить
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="is_archive"
                checked={formData.is_archive}
                onCheckedChange={(checked) => setFormData({ ...formData, is_archive: checked })}
                className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label htmlFor="is_archive" className="text-sm text-gray-300 cursor-pointer">
                Добавить в Архив штата
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" className="btn-gold" data-testid="save-news-btn">
                {editMode ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsManager;
