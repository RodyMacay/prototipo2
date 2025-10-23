import React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Monitor, 
  Palette, 
  Database,
  Wifi,
  Save,
  RefreshCw
} from 'lucide-react';
import { Psychologist } from '@/types';

export const SettingsView: React.FC = () => {
  const { user } = useAuthStore();
  const psychologist = user as Psychologist;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">
            Personaliza tu experiencia profesional
          </p>
        </div>
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="psych-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Perfil Profesional
              </CardTitle>
              <CardDescription>
                Información personal y credenciales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                  <p className="mt-1 text-sm text-gray-900">{psychologist.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Número de Licencia</label>
                  <p className="mt-1 text-sm text-gray-900">{psychologist.licenseNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Especialidades</label>
                  <p className="mt-1 text-sm text-gray-900">{psychologist.specializations.join(', ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Pacientes Asignados</label>
                  <Badge variant="secondary" className="mt-1">
                    {psychologist.assignedChildren.length} activos
                  </Badge>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Editar Perfil
              </Button>
            </CardContent>
          </Card>

          <Card className="psych-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-600" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Configura alertas y notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas Biométricas</p>
                  <p className="text-sm text-gray-600">Recibir notificaciones de signos vitales anómalos</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sesiones Programadas</p>
                  <p className="text-sm text-gray-600">Recordatorios de citas próximas</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reportes Semanales</p>
                  <p className="text-sm text-gray-600">Resumen de progreso de pacientes</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Emergencias</p>
                  <p className="text-sm text-gray-600">Alertas críticas inmediatas</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="psych-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-green-600" />
                Monitoreo
              </CardTitle>
              <CardDescription>
                Configuración de sistemas de seguimiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-inicio de Sesiones</p>
                  <p className="text-sm text-gray-600">Iniciar monitoreo automáticamente</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Grabación de Audio</p>
                  <p className="text-sm text-gray-600">Almacenar sesiones de terapia</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Análisis en Tiempo Real</p>
                  <p className="text-sm text-gray-600">Procesamiento continuo de datos</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div className="space-y-6">
          <Card className="psych-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Autenticación 2FA</span>
                <Badge variant="secondary">Activa</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cifrado de Datos</span>
                <Badge variant="secondary">AES-256</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Última Sesión</span>
                <span className="text-sm text-gray-600">Hace 2 min</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Configurar Seguridad
              </Button>
            </CardContent>
          </Card>

          <Card className="psych-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-blue-600" />
                Conectividad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Estado de Red</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Conectado
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Dispositivos</span>
                <span className="text-sm text-gray-600">3 activos</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sincronización</span>
                <Badge variant="outline">Auto</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar Conexión
              </Button>
            </CardContent>
          </Card>

          <Card className="psych-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                Datos y Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Uso de Almacenamiento</span>
                <span className="text-sm text-gray-600">2.3 GB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '23%' }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Backup Automático</span>
                <Badge variant="secondary">Diario</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Database className="w-4 h-4 mr-2" />
                Gestionar Datos
              </Button>
            </CardContent>
          </Card>

          <Card className="psych-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-pink-600" />
                Personalización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tema</span>
                <Badge variant="outline">Profesional</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Idioma</span>
                <Badge variant="outline">Español</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Zona Horaria</span>
                <Badge variant="outline">GMT-3</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Palette className="w-4 h-4 mr-2" />
                Personalizar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};