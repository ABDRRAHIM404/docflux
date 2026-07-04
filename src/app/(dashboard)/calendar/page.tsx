'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { format, addDays, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Loader2, X } from 'lucide-react';
import { AppointmentWithPatient, Patient } from '@/types';

const STATUS_MAP: Record<string, { label: string; color: string; manual: boolean }> = {
  en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-700 border-amber-200', manual: false },
  envoye: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700 border-blue-200', manual: false },
  confirme: { label: 'Confirmé', color: 'bg-green-100 text-green-700 border-green-200', manual: true },
  termine: { label: 'Terminé', color: 'bg-slate-100 text-slate-700 border-slate-200', manual: true },
  absent: { label: 'Absent', color: 'bg-red-100 text-red-700 border-red-200', manual: true },
  annule: { label: 'Annulé', color: 'bg-slate-100 text-slate-400 border-slate-200 line-through', manual: true },
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState<AppointmentWithPatient | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);

  const [form, setForm] = useState({
    patient_id: '',
    start_time: '',
    duration: 30,
  });

  const fetchPatients = useCallback(async () => {
    const { data } = await supabase.from('patients').select('*').order('name');
    setPatients(data || []);
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const start = startOfDay(currentDate).toISOString();
    const end = endOfDay(currentDate).toISOString();

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(name)')
        .gte('start_time', start)
        .lte('start_time', end)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAppointments((data as unknown as AppointmentWithPatient[]) || []);
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching appointments:', error.message);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    setTimeout(() => {
      fetchAppointments();
      fetchPatients();
    }, 0);
  }, [fetchAppointments, fetchPatients]);

  async function handleSaveAppointment(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const startTime = new Date(form.start_time);
      const endTime = new Date(startTime.getTime() + form.duration * 60000);

      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', user.id)
        .neq('id', editingApp?.id || '')
        .or(`and(start_time.lt.${endTime.toISOString()},end_time.gt.${startTime.toISOString()})`);

      if (conflicts && conflicts.length > 0) {
        setModalError('Ce créneau chevauche un autre rendez-vous.');
        setIsSaving(false);
        return;
      }

      const appointmentData = {
        doctor_id: user.id,
        patient_id: form.patient_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      };

      if (editingApp) {
        const { error } = await supabase.from('appointments').update(appointmentData).eq('id', editingApp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('appointments').insert([appointmentData]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingApp(null);
      await fetchAppointments();
    } catch (err) {
      const error = err as Error;
      setModalError(error.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStatus(appId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appId);
      if (error) throw error;
      await fetchAppointments();
    } catch (err) {
      const error = err as Error;
      console.error('Error updating status:', error.message);
    }
  }

  async function deleteAppointment(appId: string) {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    try {
      await supabase.from('appointments').delete().eq('id', appId);
      await fetchAppointments();
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting appointment:', error.message);
    }
  }

  const openCreateModal = () => {
    setEditingApp(null);
    setForm({
      patient_id: '',
      start_time: format(currentDate, "yyyy-MM-dd'T'HH:mm"),
      duration: 30,
    });
    setShowModal(true);
  };

  const openEditModal = (app: AppointmentWithPatient) => {
    setEditingApp(app);
    setForm({
      patient_id: app.patient_id,
      start_time: app.start_time.substring(0, 16),
      duration: (new Date(app.end_time).getTime() - new Date(app.start_time).getTime()) / 60000,
    });
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendrier</h1>
          <p className="text-slate-500">{format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(subDays(currentDate, 1))}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors text-sm font-medium"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <button
        onClick={openCreateModal}
        className="w-full md:w-auto mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold"
      >
        <Plus className="h-5 w-5" />
        Nouveau Rendez-vous
      </button>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
              Aucun rendez-vous pour cette journée.
            </div>
          ) : (
            appointments.map((app) => (
              <div key={app.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-300 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <div className="text-sm font-bold text-slate-900">
                      {format(parseISO(app.start_time), 'HH:mm')}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">Fin {format(parseISO(app.end_time), 'HH:mm')}</div>
                  </div>
                  <div className="h-10 w-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold">
                    {app.patients?.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{app.patients?.name}</div>
                    <div className="text-xs text-slate-500">Durée: {((new Date(app.end_time).getTime() - new Date(app.start_time).getTime()) / 60000)} min</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative inline-block">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border outline-none appearance-none cursor-pointer ${STATUS_MAP[app.status].color}`}
                    >
                      {Object.entries(STATUS_MAP)
                        .filter(([ , v]) => v.manual)
                        .map(([val, { label }]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight className="h-3 w-3 rotate-90 opacity-50" />
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal(app)}
                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <Clock className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteAppointment(app.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                {editingApp ? 'Modifier rendez-vous' : 'Nouveau rendez-vous'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSaveAppointment} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Patient</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <select
                    required
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                    value={form.patient_id}
                    onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                  >
                    <option value="">Sélectionner un patient...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Heure de début</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <input
                      required
                      type="datetime-local"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Durée (min)</label>
                  <input
                    required
                    type="number"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              {modalError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                  {modalError}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium text-slate-600"
                >
                  Annuler
                </button>
                <button
                  disabled={isSaving}
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
