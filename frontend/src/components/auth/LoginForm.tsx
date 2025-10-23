import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Heart, Stethoscope } from 'lucide-react';
import { UserRole } from '@/types';
import { RegisterForm } from './RegisterForm';

export const LoginForm: React.FC = () => {
  const { login, loading, error, clearError } = useAuthStore();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const activeRole: UserRole = 'psychologist';
  const [showRegister, setShowRegister] = useState(false);

  const handleBackToLogin = (prefillData?: { email: string; password: string }) => {
    if (prefillData) {
      setCredentials({
        email: prefillData.email,
        password: prefillData.password
      });
    }
    setShowRegister(false);
  };

  if (showRegister) {
    return <RegisterForm onBackToLogin={handleBackToLogin} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(credentials.email, credentials.password, activeRole);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* LUMINOVA Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="relative">
              <Brain className="w-12 h-12 text-blue-600" />
              <Heart className="w-6 h-6 text-red-500 absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LUMINOVA
              </h1>
              <p className="text-sm text-gray-600">Sistema Integral de Terapias TEA</p>
            </div>
          </motion.div>
        </div>

        <Card className="glass-psych border-white/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold text-gray-800">
              Iniciar Sesión
            </CardTitle>
            <CardDescription>
              Accede a tu perfil para comenzar la terapia
            </CardDescription>
          </CardHeader>

          <CardContent>
            <motion.div
              key="psychologist"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="psych-email">Email Profesional</Label>
                  <Input
                    id="psych-email"
                    type="email"
                    placeholder="doctor@luminova.com"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="psych-password">Contraseña</Label>
                  <Input
                    id="psych-password"
                    type="password"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full psych-button-primary"
                  disabled={loading}
                >
                  {loading ? 'Validando...' : 'Iniciar Sesión'}
                </Button>

                <div className="pt-4 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600 mb-3">¿No tienes cuenta?</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowRegister(true)}
                  >
                    Crear Cuenta Profesional
                  </Button>
                </div>
              </form>
            </motion.div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-6 text-sm text-gray-500"
        >
          <p>Plataforma integral de análisis TEA desarrollada con tecnología avanzada</p>
        </motion.div>
      </motion.div>
    </div>
  );
};
