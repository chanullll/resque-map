"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getDistance } from "@/lib/utils";
import Stats from "@/components/Stats"; // අලුතින් හැදූ Stats component එක
import { 
  AlertCircle, 
  MapPin, 
  Activity, 
  Heart, 
  LifeBuoy, 
  Utensils, 
  ChevronRight, 
  Navigation, 
  X, 
  ShieldCheck, 
  LayoutDashboard,
  Zap
} from "lucide-react";

// සිතියම load වන තෙක් පෙන්වන පෙනුම
const Map = dynamic(() => import("@/components/Map").then((mod) => mod.default), { 
  ssr: false, 
  loading: () => (
    <div className="h-full w-full bg-slate-50 animate-pulse flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Synchronizing Map Data</p>
    </div>
  )
});

export default function Home() {
  const [requests, setRequests] = useState<any[]>([]);
  const [safeZones, setSafeZones] = useState<any[]>([]);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [selectedLoc, setSelectedLoc] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'emergencies' | 'safezones' | 'stats'>('emergencies');

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.error(err)
      );
    }
    fetchSafeZones();
  }, []);

  const fetchSafeZones = async () => {
    const { data } = await supabase.from("safe_zones").select("*");
    if (data) setSafeZones(data);
  };

  const sendSOS = async (type: string) => {
    if (!userLoc) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("requests").insert([
        {
          latitude: userLoc[0],
          longitude: userLoc[1],
          message: `${type} assistance required.`,
          emergency_type: type,
          status: "pending"
        }
      ]);
      if (error) throw error;
      setShowOptions(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredList = activeFilter === 'All' ? requests : requests.filter(r => r.emergency_type === activeFilter);

  return (
    <main className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      
      {/* Sidebar Section */}
      <div className="w-full md:w-[400px] bg-white shadow-2xl flex flex-col z-30 border-r border-slate-100">
        
        {/* Modern Sidebar Header */}
        <div className="p-8 bg-slate-900 text-white relative">
          <div className="relative z-10">
            <h1 className="text-3xl font-black italic tracking-tighter leading-none flex items-center gap-2">
              <Zap className="text-rose-500 fill-rose-500 w-8 h-8" />
              RESQUEMAP
            </h1>
            
            {/* 3-Way Toggle Navigation */}
            <div className="flex bg-slate-800 p-1 rounded-2xl mt-8 border border-slate-700/50">
              <button 
                onClick={() => setViewMode('emergencies')}
                className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'emergencies' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Incidents
              </button>
              <button 
                onClick={() => setViewMode('safezones')}
                className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'safezones' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Safe Zones
              </button>
              <button 
                onClick={() => setViewMode('stats')}
                className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'stats' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic List Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          
          {/* VIEW: Emergencies */}
          {viewMode === 'emergencies' && (
            <>
              <div className="px-1 py-1 flex gap-2 overflow-x-auto no-scrollbar mb-2">
                {['All', 'Medical', 'Food', 'Rescue'].map((cat) => (
                  <button 
                    key={cat} 
                    onClick={() => setActiveFilter(cat)} 
                    className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeFilter === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {filteredList.length === 0 && (
                  <div className="py-20 text-center opacity-20 flex flex-col items-center">
                    <Navigation className="w-10 h-10 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No active signals</p>
                  </div>
                )}
                {filteredList.map((req) => (
                  <div 
                    key={req.id} 
                    onClick={() => setSelectedLoc([req.latitude, req.longitude])} 
                    className={`group p-5 rounded-[2rem] border-2 transition-all cursor-pointer transform hover:scale-[1.02] bg-white shadow-sm ${req.status === 'pending' ? 'border-slate-100 hover:border-rose-300' : 'border-slate-100 hover:border-amber-300'}`}
                  >
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${req.status === 'pending' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                        <span className={req.status === 'pending' ? 'text-rose-600' : 'text-amber-600'}>{req.status}</span>
                      </div>
                      {userLoc && <div className="text-slate-400 bg-slate-50 px-2 py-1 rounded-lg"> {getDistance(userLoc[0], userLoc[1], req.latitude, req.longitude)} KM </div>}
                    </div>
                    <p className="mt-4 text-sm font-bold text-slate-700 leading-tight">{req.message}</p>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[9px] font-black text-slate-300 uppercase">
                      <span>{req.emergency_type}</span>
                      <ChevronRight className="w-3 h-3 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* VIEW: Safe Zones */}
          {viewMode === 'safezones' && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <h2 className="font-black text-emerald-500 text-[10px] uppercase tracking-[0.2em] px-1 mb-4">Verified Safe Zones</h2>
              {safeZones.map((zone) => (
                <div 
                  key={zone.id} 
                  onClick={() => setSelectedLoc([zone.latitude, zone.longitude])} 
                  className="p-6 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-emerald-300 transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-xl">{zone.type}</span>
                    {userLoc && <span className="text-slate-400">{getDistance(userLoc[0], userLoc[1], zone.latitude, zone.longitude)} KM</span>}
                  </div>
                  <p className="mt-4 text-sm font-black text-slate-700 uppercase tracking-tight">{zone.name}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase">
                    <ShieldCheck className="w-3 h-3" /> Safe Haven
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW: Analytics (Charts) */}
          {viewMode === 'stats' && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <Stats requests={requests} />
            </div>
          )}
        </div>

        {/* SOS Action Area */}
        <div className="p-6 bg-white border-t border-slate-100">
          {!showOptions ? (
            <button 
              onClick={() => setShowOptions(true)} 
              className="w-full h-20 bg-rose-600 text-white text-lg font-black rounded-[2.5rem] shadow-2xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center justify-center gap-3 animate-pulse"
            >
              <AlertCircle className="w-6 h-6" /> SEND SOS SIGNAL
            </button>
          ) : (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => sendSOS('Medical')} className="flex flex-col items-center bg-orange-50 border-2 border-orange-100 text-orange-600 p-4 rounded-3xl transition-all hover:bg-orange-100 group">
                  <Heart className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" /><span className="text-[9px] font-black uppercase">Medical</span>
                </button>
                <button onClick={() => sendSOS('Food')} className="flex flex-col items-center bg-emerald-50 border-2 border-emerald-100 text-emerald-600 p-4 rounded-3xl transition-all hover:bg-emerald-100 group">
                  <Utensils className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" /><span className="text-[9px] font-black uppercase">Food</span>
                </button>
                <button onClick={() => sendSOS('Rescue')} className="flex flex-col items-center bg-rose-50 border-2 border-rose-100 text-rose-600 p-4 rounded-3xl transition-all hover:bg-rose-100 group">
                  <LifeBuoy className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" /><span className="text-[9px] font-black uppercase">Rescue</span>
                </button>
              </div>
              <button onClick={() => setShowOptions(false)} className="w-full py-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:text-slate-600 transition-colors"><X className="w-3 h-3" /> Cancel SOS Request</button>
            </div>
          )}
        </div>
      </div>

      {/* Map Content - දකුණු පැත්ත */}
      <div className="flex-1 relative overflow-hidden">
        <Map 
          onRequestsUpdate={(data) => setRequests(data)} 
          selectedLocation={selectedLoc} 
          filter={activeFilter} 
          safeZones={safeZones} 
        />
      </div>
    </main>
  );
}