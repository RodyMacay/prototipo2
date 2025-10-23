import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Brain, Heart, ArrowLeft } from 'lucide-react';

interface RegisterFormProps {
  onBackToLogin: (data?: {email: string, password: string}) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin }) => {
  const { register, loading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    date_of_birth: '',
    sex: '',
    phone_number: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
    specializations: '',
    yearsExperience: '',
    hospital: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [ageMessage, setAgeMessage] = useState('');

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    if (field === 'name') {
      processedValue = value.toUpperCase().replace(/[^A-Z\s]/g, '');
    } else if (field === 'licenseNumber' || field === 'phone_number') {
      processedValue = value.replace(/[^0-9]/g, '');
    }
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (formErrors[field]) {
      setFormErrors(prev => ({...prev, [field]: ''}));
    }
  };

  const formatDateInput = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');

    // Limit to 8 digits (DDMMYYYY)
    const limited = numbers.slice(0, 8);

    // Format as DD/MM/YYYY
    let formatted = limited;
    if (limited.length >= 2) {
      formatted = limited.slice(0, 2) + '/' + limited.slice(2);
    }
    if (limited.length >= 4) {
      formatted = limited.slice(0, 2) + '/' + limited.slice(2, 4) + '/' + limited.slice(4);
    }
    if (limited.length >= 6) {
      formatted = limited.slice(0, 2) + '/' + limited.slice(2, 4) + '/' + limited.slice(4, 8);
    }

    return formatted;
  };

  const calculateAge = (dateString: string) => {
    if (!dateString || dateString.length !== 10) return null;

    const parts = dateString.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
    const year = parseInt(parts[2]);

    const birthDate = new Date(year, month, day);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const validateDate = (dateString: string) => {
    if (!dateString || dateString.length !== 10) return false;

    const parts = dateString.split('/');
    if (parts.length !== 3) return false;

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);

    // Check if date is valid
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return false;
    }

    return true;
  };

  const handleDateChange = (value: string) => {
    const formatted = formatDateInput(value);
    setFormData(prev => ({ ...prev, date_of_birth: formatted }));

    // Clear previous error
    if (formErrors.date_of_birth) {
      setFormErrors(prev => ({...prev, date_of_birth: ''}));
    }

    // Calculate age and validate
    if (formatted.length === 10) {
      if (validateDate(formatted)) {
        const age = calculateAge(formatted);
        if (age !== null) {
          if (age >= 18 && age <= 70) {
            setAgeMessage(`Edad: ${age} años ✓`);
            setFormErrors(prev => ({...prev, date_of_birth: ''}));
          } else {
            setAgeMessage('');
            setFormErrors(prev => ({...prev, date_of_birth: 'La edad debe estar entre 18 y 70 años'}));
          }
        }
      } else {
        setAgeMessage('');
        setFormErrors(prev => ({...prev, date_of_birth: 'Fecha inválida'}));
      }
    } else {
      setAgeMessage('');
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({...prev, [field]: ''}));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = 'El nombre es requerido.';
    if (!formData.licenseNumber) errors.licenseNumber = 'La cédula es requerida.';
    if (!formData.date_of_birth || formData.date_of_birth.length !== 10) errors.date_of_birth = 'La fecha de nacimiento es requerida.';
    if (!formData.sex) errors.sex = 'El sexo es requerido.';
    if (!formData.phone_number) errors.phone_number = 'El teléfono es requerido.';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'El correo no es válido.';
    if (formData.password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validateForm()) return;

    // Convert DD/MM/YYYY to YYYY-MM-DD for backend
    const convertDateFormat = (dateString: string) => {
      if (!dateString || dateString.length !== 10) return '';
      const parts = dateString.split('/');
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    };

    const userData = {
      ...formData,
      date_of_birth: convertDateFormat(formData.date_of_birth),
      role: 'psychologist',
      specializations: formData.specializations.split(',').map(s => s.trim()),
      yearsExperience: parseInt(formData.yearsExperience) || 0,
    };

    await register(userData);
    onBackToLogin({ email: formData.email, password: formData.password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => onBackToLogin()} className="mr-2"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
        </div>
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="inline-flex items-center gap-3 mb-4">
            <div className="relative"><Brain className="w-12 h-12 text-blue-600" /><Heart className="w-6 h-6 text-red-500 absolute -top-1 -right-1" /></div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">LUMINOVA</h1>
              <p className="text-sm text-gray-600">Crear Cuenta de Psicólogo</p>
            </div>
          </motion.div>
        </div>
        <Card className="glass-psych border-white/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-semibold text-gray-800">Registro Profesional</CardTitle>
            <CardDescription>Crea tu cuenta para acceder a la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombres y apellidos completos</Label>
                <Input id="name" type="text" placeholder="SOLO MAYÚSCULAS, SIN NÚMEROS" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
                {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">Cédula / ID profesional</Label>
                <Input id="licenseNumber" type="text" placeholder="SOLO NÚMEROS" value={formData.licenseNumber} onChange={(e) => handleInputChange('licenseNumber', e.target.value)} required />
                {formErrors.licenseNumber && <p className="text-sm text-red-600">{formErrors.licenseNumber}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Fecha de nacimiento</Label>
                  <Input id="date_of_birth" type="text" placeholder="DD/MM/AAAA" value={formData.date_of_birth} onChange={(e) => handleDateChange(e.target.value)} maxLength={10} required />
                  {ageMessage && <p className="text-sm text-green-600">{ageMessage}</p>}
                  {formErrors.date_of_birth && <p className="text-sm text-red-600">{formErrors.date_of_birth}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <Select onValueChange={(value) => handleSelectChange('sex', value)}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Femenino">Femenino</SelectItem></SelectContent></Select>
                  {formErrors.sex && <p className="text-sm text-red-600">{formErrors.sex}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Teléfono de contacto</Label>
                <Input id="phone_number" type="tel" placeholder="SOLO NÚMEROS" value={formData.phone_number} onChange={(e) => handleInputChange('phone_number', e.target.value)} required />
                {formErrors.phone_number && <p className="text-sm text-red-600">{formErrors.phone_number}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" placeholder="profesional@email.com" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required />
                {formErrors.email && <p className="text-sm text-red-600">{formErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección / Ciudad</Label>
                <Input id="address" type="text" placeholder="Ej: Av. Principal 123, Ciudad" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} required />
                  {formErrors.password && <p className="text-sm text-red-600">{formErrors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} required />
                  {formErrors.confirmPassword && <p className="text-sm text-red-600">{formErrors.confirmPassword}</p>}
                </div>
              </div>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
              <Button type="submit" className="w-full psych-button-primary" disabled={loading}>{loading ? 'Creando cuenta...' : 'Crear Cuenta Profesional'}</Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};