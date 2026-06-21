"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getDistance } from "@/lib/utils";
import { AlertCircle, MapPin, Activity, Heart, LifeBuoy, Utensils, ChevronRight, Navigation, X } from "lucide-react";

const Map = dynamic(() => import("@/components/Map").then((mod) => mod.default), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-slate-50 animate-pulse flex items-center justify-center font-bold text-slate-400 text-sm tracking-widest">INITIALISING LIVE MAP...</div>
});

export default function Home() {
  const [requests, setRequests] = useState<any[]>([]);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [selectedLoc, setSelectedLoc] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]));
    }
  }, []);

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
    <main className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      {/* Sidebar */}
      <div className="w-full md:w-[400px] bg-white shadow-2xl flex flex-col z-30 border-r border-slate-100">
        
        {/* Header */}
        <div className="p-8 bg-slate-900 text-white relative">
          <h1 className="text-3xl font-black italic tracking-tighter leading-none flex items-center gap-2">
            <AlertCircle className="text-rose-500 w-8 h-8" /> RESQUEMAP
          </h1>
          <div className="flex items-center gap-2 mt-4">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
             <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Live Rescue Network</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-50 bg-white">
          {['All', 'Medical', 'Food', 'Rescue'].map((cat) => (
            <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-bold text-slate-400 text-[11px] uppercase tracking-[0.15em]">Emergencies</h2>
            <span className="bg-slate-900 text-white text-[10px] font-black px-2.5 py-1 rounded-full">{filteredList.length} Active</span>
          </div>
          
          {filteredList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
               <Navigation className="w-12 h-12 mb-4" />
               <p className="text-[10px] font-black uppercase tracking-widest text-center">No signals found</p>
            </div>
          )}

          {filteredList.map((req) => (
            <div key={req.id} onClick={() => setSelectedLoc([req.latitude, req.longitude])} className={`p-5 rounded-[2rem] border-2 transition-all cursor-pointer transform hover:scale-[1.02] shadow-sm bg-white ${req.status === 'pending' ? 'border-slate-100 hover:border-rose-300' : 'border-slate-100 hover:border-amber-300'}`}>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${req.status === 'pending' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                  <span className={req.status === 'pending' ? 'text-rose-600' : 'text-amber-600'}>{req.status}</span>
                </div>
                {userLoc && <div className="text-slate-400 bg-slate-50 px-2 py-1 rounded-lg"> {getDistance(userLoc[0], userLoc[1], req.latitude, req.longitude)} KM </div>}
              </div>
              <p className="mt-4 text-sm font-bold text-slate-700 leading-snug">{req.message}</p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  {req.emergency_type === 'Medical' && <Heart className="w-3 h-3 text-orange-500" />}
                  {req.emergency_type === 'Food' && <Utensils className="w-3 h-3 text-emerald-500" />}
                  {req.emergency_type === 'Rescue' && <LifeBuoy className="w-3 h-3 text-rose-500" />}
                  {req.emergency_type}
                </div>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>

        {/* Action Area */}
        <div className="p-6 bg-white border-t border-slate-100">
          {!showOptions ? (
            <button onClick={() => setShowOptions(true)} className="w-full h-20 bg-rose-600 text-white text-lg font-black rounded-[2rem] shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3 animate-pulse">
              <AlertCircle className="w-6 h-6" /> SEND SOS SIGNAL
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => sendSOS('Medical')} className="flex flex-col items-center bg-orange-50 border-2 border-orange-100 text-orange-600 p-4 rounded-3xl transition-all">
                  <Heart className="w-6 h-6 mb-2" /><span className="text-[10px] font-black uppercase">Medical</span>
                </button>
                <button onClick={() => sendSOS('Food')} className="flex flex-col items-center bg-emerald-50 border-2 border-emerald-100 text-emerald-600 p-4 rounded-3xl transition-all">
                  <Utensils className="w-6 h-6 mb-2" /><span className="text-[10px] font-black uppercase">Food</span>
                </button>
                <button onClick={() => sendSOS('Rescue')} className="flex flex-col items-center bg-rose-50 border-2 border-rose-100 text-rose-600 p-4 rounded-3xl transition-all">
                  <LifeBuoy className="w-6 h-6 mb-2" /><span className="text-[10px] font-black uppercase">Rescue</span>
                </button>
              </div>
              <button onClick={() => setShowOptions(false)} className="w-full py-2 text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><X className="w-3 h-3" /> Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 relative overflow-hidden">
        <Map onRequestsUpdate={(data) => setRequests(data)} selectedLocation={selectedLoc} filter={activeFilter} />
      </div>
    </main>
  );
}