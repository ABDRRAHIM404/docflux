'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, FileText, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Patient, Appointment } from '@/types';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatientData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: patientData, error: pError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (pError) throw pError;

      const { data: historyData, error: hError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('start_time', { ascending: false });

      if (hError) throw hError;

      setPatient(patientData);
      setHistory(historyData || []);
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching patient data:', error.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    setTimeout(() => {
      fetchPatientData();
    }, 0);
  }, [fetchPatientData]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!patient) {
    return <div className="text-center py-20 text-slate-500">Patient non trouvé.</div>;
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-6 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Retour à la liste
      </button>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Patient Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="h-24 bg-blue-600"></div>
            <div className="px-6 pb-6 -mt-12">
              <div className="h-20 w-20 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center text-2xl font-bold text-blue-600 mb-4">
                {patient.name[0].toUpperCase()}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-4">{patient.name}</h1>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="h-5 w-5 text-slate-400" />
                  <span className="font-medium">{patient.phone}</span>
                </div>
                <div className="flex items-start gap-3 text-slate-600">
                  <FileText className="h-5 w-5 text-slate-400 mt-1" />
                  <p className="text-sm leading-relaxed">
                    {patient.notes || 'Aucune note disponible.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visit History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">Historique des visites</h2>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Aucun rendez-vous enregistré pour ce patient.
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200 transition-all">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">
                        {format(new Date(app.start_time), 'd MMMM yyyy', { locale: fr })}
                      </span>
                      <span className="text-sm text-slate-500">
                        {format(new Date(app.start_time), 'HH:mm')} - {format(new Date(app.end_time), 'HH:mm')}
                      </span>
                    </div>
                    <div className="text-sm font-medium px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
                      {app.status === 'termine' ? 'Terminé' : app.status === 'absent' ? 'Absent' : app.status === 'annule' ? 'Annulé' : 'Autre'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
