'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Users, Bell, Settings, HelpCircle, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const navItems = [
  { name: 'Calendrier', href: '/calendar', icon: Calendar },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Rappels', href: '/reminders', icon: Bell },
  { name: 'Paramètres', href: '/settings', icon: Settings },
  { name: 'Aide', href: '/aide', icon: HelpCircle },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex justify-around items-center z-50 md:top-0 md:left-0 md:w-64 md:h-full md:flex-col md:justify-start md:border-r md:border-t-0 md:p-4">
      <div className="hidden md:block text-2xl font-bold text-blue-600 mb-8 px-2">Docflux</div>
      
      <div className="flex md:flex-col gap-1 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-6 w-6 md:h-5 md:w-5" />
              <span className="text-[10px] md:text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <button
        onClick={handleLogout}
        className="hidden md:flex items-center gap-3 px-3 py-2 mt-auto text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
      >
        <LogOut className="h-5 w-5" />
        <span className="text-sm font-medium">Déconnexion</span>
      </button>
    </nav>
  );
}
