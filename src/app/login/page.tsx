"use client";

import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';

// මෙම පේළිය අනිවාර්යයෙන්ම 'export default function' ලෙස තිබිය යුතුයි
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // පරිශීලකයා ලොග් වූ සැණින් හෝම් පේජ් එකට යවන්න
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen bg-slate-900 items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-slate-900 p-4 rounded-3xl mb-4 shadow-xl shadow-rose-500/20">
            <Zap className="text-rose-500 fill-rose-500 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
            Volunteer Access
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-3">
            ResqueMap Secure Portal
          </p>
        </div>

        <div className="auth-container">
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: { 
                default: { 
                  colors: { 
                    brand: '#e11d48', 
                    brandAccent: '#be123c' 
                  } 
                } 
              }
            }}
            theme="light"
            providers={[]}
          />
        </div>
        
        <button 
          onClick={() => router.push('/')} 
          className="w-full mt-6 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-rose-600 transition-colors"
        >
          ← Return to Public Map
        </button>
      </div>
    </div>
  );
}