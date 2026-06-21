"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getDistance } from "@/lib/utils";
import { AlertCircle, MapPin, Activity, Heart, LifeBuoy, Utensils, ChevronRight, Navigation, X, ShieldCheck } from "lucide-react";

const Map = dynamic(() => import("@/components/Map").then((mod) => mod.default), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-slate-50 animate-pulse flex items-center justify-center font-bold text-slate-400">INITIALISING LIVE MAP...</div>
});

export default function Home() {
  const [requests, setRequests] = useState<any[]>([]);
  const [safeZones, setSafeZones] = useState<any[]>([]); // Safe Zones දත්ත ගබඩා කිරීමට
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [selectedLoc, setSelectedLoc] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'emergencies' | 'safezones'>('emergencies');

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]));
    }
    fetchSafeZones(); // Safe zones මුලින්ම ලෝඩ් කරනවා
  }, []);

  const fetchSafeZones = async () => {
    const { data, error } = await supabase.from("safe_zones").select("*");
    if (error) console.error("Error fetching safe zones:", error);
    if (data) setSafeZones(data);
  };

  const sendSOS = async (type: string) => {
    if (!userLoc) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("requests").insert([{ latitude: userLoc[0], longitude: userLoc[1], message: `${type} assistance required.`, emergency_type: type, status: "pending" }]);
      if (error) throw error;
      setShowOptions(false);
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const filteredList = activeFilter === 'All' ? requests : requests.filter(r => r.emergency_type === activeFilter);

  return (
    <main className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      <div className="w-full md:w-[400px] bg-white shadow-2xl flex flex-col z-30 border-r border-slate-100">
        
        {/* Header & Toggle */}
        <div className="p-8 bg-slate-900 text-white shadow-lg">
          <h1 className="text-3xl font-black italic tracking-tighter leading-none flex items-center gap-2">
            <AlertCircle className="text-rose-500 w-8 h-8" /> RESQUEMAP
          </h1>
          <div className="flex bg-slate-800 p-1 rounded-xl mt-6 border border-slate-700">
            <button onClick={() => setViewMode('emergencies')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'emergencies' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}>Emergencies</button>
            <button onClick={() => setViewMode('safezones')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'safezones' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}>Safe Zones</button>
          </div>
        </div>

        {/* Sidebar List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          {viewMode === 'emergencies' ? (
            <>
              <div className="px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar mb-2">
                {['All', 'Medical', 'Food', 'Rescue'].map((cat) => (
                  <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeFilter === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{cat}</button>
                ))}
              </div>
              {filteredList.map((req) => (
                <div key={req.id} onClick={() => setSelectedLoc([req.latitude, req.longitude])} className="p-5 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-rose-300 transition-all cursor-pointer shadow-sm">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                    <span className={req.status === 'pending' ? 'text-rose-600' : 'text-amber-600'}>{req.status}</span>
                    {userLoc && <span className="text-slate-400"> {getDistance(userLoc[0], userLoc[1], req.latitude, req.longitude)} KM </span>}
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-700 leading-snug">{req.message}</p>
                </div>
              ))}
            </>
          ) : (
            <div className="space-y-4">
              <h2 className="font-bold text-emerald-500 text-[11px] uppercase tracking-widest px-1">Safe Havens</h2>
              {safeZones.map((zone) => (
                <div key={zone.id} onClick={() => setSelectedLoc([zone.latitude, zone.longitude])} className="p-5 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-emerald-300 transition-all cursor-pointer shadow-sm group">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">{zone.type}</span>
                    {userLoc && <span className="text-slate-400">{getDistance(userLoc[0], userLoc[1], zone.latitude, zone.longitude)} KM</span>}
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-700">{zone.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SOS Button Area */}
        <div className="p-6 bg-white border-t border-slate-100">
          {!showOptions ? (
            <button onClick={() => setShowOptions(true)} className="w-full h-20 bg-rose-600 text-white text-lg font-black rounded-[2rem] shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3 animate-pulse">
              <AlertCircle className="w-6 h-6" /> SEND SOS SIGNAL
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => sendSOS('Medical')} className="flex flex-col items-center bg-orange-50 text-orange-600 p-4 rounded-3xl"><Heart className="w-6 h-6 mb-2" /><span className="text-[10px] font-black uppercase">Medical</span></button>
              <button onClick={() => sendSOS('Food')} className="flex flex-col items-center bg-emerald-50 text-emerald-600 p-4 rounded-3xl"><Utensils className="w-6 h-6 mb-2" /><span className="text-[10px] font-black uppercase">Food</span></button>
              <button onClick={() => sendSOS('Rescue')} className="flex flex-col items-center bg-rose-50 text-rose-600 p-4 rounded-3xl"><LifeBuoy className="w-6 h-6 mb-2" /><span className="text-[10px] font-black uppercase">Rescue</span></button>
              <button onClick={() => setShowOptions(false)} className="col-span-3 py-2 text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 mt-2"><X className="w-3 h-3" /> Cancel</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <Map onRequestsUpdate={(data) => setRequests(data)} selectedLocation={selectedLoc} filter={activeFilter} safeZones={safeZones} />
      </div>
    </main>
  );
}