'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, addHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Send, Loader2, User, Clock } from 'lucide-react';
import { AppointmentWithPatient, Doctor } from '@/types';

export default function RemindersPage() {
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: docData } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', user.id)
        .single();
      setDoctor(docData);

      const now = new Date();
      const tomorrow = addHours(now, 24);

      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients(name, phone)')
        .eq('doctor_id', user.id)
        .gte('start_time', now.toISOString())
        .lte('start_time', tomorrow.toISOString())
        .in('status', ['en_attente', 'envoye'])
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAppointments((data as unknown as AppointmentWithPatient[]) || []);
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching reminders:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReminder(app: AppointmentWithPatient) {
    setSendingId(app.id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'envoye' })
        .eq('id', app.id);
      if (error) throw error;

      const template = doctor?.message_template || 'Bonjour {patient_name}, rappel de votre rendez-vous le {date} à {heure}. — Cabinet {clinic_name}';
      const message = template
        .replace('{patient_name}', app.patients.name)
        .replace('{date}', format(new Date(app.start_time), 'dd/MM', { locale: fr }))
        .replace('{heure}', format(new Date(app.start_time), 'HH:mm'))
        .replace('{clinic_name}', doctor?.clinic_name || '');

      const encodedMsg = encodeURIComponent(message);
      const phone = app.patients.phone;

      window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
      
      await fetchData();
    } catch (err) {
      const error = err as Error;
      console.error('Error sending reminder:', error.message);
    } finally {
      setSendingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Rappels</h1>
        <p className="text-slate-500">Rendez-vous des prochaines 24h à confirmer</p>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
          Aucun rappel urgent pour le moment.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((app) => (
            <div key={app.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    {app.patients.name[0].toUpperCase()}
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${
                    app.status === 'envoye' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {app.status === 'envoye' ? 'Déjà Envoyé' : 'En attente'}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{app.patients.name}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(app.start_time), 'HH:mm lll', { locale: fr })}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <User className="h-4 w-4" />
                  {app.patients.phone}
                </div>
              </div>
              
              <button
                onClick={() => handleSendReminder(app)}
                disabled={sendingId === app.id}
                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold disabled:opacity-50"
              >
                {sendingId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Envoyer Rappel
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
