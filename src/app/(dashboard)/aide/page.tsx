'use client';

import { MessageCircle, Calendar, Users, Bell, Settings } from 'lucide-react';

export default function AidePage() {
  const guideItems = [
    {
      icon: Calendar,
      title: 'Gérer le Calendrier',
      description: 'Cliquez sur "Nouveau Rendez-vous" pour ajouter un patient. Le système vous alertera si le créneau est déjà pris.'
    },
    {
      icon: Users,
      title: 'Fiches Patients',
      description: 'Ajoutez vos patients et consultez leur historique de visites automatiquement. Les numéros sont normalisés au format marocain.'
    },
    {
      icon: Bell,
      title: 'Envoyer des Rappels',
      description: 'Allez dans la section "Rappels" pour voir les rendez-vous du lendemain. Un clic sur "Envoyer" ouvre WhatsApp avec le message prêt.'
    },
    {
      icon: Settings,
      title: 'Personnaliser vos Messages',
      description: 'Dans "Paramètres", modifiez le texte de vos rappels pour qu&apos;il corresponde au ton de votre cabinet.'
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Aide & Support</h1>
        <p className="text-slate-500">Tout ce qu&apos;il faut savoir pour utiliser Docflux</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {guideItems.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex gap-4">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <item.icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Besoin d&apos;une assistance personnalisée ?</h2>
        <p className="mb-8 opacity-90 max-w-md mx-auto">
          Notre équipe est disponible via WhatsApp pour répondre à toutes vos questions techniques.
        </p>
        <a
          href="https://wa.me/212600000000" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          Contacter le Support WhatsApp
        </a>
      </div>
    </div>
  );
}
