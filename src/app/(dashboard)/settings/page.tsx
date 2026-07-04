'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Loader2, MessageSquare } from 'lucide-react';

export default function SettingsPage() {
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('doctors')
        .select('message_template')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setTemplate(data?.message_template || '');
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching settings:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      fetchSettings();
    }, 0);
  }, [fetchSettings]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('doctors')
        .update({ message_template: template })
        .eq('id', user.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Modèle mis à jour avec succès !' });
    } catch (err) {
      const error = err as Error;
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la sauvegarde.' });
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-slate-500">Configurez votre cabinet</p>
      </div>

      <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">Modèle de rappel WhatsApp</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Utilisez les balises suivantes pour personnaliser le message: 
            <code className="ml-2 px-1 py-0.5 bg-slate-100 text-blue-600 rounded">{"{patient_name}"}</code>, 
            <code className="ml-2 px-1 py-0.5 bg-slate-100 text-blue-600 rounded">{"{date}"}</code>, 
            <code className="ml-2 px-1 py-0.5 bg-slate-100 text-blue-600 rounded">{"{heure}"}</code>, 
            <code className="ml-2 px-1 py-0.5 bg-slate-100 text-blue-600 rounded">{"{clinic_name}"}</code>
          </p>
          
          <textarea
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[150px] font-sans"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          />

          {message && (
            <div className={`p-3 text-sm rounded-lg border ${
              message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
            }`}>
              {message.text}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
}
