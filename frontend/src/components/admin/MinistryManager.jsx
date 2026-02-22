import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Plus, Edit, Trash2, User, X, Upload, Calendar
} from 'lucide-react';
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
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MinistryManager = () => {
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMinistry, setCurrentMinistry] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    contact_info: '',
    minister: null,
    staff: []
  });

  useEffect(() => {
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    try {
      const response = await axios.get(`${API}/ministries`);
      setMinistries(response.data);
    } catch (error) {
      console.error('Failed to fetch ministries:', error);
      toast.error('Ошибка загрузки министерств');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e, field, deputyIndex = null) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const response = await axios.post(`${API}/upload`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (field === 'logo') {
        setFormData({ ...formData, logo: response.data.url });
      } else if (field === 'minister_photo') {
        setFormData({
          ...formData,
          minister: { ...formData.minister, photo: response.data.url }
        });
      } else if (field === 'deputy_photo' && deputyIndex !== null) {
        const deputies = [...(formData.minister?.deputies || [])];
        deputies[deputyIndex] = { ...deputies[deputyIndex], photo: response.data.url };
        setFormData({
          ...formData,
          minister: { ...formData.minister, deputies }
        });
      }
      toast.success('Изображение загружено');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Ошибка загрузки изображения');
    }
  };

  const openCreateDialog = () => {
    setEditMode(false);
    setCurrentMinistry(null);
    setFormData({
      name: '',
      description: '',
      logo: '',
      contact_info: '',
      minister: {
        name: '',
        photo: '',
        appointed_date: new Date().toISOString().split('T')[0],
        contact: '',
        deputies: [
          { name: '', photo: '', position: '', appointed_date: new Date().toISOString().split('T')[0], contact: '' },
          { name: '', photo: '', position: '', appointed_date: new Date().toISOString().split('T')[0], contact: '' },
          { name: '', photo: '', position: '', appointed_date: new Date().toISOString().split('T')[0], contact: '' }
        ]
      },
      staff: []
    });
    setDialogOpen(true);
  };

  const openEditDialog = (ministry) => {
    setEditMode(true);
    setCurrentMinistry(ministry);
    
    // Ensure we have 3 deputies
    let deputies = ministry.minister?.deputies || [];
    while (deputies.length < 3) {
      deputies.push({ name: '', photo: '', position: '', appointed_date: new Date().toISOString().split('T')[0], contact: '' });
    }
    
    setFormData({
      name: ministry.name,
      description: ministry.description,
      logo: ministry.logo || '',
      contact_info: ministry.contact_info || '',
      minister: ministry.minister ? {
        ...ministry.minister,
        deputies
      } : {
        name: '',
        photo: '',
        appointed_date: new Date().toISOString().split('T')[0],
        contact: '',
        deputies
      },
      staff: ministry.staff || []
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Clean up empty deputies
      const cleanedMinister = formData.minister ? {
        ...formData.minister,
        deputies: formData.minister.deputies.filter(d => d.name.trim() !== '')
      } : null;

      const payload = {
        ...formData,
        minister: cleanedMinister
      };

      if (editMode && currentMinistry) {
        await axios.put(`${API}/ministries/${currentMinistry.id}`, payload);
        toast.success('Министерство обновлено');
      } else {
        await axios.post(`${API}/ministries`, payload);
        toast.success('Министерство создано');
      }
      
      setDialogOpen(false);
      fetchMinistries();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить министерство?')) return;
    
    try {
      await axios.delete(`${API}/ministries/${id}`);
      toast.success('Министерство удалено');
      fetchMinistries();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Ошибка удаления');
    }
  };

  const updateMinisterField = (field, value) => {
    setFormData({
      ...formData,
      minister: { ...formData.minister, [field]: value }
    });
  };

  const updateDeputyField = (index, field, value) => {
    const deputies = [...(formData.minister?.deputies || [])];
    deputies[index] = { ...deputies[index], [field]: value };
    setFormData({
      ...formData,
      minister: { ...formData.minister, deputies }
    });
  };

  const addStaffMember = () => {
    setFormData({
      ...formData,
      staff: [...formData.staff, '']
    });
  };

  const updateStaffMember = (index, value) => {
    const staff = [...formData.staff];
    staff[index] = value;
    setFormData({ ...formData, staff });
  };

  const removeStaffMember = (index) => {
    const staff = formData.staff.filter((_, i) => i !== index);
    setFormData({ ...formData, staff });
  };

  return (
    <div data-testid="ministry-manager">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl tracking-widest text-primary flex items-center gap-3">
            <Building2 className="w-6 h-6" />
            МИНИСТЕРСТВА
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Управление министерствами и руководством
          </p>
        </div>
        <Button onClick={openCreateDialog} className="btn-gold" data-testid="add-ministry-btn">
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
      ) : ministries.length > 0 ? (
        <div className="grid gap-4">
          {ministries.map((ministry) => (
            <motion.div
              key={ministry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background-paper border border-white/10 rounded-lg p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center border border-white/10">
                    {ministry.logo ? (
                      <img src={ministry.logo} alt="" className="w-8 h-8 object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-subheading text-lg text-white">{ministry.name}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-1">{ministry.description}</p>
                    {ministry.minister && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>Министр: {ministry.minister.name}</span>
                        {ministry.minister.deputies?.length > 0 && (
                          <span className="text-primary">
                            • {ministry.minister.deputies.length} зам.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(ministry)}
                    data-testid={`edit-ministry-${ministry.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(ministry.id)}
                    className="text-red-500 hover:text-red-400"
                    data-testid={`delete-ministry-${ministry.id}`}
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
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Министерства не найдены</p>
          <Button onClick={openCreateDialog} className="mt-4 btn-outline-gold">
            <Plus className="w-4 h-4 mr-2" />
            Добавить первое
          </Button>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-background-paper border-white/10 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-wider text-primary">
              {editMode ? 'Редактировать министерство' : 'Новое министерство'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Название</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Министерство..."
                    className="input-dark"
                    required
                    data-testid="ministry-name-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Контакты</label>
                  <Input
                    value={formData.contact_info}
                    onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                    placeholder="Телефон или email"
                    className="input-dark"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Логотип</label>
                <div className="flex items-center gap-4">
                  {formData.logo ? (
                    <img src={formData.logo} alt="" className="w-16 h-16 object-contain rounded-lg border border-white/10" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-background border border-white/10 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'logo')}
                    />
                    <span className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-md text-sm transition-colors inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Загрузить
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Описание</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание министерства..."
                className="input-dark min-h-[100px]"
                required
                data-testid="ministry-description-input"
              />
            </div>

            {/* Minister Section */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="font-subheading text-lg text-white mb-4">Министр</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">ФИО</label>
                  <Input
                    value={formData.minister?.name || ''}
                    onChange={(e) => updateMinisterField('name', e.target.value)}
                    placeholder="Имя министра"
                    className="input-dark"
                    data-testid="minister-name-input"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Дата назначения</label>
                  <Input
                    type="date"
                    value={formData.minister?.appointed_date || ''}
                    onChange={(e) => updateMinisterField('appointed_date', e.target.value)}
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Контакт</label>
                  <Input
                    value={formData.minister?.contact || ''}
                    onChange={(e) => updateMinisterField('contact', e.target.value)}
                    placeholder="Телефон или Discord"
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Фото</label>
                  <div className="flex items-center gap-3">
                    {formData.minister?.photo && (
                      <img src={formData.minister.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                    )}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'minister_photo')}
                      />
                      <span className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-md text-sm transition-colors inline-flex items-center gap-2">
                        <Upload className="w-3 h-3" />
                        Фото
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Deputies Section */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="font-subheading text-lg text-white mb-4">Заместители (до 3-х)</h3>
              <div className="space-y-4">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="bg-background rounded-lg p-4 border border-white/5">
                    <p className="text-xs text-primary font-mono mb-3">ЗАМЕСТИТЕЛЬ #{idx + 1}</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <Input
                        value={formData.minister?.deputies?.[idx]?.name || ''}
                        onChange={(e) => updateDeputyField(idx, 'name', e.target.value)}
                        placeholder="ФИО"
                        className="input-dark"
                      />
                      <Input
                        value={formData.minister?.deputies?.[idx]?.position || ''}
                        onChange={(e) => updateDeputyField(idx, 'position', e.target.value)}
                        placeholder="Должность"
                        className="input-dark"
                      />
                      <Input
                        type="date"
                        value={formData.minister?.deputies?.[idx]?.appointed_date || ''}
                        onChange={(e) => updateDeputyField(idx, 'appointed_date', e.target.value)}
                        className="input-dark"
                      />
                      <div className="flex items-center gap-2">
                        {formData.minister?.deputies?.[idx]?.photo && (
                          <img src={formData.minister.deputies[idx].photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                        )}
                        <label className="cursor-pointer flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, 'deputy_photo', idx)}
                          />
                          <span className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-md text-sm transition-colors inline-flex items-center gap-2 w-full justify-center">
                            <Upload className="w-3 h-3" />
                            Фото
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Section */}
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-subheading text-lg text-white">Состав</h3>
                <Button type="button" variant="ghost" size="sm" onClick={addStaffMember}>
                  <Plus className="w-4 h-4 mr-1" />
                  Добавить
                </Button>
              </div>
              <div className="space-y-2">
                {formData.staff.map((member, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={member}
                      onChange={(e) => updateStaffMember(idx, e.target.value)}
                      placeholder="Имя сотрудника"
                      className="input-dark"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStaffMember(idx)}
                      className="text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" className="btn-gold" data-testid="save-ministry-btn">
                {editMode ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MinistryManager;
