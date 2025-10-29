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
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Search, User, Loader2, Activity, Calendar as CalendarIcon, Upload, Mail, Phone, MapPin, Sparkles, Clock3 } from 'lucide-react';
import { Patient } from '@/types';
import { PatientDetail } from './PatientDetail';

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.05,
      type: 'spring',
      stiffness: 160,
      damping: 18,
    },
  }),
};

const getInitials = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase() || 'P';
};

const formatBirthDate = (date?: Date) => {
  if (!date || Number.isNaN(date.getTime())) {
    return 'Fecha de nacimiento no registrada';
  }
  try {
    return `Nacimiento: ${format(date, "dd MMM yyyy", { locale: es })}`;
  } catch {
    return 'Fecha de nacimiento no registrada';
  }
};

const formatUpdatedAt = (date?: Date) => {
  if (!date || Number.isNaN(date.getTime())) {
    return 'Actualizacion pendiente';
  }
  try {
    return `Actualizado ${format(date, "dd MMM yyyy", { locale: es })}`;
  } catch {
    return 'Actualizacion pendiente';
  }
};

const formatEmotionLabel = (emotion?: Patient['currentEmotion']) => {
  if (!emotion) return 'Sin dato';
  const normalized = typeof emotion === 'string' ? emotion : String(emotion);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

interface PreferenceEntry {
  label: string;
  value: string;
}

interface PreferenceDisplay {
  entries?: PreferenceEntry[];
  note?: string;
}

const formatPreferenceKey = (key: string) =>
  key
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const flattenPreferenceObject = (
  data: Record<string, unknown>,
  parentLabel = ''
): PreferenceEntry[] => {
  const items: PreferenceEntry[] = [];

  Object.entries(data).forEach(([rawKey, rawValue]) => {
    const label = parentLabel ? `${parentLabel} · ${formatPreferenceKey(rawKey)}` : formatPreferenceKey(rawKey);
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return;
    }

    if (Array.isArray(rawValue)) {
      const formattedArray = rawValue
        .map((item) => {
          if (item === null || item === undefined || item === '') return null;
          if (typeof item === 'object') {
            const nestedEntries = flattenPreferenceObject(item as Record<string, unknown>, label);
            if (nestedEntries.length) {
              return nestedEntries.map((entry) => `${entry.label}: ${entry.value}`).join(' · ');
            }
            return null;
          }
          return String(item);
        })
        .filter((item): item is string => Boolean(item))
        .join(', ');

      if (formattedArray) {
        items.push({ label, value: formattedArray });
      }
      return;
    }

    if (typeof rawValue === 'object') {
      items.push(...flattenPreferenceObject(rawValue as Record<string, unknown>, label));
      return;
    }

    items.push({ label, value: String(rawValue) });
  });

  return items;
};

const buildPreferenceDisplay = (preferences: Patient['preferences']): PreferenceDisplay | null => {
  if (!preferences) return null;

  const parseObject = (value: Record<string, unknown>) => {
    const entries = flattenPreferenceObject(value);
    return entries.length ? { entries } : null;
  };

  if (typeof preferences === 'string') {
    const trimmed = preferences.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parseObject(parsed as Record<string, unknown>);
      }
    } catch {
      // Ignore JSON parsing errors and fall back to text notes.
    }

    return { note: trimmed };
  }

  return parseObject(preferences as Record<string, unknown>);
};

export const PatientsView: React.FC = () => {
  const { patients, fetchPatients, addPatient, loading } = usePatientStore();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientData, setNewPatientData] = useState<Partial<NewPatientData>>({ diagnosis: [] });
  const [error, setError] = useState<string | null>(null);
  const [ageMessage, setAgeMessage] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [preferencesInput, setPreferencesInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleRegisterPatient = async () => {
    setError(null);

    if (
      !newPatientData.name ||
      !newPatientData.email ||
      !newPatientData.password ||
      !newPatientData.sex ||
      !newPatientData.date_of_birth ||
      !newPatientData.guardian_name ||
      !newPatientData.guardian_phone ||
      !newPatientData.asd_level ||
      !newPatientData.guardian_email ||
      newPatientData.age === undefined
    ) {
      setError('Por favor, complete todos los campos requeridos.');
      return;
    }

    const diagnosisList =
      newPatientData.diagnosis && newPatientData.diagnosis.length > 0
        ? newPatientData.diagnosis
        : diagnosisInput
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

    const preferencesText = preferencesInput.trim();

    const patientDataWithFile: NewPatientData = {
      name: newPatientData.name,
      email: newPatientData.email,
      password: newPatientData.password,
      age: newPatientData.age,
      sex: newPatientData.sex,
      date_of_birth: newPatientData.date_of_birth,
      address: newPatientData.address,
      guardian_name: newPatientData.guardian_name,
      guardian_phone: newPatientData.guardian_phone,
      asd_level: newPatientData.asd_level,
      diagnosis: diagnosisList,
      guardian_email: newPatientData.guardian_email,
      parent_email: newPatientData.guardian_email,
      preferences: preferencesText || null,
      clinical_history_file: selectedFile ? selectedFile.name : undefined,
    };

    const success = await addPatient(patientDataWithFile);

    if (success) {
      setShowNewPatientForm(false);
      setNewPatientData({ diagnosis: [] });
      setAgeMessage('');
      setDateInput('');
      setDiagnosisInput('');
      setPreferencesInput('');
      setSelectedFile(null);
    } else {
      setError('Hubo un error al registrar el paciente. Verifique los datos e intente de nuevo.');
    }
  };

  const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, '');
    setNewPatientData({ ...newPatientData, name: value });
  };

  const handleDiagnosisChange = (value: string) => {
    setDiagnosisInput(value);
    const parsedDiagnosis = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    setNewPatientData(prev => ({ ...prev, diagnosis: parsedDiagnosis }));
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

    const isComplete = formatted.length === 10 && validateDate(formatted);
    let parsedDate: Date | undefined;
    let computedAge: number | undefined;

    if (isComplete) {
      parsedDate = new Date(formatted.split('/').reverse().join('-'));
      const age = calculateAge(formatted);
      if (age !== null) {
        computedAge = age;
      }
    }

    setNewPatientData(prev => ({
      ...prev,
      date_of_birth: parsedDate,
      age: computedAge,
    }));

    if (error) {
      setError(null);
    }

    if (isComplete) {
      if (computedAge !== undefined) {
        if (computedAge >= 3 && computedAge <= 18) {
          setAgeMessage('Edad: ' + computedAge + ' años ✔');
        } else {
          setAgeMessage('');
          setError('La edad debe estar entre 3 y 18 años');
        }
      } else {
        setAgeMessage('');
        setError('No se pudo calcular la edad');
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
              <div>
                <Label htmlFor="diagnosis">Diagnósticos (separados por coma)</Label>
                <textarea
                  id="diagnosis"
                  className="w-full h-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={diagnosisInput}
                  onChange={(e) => handleDiagnosisChange(e.target.value)}
                  placeholder="Ej: TEA Nivel 1, Ansiedad social"
                />
              </div>
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
            <div>
              <Label htmlFor="preferences">Notas o preferencias del paciente (opcional)</Label>
              <textarea
                id="preferences"
                className="w-full h-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={preferencesInput}
                onChange={(e) => setPreferencesInput(e.target.value)}
                placeholder="Ej: Prefiere actividades musicales y ambientes con poca luz."
              />
              <p className="text-xs text-gray-500 mt-1">Escribe texto libre para registrar gustos, sensibilidades o recomendaciones.</p>
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

      <div className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
            <span>Cargando informacion actualizada...</span>
          </div>
        )}

        {!loading && patients.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-200 bg-slate-50">
            <CardHeader className="items-center text-center">
              <CardTitle className="text-xl font-semibold text-gray-900">No tienes pacientes asignados</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Usa el boton "Nuevo paciente" para registrar y asignar uno.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              <Button onClick={() => setShowNewPatientForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Registrar nuevo paciente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[960px]">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Representación</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Preferencias registradas</TableHead>
                    <TableHead className="text-right">Actualización</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient, index) => {
                    const preferenceDisplay = buildPreferenceDisplay(patient.preferences);
                    const preferenceEntries = preferenceDisplay?.entries ?? [];
                    const entriesToShow = preferenceEntries.slice(0, 3);
                    const remainingPreferences = Math.max(0, preferenceEntries.length - entriesToShow.length);
                    const preferenceNote = preferenceDisplay?.note;
                    const tutorEmail = patient.guardian_email || patient.email;
                    const tutorPhone = patient.guardian_phone;

                    return (
                      <TableRow key={patient.id} className="align-top">
                        <TableCell>
                          <motion.div
                            custom={index}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="flex items-start gap-3"
                          >
                            <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">
                              {getInitials(patient.name)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-gray-900">{patient.name}</span>
                                <Badge variant="secondary" className="capitalize">
                                  <Sparkles className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                                  {formatEmotionLabel(patient.currentEmotion)}
                                </Badge>
                              </div>
                              {patient.diagnosis.length > 0 && (
                                <div className="flex flex-wrap gap-2 text-xs">
                                  {patient.diagnosis.slice(0, 2).map((item) => (
                                    <Badge key={item} variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                      {item}
                                    </Badge>
                                  ))}
                                  {patient.diagnosis.length > 2 && (
                                    <Badge variant="outline" className="border-dashed border-emerald-200 text-emerald-700">
                                      +{patient.diagnosis.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-emerald-500" />
                              <span>{formatBirthDate(patient.date_of_birth)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                                {patient.age !== undefined ? `${patient.age} años` : 'Edad no registrada'}
                              </span>
                              {patient.asd_level && (
                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-600">{patient.asd_level}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-emerald-500" />
                              <span>{patient.guardian_name || 'Tutor no registrado'}</span>
                            </div>
                            {patient.address && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                                <span>{patient.address}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-emerald-500" />
                              <span className="truncate">{tutorEmail || 'Sin correo'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-emerald-500" />
                              <span>{tutorPhone || 'Sin teléfono'}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-gray-600">
                          {entriesToShow.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {entriesToShow.map((entry) => (
                                <span
                                  key={`${patient.id}-${entry.label}`}
                                  className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700"
                                >
                                  <span className="font-semibold">{entry.label}:</span> {entry.value}
                                </span>
                              ))}
                              {remainingPreferences > 0 && (
                                <span className="rounded-full border border-dashed border-emerald-200 px-2 py-1 text-xs text-emerald-600">
                                  +{remainingPreferences} registro{remainingPreferences === 1 ? '' : 's'} adicional{remainingPreferences === 1 ? '' : 'es'}
                                </span>
                              )}
                            </div>
                          ) : preferenceNote ? (
                            <p className="whitespace-pre-line text-xs text-gray-600">{preferenceNote}</p>
                          ) : (
                            <span className="text-xs italic text-gray-400">Sin preferencias registradas.</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-gray-500">
                          <div className="flex items-center justify-end gap-2 text-xs">
                            <Clock3 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>{formatUpdatedAt(patient.updatedAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => setSelectedPatient(patient)} className="inline-flex items-center gap-1">
                            <Activity className="h-4 w-4" />
                            Ver detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
