import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePatientStore, NewPatientData } from '@/store/patientStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Users, Plus, Search, User, Loader2, Activity, Calendar as CalendarIcon, Upload } from 'lucide-react';
import { Patient } from '@/types';
import { PatientDetail } from './PatientDetail';

export const PatientsView: React.FC = () => {
  const { patients, fetchPatients, addPatient, loading } = usePatientStore();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientData, setNewPatientData] = useState<Partial<NewPatientData>>({});
  const [error, setError] = useState<string | null>(null);
  const [ageMessage, setAgeMessage] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleRegisterPatient = async () => {
    setError(null);
    if (!newPatientData.name || !newPatientData.email || !newPatientData.password || !newPatientData.age || !newPatientData.sex || !newPatientData.date_of_birth || !newPatientData.guardian_name || !newPatientData.guardian_phone || !newPatientData.asd_level || !newPatientData.guardian_email) {
      setError('Por favor, complete todos los campos requeridos.');
      return;
    }

    const patientDataWithFile = {
      ...newPatientData,
      clinical_history_file: selectedFile || undefined,
    };

    const success = await addPatient(patientDataWithFile as NewPatientData);

    if (success) {
      setShowNewPatientForm(false);
      setNewPatientData({});
      setAgeMessage('');
      setDateInput('');
      setSelectedFile(null);
    } else {
      setError('Hubo un error al registrar el paciente. Verifique los datos e intente de nuevo.');
    }
  };

  const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, '');
    setNewPatientData({ ...newPatientData, name: value });
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
    setDateInput(formatted);
    setNewPatientData(prev => ({ ...prev, date_of_birth: formatted.length === 10 && validateDate(formatted) ? new Date(formatted.split('/').reverse().join('-')) : undefined }));

    // Clear previous error
    if (error) {
      setError(null);
    }

    // Calculate age and validate
    if (formatted.length === 10) {
      if (validateDate(formatted)) {
        const age = calculateAge(formatted);
        if (age !== null) {
          if (age >= 3 && age <= 18) {
            setAgeMessage(`Edad: ${age} años ✓`);
            setError(null);
          } else {
            setAgeMessage('');
            setError('La edad debe estar entre 3 y 18 años');
          }
        }
      } else {
        setAgeMessage('');
        setError('Fecha inválida');
      }
    } else {
      setAgeMessage('');
    }
  };

  if (selectedPatient) {
    return <PatientDetail patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Pacientes</h1>
          <p className="text-gray-600 mt-1">{patients.length} pacientes asignados</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline"><Search className="w-4 h-4 mr-2" />Buscar</Button>
          <Button onClick={() => setShowNewPatientForm(true)}><Plus className="w-4 h-4 mr-2" />Nuevo Paciente</Button>
        </div>
      </div>

      {showNewPatientForm && (
        <Card className="psych-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-green-600" />Registrar Nuevo Paciente</CardTitle>
            <CardDescription>Complete la información para crear un nuevo paciente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre completo del paciente</Label>
              <Input id="name" value={newPatientData.name || ''} onInput={handleNameInput} placeholder="SOLO MAYÚSCULAS, SIN NÚMEROS" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Sexo</Label>
                <Select onValueChange={(value) => setNewPatientData({...newPatientData, sex: value})}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar sexo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date_of_birth">Fecha de nacimiento (DD/MM/AAAA)</Label>
                <Input
                  id="date_of_birth"
                  value={dateInput}
                  onChange={(e) => handleDateChange(e.target.value)}
                  placeholder="25/12/2010"
                  maxLength={10}
                  className={error && (error.includes('edad') || error === 'Fecha inválida') ? 'border-red-500' : ''}
                />
                {ageMessage && <p className="text-sm text-green-600 mt-1">{ageMessage}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="address">Dirección / Ciudad</Label>
              <Input id="address" value={newPatientData.address || ''} onChange={(e) => setNewPatientData({...newPatientData, address: e.target.value})} placeholder="Ej: Av. Siempre Viva 123, Springfield" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guardian_name">Nombre del representante</Label>
                <Input id="guardian_name" value={newPatientData.guardian_name || ''} onChange={(e) => setNewPatientData({...newPatientData, guardian_name: e.target.value})} placeholder="Ej: Homero Simpson" />
              </div>
              <div>
                <Label htmlFor="guardian_phone">Teléfono de contacto del tutor</Label>
                <Input id="guardian_phone" value={newPatientData.guardian_phone || ''} onChange={(e) => setNewPatientData({...newPatientData, guardian_phone: e.target.value})} placeholder="Ej: +1 555 123 4567" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nivel de TEA</Label>
                <Select onValueChange={(value) => setNewPatientData({...newPatientData, asd_level: value})}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nivel 1">Nivel 1: Necesita ayuda</SelectItem>
                    <SelectItem value="Nivel 2">Nivel 2: Necesita ayuda notable</SelectItem>
                    <SelectItem value="Nivel 3">Nivel 3: Necesita ayuda muy notable</SelectItem>
                    <SelectItem value="No Aplicable">No Aplicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Correo electrónico del paciente</Label>
                <Input id="email" type="email" value={newPatientData.email || ''} onChange={(e) => setNewPatientData({...newPatientData, email: e.target.value})} placeholder="paciente@email.com" />
              </div>
              <div>
                <Label htmlFor="password">Contraseña del paciente</Label>
                <Input id="password" type="password" value={newPatientData.password || ''} onChange={(e) => setNewPatientData({...newPatientData, password: e.target.value})} placeholder="••••••••" />
              </div>
            </div>

            <div>
              <Label htmlFor="guardian_email">Correo electrónico del tutor</Label>
              <Input id="guardian_email" type="email" value={newPatientData.guardian_email || ''} onChange={(e) => setNewPatientData({...newPatientData, guardian_email: e.target.value})} placeholder="tutor@email.com" />
            </div>
            </div>

            <div>
              <Label htmlFor="clinical_history">Historial clínico (opcional)</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                      <span>Subir archivo</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    </label>
                    <p className="pl-1">o arrastrar y soltar</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX hasta 10MB</p>
                  {selectedFile && (
                    <p className="text-sm text-green-600 font-medium">Archivo seleccionado: {selectedFile.name}</p>
                  )}
                </div>
              </div>
            </div>

            {error && <p className="text-sm font-medium text-red-500">{error}</p>}

            <div className="flex space-x-2">
              <Button onClick={handleRegisterPatient} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2"/>}
                {loading ? 'Registrando...' : 'Registrar Paciente'}
              </Button>
              <Button variant="outline" onClick={() => setShowNewPatientForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Accordion type="single" collapsible className="w-full">
        {loading && patients.length === 0 ? (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className='ml-4 text-gray-600'>Cargando pacientes...</p>
            </div>
        ) : patients.length === 0 ? (
            <div className="text-center p-8">
                <p className="text-gray-600">No tienes pacientes asignados.</p>
                <p className="text-sm text-gray-500 mt-2">Usa el botón "Nuevo Paciente" para registrar y asignar uno.</p>
            </div>
        ) : (
          patients.map((patient) => (
            <AccordionItem value={`item-${patient.id}`} key={patient.id}>
              <AccordionTrigger>
                <div className="flex justify-between items-center w-full pr-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><User className="w-6 h-6 text-gray-500" /></div>
                    <div>
                      <p className="font-semibold">{patient.name}</p>
                      <p className="text-sm text-gray-500">{patient.age} años • {patient.diagnosis.join(', ')}</p>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2 pb-4 px-4">
                  <div className="flex items-center justify-between text-sm">
                     <p>Email del Tutor: {patient.guardian_email || 'No especificado'}</p>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" className="flex-1" onClick={() => setSelectedPatient(patient)}><Activity className="w-4 h-4 mr-1" />Ver Detalles</Button>
                    <Button size="sm" variant="outline"><Users className="w-4 h-4" /></Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))
        )}
      </Accordion>
    </div>
  );
};