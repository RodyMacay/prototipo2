import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useBiometricStore } from '@/store/biometricStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Users, 
  Activity, 
  BarChart3, 
  Settings, 
  Bell, 
  LogOut,
  Stethoscope,
  Heart,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Psychologist } from '@/types';
import { SystemStatus } from '@/components/shared/SystemStatus';

interface PsychologistLayoutProps {
  children: React.ReactNode;
}

export const PsychologistLayout: React.FC<PsychologistLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { alerts, isMonitoring } = useBiometricStore();
  const psychologist = user as Psychologist;
  const [showSystemStatus, setShowSystemStatus] = useState(false);

  const navigationItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/dashboard', active: true },
    { icon: Users, label: 'Pacientes', href: '/patients', active: false, badge: psychologist?.assignedChildren?.length ?? 0 },
    { icon: Activity, label: 'Sesiones Activas', href: '/sessions', active: false },
    { icon: Brain, label: 'Análisis TEA', href: '/analysis', active: false },
    { icon: Heart, label: 'Biométrica', href: '/biometric', active: false, badge: isMonitoring ? 'LIVE' : null },
    { icon: Settings, label: 'Configuración', href: '/settings', active: false }
  ];

  const unreadAlerts = alerts.filter(alert => !alert.resolved).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 psychologist-theme">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Brain className="w-8 h-8 text-blue-600" />
                <Heart className="w-4 h-4 text-red-500 absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LUMINOVA
                </h1>
                <p className="text-xs text-gray-500">Dashboard Profesional</p>
              </div>
            </div>

            {/* Center Status */}
            <div className="hidden md:flex items-center space-x-4">
              {isMonitoring && (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-700">Monitoreo Activo</span>
                </motion.div>
              )}
              
              <Badge variant="outline" className="text-xs">
                {psychologist?.assignedChildren?.length ?? 0} Pacientes Asignados
              </Badge>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* System Status */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSystemStatus(true)}
                className="relative"
              >
                <CheckCircle className="w-5 h-5" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {unreadAlerts > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                  >
                    {unreadAlerts}
                  </Badge>
                )}
              </Button>

              {/* Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{psychologist?.name}</p>
                  <p className="text-xs text-blue-600">{psychologist?.licenseNumber}</p>
                </div>
                <Avatar>
                  <AvatarImage src={psychologist?.avatar} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    <Stethoscope className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Logout */}
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white/60 backdrop-blur-md border-r border-white/20 min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {navigationItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Button
                  variant={item.active ? "default" : "ghost"}
                  className={`w-full justify-start space-x-3 h-12 ${
                    item.active 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'hover:bg-blue-50 text-gray-700'
                  }`}
                  onClick={() => window.location.href = item.href}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge 
                      variant={item.badge === 'LIVE' ? 'destructive' : 'secondary'}
                      className={`text-xs ${
                        item.badge === 'LIVE' 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : ''
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="p-4 mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Estado del Sistema</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sesiones Hoy</span>
                <Badge variant="outline">3</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Alertas Activas</span>
                <Badge variant={unreadAlerts > 0 ? "destructive" : "secondary"}>
                  {unreadAlerts}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dispositivos</span>
                <Badge variant="outline" className="text-green-600">
                  {isMonitoring ? 'Conectados' : 'Desconectados'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Emergency Button */}
          <div className="p-4">
            <Button 
              variant="destructive" 
              className="w-full"
              size="sm"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Emergencia
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* System Status Modal */}
      {showSystemStatus && (
        <SystemStatus onClose={() => setShowSystemStatus(false)} />
      )}
    </div>
  );
};