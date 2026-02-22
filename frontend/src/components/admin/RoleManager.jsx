import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Edit, Trash2, Key, Copy, RefreshCw, Shield, User, Crown
} from 'lucide-react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RoleManager = () => {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [activeSection, setActiveSection] = useState('roles');
  
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    permissions: {
      can_manage_ministries: false,
      can_manage_news: false,
      can_manage_legislation: false,
      can_manage_roles: false,
      can_delete: false
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, usersRes] = await Promise.all([
        axios.get(`${API}/roles`),
        axios.get(`${API}/users`)
      ]);
      setRoles(rolesRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditMode(false);
    setCurrentRole(null);
    setFormData({
      name: '',
      permissions: {
        can_manage_ministries: false,
        can_manage_news: false,
        can_manage_legislation: false,
        can_manage_roles: false,
        can_delete: false
      }
    });
    setDialogOpen(true);
  };

  const openEditDialog = (role) => {
    setEditMode(true);
    setCurrentRole(role);
    setFormData({
      name: role.name,
      permissions: role.permissions
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode && currentRole) {
        await axios.put(`${API}/roles/${currentRole.id}`, formData);
        toast.success('Роль обновлена');
      } else {
        const response = await axios.post(`${API}/roles`, formData);
        toast.success(`Роль создана! Код доступа: ${response.data.access_code}`);
      }
      
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(error.response?.data?.detail || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить роль?')) return;
    
    try {
      await axios.delete(`${API}/roles/${id}`);
      toast.success('Роль удалена');
      fetchData();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error.response?.data?.detail || 'Ошибка удаления');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Удалить пользователя?')) return;
    
    try {
      await axios.delete(`${API}/users/${userId}`);
      toast.success('Пользователь удалён');
      fetchData();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error.response?.data?.detail || 'Ошибка удаления');
    }
  };

  const regenerateCode = async (roleId) => {
    try {
      const response = await axios.post(`${API}/roles/${roleId}/regenerate-code`);
      toast.success(`Новый код: ${response.data.access_code}`);
      fetchData();
    } catch (error) {
      toast.error('Ошибка генерации кода');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Код скопирован!');
  };

  const updatePermission = (key, value) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: value
      }
    });
  };

  const permissionLabels = {
    can_manage_ministries: 'Управление министерствами',
    can_manage_news: 'Управление новостями',
    can_manage_legislation: 'Управление законодательством',
    can_manage_roles: 'Управление ролями',
    can_delete: 'Право на удаление'
  };

  return (
    <div data-testid="role-manager">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl tracking-widest text-primary flex items-center gap-3">
            <Shield className="w-6 h-6" />
            УПРАВЛЕНИЕ ДОСТУПОМ
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Роли, права и пользователи
          </p>
        </div>
        <Button onClick={openCreateDialog} className="btn-gold" data-testid="add-role-btn">
          <Plus className="w-4 h-4 mr-2" />
          Новая роль
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveSection('roles')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeSection === 'roles' 
              ? 'bg-primary text-black' 
              : 'bg-white/5 text-muted-foreground hover:text-white'
          }`}
        >
          <Key className="w-4 h-4 inline mr-2" />
          Роли ({roles.length})
        </button>
        <button
          onClick={() => setActiveSection('users')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeSection === 'users' 
              ? 'bg-primary text-black' 
              : 'bg-white/5 text-muted-foreground hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Пользователи ({users.length})
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-background-paper rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-white/5 rounded w-1/3 mb-3" />
              <div className="h-4 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : activeSection === 'roles' ? (
        /* Roles List */
        roles.length > 0 ? (
          <div className="grid gap-4">
            {roles.map((role) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background-paper border border-white/10 rounded-lg p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border border-white/10">
                        <Key className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-subheading text-lg text-white">{role.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Создана: {formatDate(role.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Access Code */}
                    <div className="flex items-center gap-2 mb-4 p-3 bg-background rounded-md">
                      <span className="text-xs text-muted-foreground">Код доступа:</span>
                      <code className="font-mono text-primary tracking-wider">{role.access_code}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(role.access_code)}
                        className="ml-2"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => regenerateCode(role.id)}
                        title="Сгенерировать новый код"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Permissions */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(role.permissions).map(([key, value]) => (
                        value && (
                          <span
                            key={key}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                          >
                            {permissionLabels[key]}
                          </span>
                        )
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(role)}
                      data-testid={`edit-role-${role.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(role.id)}
                      className="text-red-500 hover:text-red-400"
                      data-testid={`delete-role-${role.id}`}
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
            <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Ролей не найдено</p>
            <Button onClick={openCreateDialog} className="mt-4 btn-outline-gold">
              <Plus className="w-4 h-4 mr-2" />
              Создать первую роль
            </Button>
          </div>
        )
      ) : (
        /* Users List */
        users.length > 0 ? (
          <div className="grid gap-4">
            {users.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background-paper border border-white/10 rounded-lg p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center border border-white/10">
                      {user.role === 'governor' ? (
                        <Crown className="w-6 h-6 text-primary" />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-subheading text-lg text-white flex items-center gap-2">
                        {user.username}
                        {user.role === 'governor' && (
                          <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">
                            ГУБЕРНАТОР
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {user.role_name || 'Без роли'} • {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>

                  {user.role !== 'governor' && user.id !== currentUser?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-background-paper rounded-lg border border-white/10">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Пользователей не найдено</p>
          </div>
        )
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-background-paper border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-wider text-primary">
              {editMode ? 'Редактировать роль' : 'Новая роль'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Название роли</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Редактор новостей"
                className="input-dark"
                required
                data-testid="role-name-input"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-3 block">Права доступа</label>
              <div className="space-y-3">
                {Object.entries(permissionLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3">
                    <Checkbox
                      id={key}
                      checked={formData.permissions[key]}
                      onCheckedChange={(checked) => updatePermission(key, checked)}
                      className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label htmlFor={key} className="text-sm text-gray-300 cursor-pointer">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" className="btn-gold" data-testid="save-role-btn">
                {editMode ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManager;
