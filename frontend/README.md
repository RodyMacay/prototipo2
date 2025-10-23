# luminova - Plataforma TEA con Supabase

Una plataforma integral para el apoyo terapéutico de niños con TEA (Trastorno del Espectro Autista) que combina monitoreo biométrico en tiempo real, mundos emocionales interactivos y herramientas profesionales para psicólogos.

## 🚀 Configuración de Base de Datos

### 1. Configurar Supabase

1. Ve a tu proyecto de Supabase: https://adzuddupoarpfjlfkhac.supabase.co
2. En el panel de Supabase, ve a **SQL Editor**
3. Ejecuta el script de la base de datos que se encuentra en `database/schema.sql`

Este script creará todas las tablas necesarias:
- `users` - Perfiles de usuarios (psicólogos y niños)
- `psychologists` - Información específica de psicólogos
- `children` - Información específica de niños
- `biometric_data` - Datos biométricos en tiempo real
- `biometric_alerts` - Alertas del sistema
- `emotion_records` - Registros emocionales
- `therapy_sessions` - Sesiones de terapia
- `emotional_islands` - Progreso en las islas emocionales

### 2. Configurar Autenticación

1. En tu panel de Supabase, ve a **Authentication > Settings**
2. Habilita Email/Password authentication
3. Configura las políticas de seguridad (RLS) - ya están incluidas en el schema

### 3. Datos de Prueba

El sistema incluye usuarios de prueba:

**Psicólogo:**
- Email: `maria.gonzalez@mindbridge.com`
- Password: `demo123`

**Niño:**
- Email: `lucas.martinez@email.com`
- Password: `demo123`

## 🔧 Características Implementadas

### ✅ Integración con Supabase
- ✅ Autenticación real con fallback a datos mock
- ✅ Almacenamiento persistente de datos biométricos
- ✅ Subscripciones en tiempo real para alertas
- ✅ Gestión de perfiles de usuario
- ✅ Historial de emociones

### ✅ Dashboard del Psicólogo
- ✅ Monitoreo biométrico en tiempo real
- ✅ Visualización de datos con Chart.js
- ✅ Sistema de alertas
- ✅ Gestión de pacientes
- ✅ Análisis TEA
- ✅ Configuración de sesiones

### ✅ Interfaz del Niño
- ✅ Mundos emocionales 3D interactivos
- ✅ Juegos terapéuticos
- ✅ Sistema de sonidos ambientales
- ✅ Personajes emocionales

### ✅ Funcionalidades Técnicas
- ✅ Stores con Zustand para gestión de estado
- ✅ Componentes reutilizables con shadcn/ui
- ✅ Animaciones con Framer Motion
- ✅ Responsive design con Tailwind CSS
- ✅ Monitoreo del sistema en tiempo real

## 🎯 Cómo Usar

1. **Ejecutar el schema SQL** en tu proyecto de Supabase
2. **Hacer login** con las credenciales de prueba
3. **Explorar el dashboard** del psicólogo para ver datos en tiempo real
4. **Cambiar al perfil del niño** para interactuar con los mundos emocionales
5. **Monitorear el sistema** usando el componente SystemStatus

## 🔄 Flujo de Datos

1. **Datos Biométricos**: Se generan datos mock que se guardan en Supabase y se muestran en tiempo real
2. **Emociones**: Se registran las selecciones emocionales del niño
3. **Alertas**: Se generan automáticamente basadas en los datos biométricos
4. **Sesiones**: Los psicólogos pueden gestionar sesiones terapéuticas
5. **Progreso**: Se trackea el progreso del niño en las diferentes actividades

La aplicación ahora funciona completamente con datos reales almacenados en Supabase mientras mantiene la funcionalidad demo para facilitar las pruebas.