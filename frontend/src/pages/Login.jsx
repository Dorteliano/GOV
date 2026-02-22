import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Star, Lock, User, Eye, EyeOff, Key, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const Login = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [governorSecret, setGovernorSecret] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [governorExists, setGovernorExists] = useState(true);
  
  const { login, registerWithCode, registerGovernor, checkGovernorExists } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkIfGovernorExists();
  }, []);

  const checkIfGovernorExists = async () => {
    const exists = await checkGovernorExists();
    setGovernorExists(exists);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверные данные для входа');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWithCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerWithCode(username, accessCode);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный код доступа');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterGovernor = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerGovernor(username, password, governorSecret);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка регистрации Губернатора');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-6" data-testid="login-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Shield className="w-16 h-16 text-primary" />
              <Star className="w-6 h-6 text-primary absolute -top-1 -right-1" />
            </div>
          </div>
          <h1 className="font-heading text-2xl tracking-widest text-primary mb-2">
            АВТОРИЗАЦИЯ
          </h1>
          <p className="text-muted-foreground text-sm">
            Административная панель Правительства
          </p>
        </div>

        {/* Tabs */}
        <div className="glass p-8 rounded-lg">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-background">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                Вход
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                Регистрация
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Логин</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Введите логин"
                      className="pl-12 input-dark"
                      required
                      data-testid="login-username-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Введите пароль"
                      className="pl-12 pr-12 input-dark"
                      required
                      data-testid="login-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-gold py-6"
                  data-testid="login-submit-btn"
                >
                  {loading ? 'Загрузка...' : 'Войти'}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegisterWithCode} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Логин</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Придумайте логин"
                      className="pl-12 input-dark"
                      required
                      data-testid="register-username-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Код доступа</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      placeholder="Введите код доступа"
                      className="pl-12 input-dark font-mono tracking-wider"
                      required
                      data-testid="register-code-input"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Код доступа выдаётся Губернатором
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-gold py-6"
                  data-testid="register-submit-btn"
                >
                  {loading ? 'Загрузка...' : 'Зарегистрироваться'}
                </Button>
              </form>

              {/* Governor Registration */}
              {!governorExists && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-5 h-5 text-primary" />
                    <h3 className="font-subheading text-white">Регистрация Губернатора</h3>
                  </div>
                  <form onSubmit={handleRegisterGovernor} className="space-y-4">
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Логин Губернатора"
                      className="input-dark"
                      required
                    />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Пароль"
                      className="input-dark"
                      required
                    />
                    <Input
                      type="password"
                      value={governorSecret}
                      onChange={(e) => setGovernorSecret(e.target.value)}
                      placeholder="Секретный код Губернатора"
                      className="input-dark"
                      required
                    />
                    <Button type="submit" disabled={loading} className="w-full btn-outline-gold">
                      {loading ? 'Загрузка...' : 'Стать Губернатором'}
                    </Button>
                  </form>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
