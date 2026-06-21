"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getDistance } from "@/lib/utils";
import { 
  AlertCircle, 
  MapPin, 
  Activity, 
  Heart, 
  LifeBuoy, 
  Utensils, 
  ChevronRight, 
  Navigation,
  X
} from "lucide-react";

const Map = dynamic(() => import("@/components/Map").then((mod) => mod.default), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-slate-50 animate-pulse flex items-center justify-center font-medium text-slate-400">Initialising Map...</div>
});

export default function Home() {
  const [requests, setRequests] = useState<any[]>([]);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [selectedLoc, setSelectedLoc] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.error(err)
      );
    }
  }, []);

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

  return (
    <main className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      {/* Sidebar */}
      <div className="w-full md:w-[400px] bg-white shadow-2xl flex flex-col z-30 border-r border-slate-100">
        
        {/* Modern Header */}
        <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-black italic tracking-tighter leading-none flex items-center gap-2">
              <AlertCircle className="text-rose-500 w-8 h-8" />
              RESQUEMAP
            </h1>
            <div className="flex items-center gap-2 mt-4">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
               <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">Live Rescue Network</p>
            </div>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-bold text-slate-400 text-[11px] uppercase tracking-[0.15em]">Nearby Emergencies</h2>
            <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              {requests.length} Active
            </span>
          </div>
          
          {requests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
               <Navigation className="w-12 h-12 mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest text-center px-10 leading-relaxed">No active signals in this area</p>
            </div>
          )}

          {requests.map((req) => (
            <div 
              key={req.id}
              onClick={() => setSelectedLoc([req.latitude, req.longitude])}
              className={`group p-5 rounded-3xl border-2 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-xl bg-white ${
                req.status === 'pending' ? 'border-slate-100 hover:border-rose-300' : 'border-slate-100 hover:border-amber-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${req.status === 'pending' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    req.status === 'pending' ? 'text-rose-600' : 'text-amber-600'
                  }`}>
                    {req.status}
                  </span>
                </div>
                {userLoc && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl">
                    <MapPin className="w-3 h-3" />
                    {getDistance(userLoc[0], userLoc[1], req.latitude, req.longitude)} KM
                  </div>
                )}
              </div>
              <p className="mt-4 text-[15px] font-bold text-slate-700 leading-snug">{req.message}</p>
              <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   {req.emergency_type === 'Medical' && <Activity className="w-4 h-4 text-orange-500" />}
                   {req.emergency_type === 'Food' && <Utensils className="w-4 h-4 text-emerald-500" />}
                   {req.emergency_type === 'Rescue' && <LifeBuoy className="w-4 h-4 text-rose-500" />}
                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{req.emergency_type}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* Action Area */}
        <div className="p-6 bg-white border-t border-slate-100">
          {!showOptions ? (
            <button 
              onClick={() => setShowOptions(true)}
              className="w-full h-20 bg-rose-600 text-white text-lg font-black rounded-[2rem] shadow-2xl shadow-rose-200 hover:bg-rose-700 transition-all transform active:scale-95 flex items-center justify-center gap-3"
            >
              <AlertCircle className="w-6 h-6" />
              SEND SOS SIGNAL
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => sendSOS('Medical')} className="flex flex-col items-center justify-center bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 text-orange-600 p-4 rounded-3xl transition-all group">
                  <Heart className="w-6 h-6 mb-2 group-hover:scale-125 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Medical</span>
                </button>
                <button onClick={() => sendSOS('Food')} className="flex flex-col items-center justify-center bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 text-emerald-600 p-4 rounded-3xl transition-all group">
                  <Utensils className="w-6 h-6 mb-2 group-hover:scale-125 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Food</span>
                </button>
                <button onClick={() => sendSOS('Rescue')} className="flex flex-col items-center justify-center bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 text-rose-600 p-4 rounded-3xl transition-all group">
                  <LifeBuoy className="w-6 h-6 mb-2 group-hover:scale-125 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Rescue</span>
                </button>
              </div>
              <button 
                onClick={() => setShowOptions(false)} 
                className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Cancel Request
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 relative">
        <Map onRequestsUpdate={(data) => setRequests(data)} selectedLocation={selectedLoc} />
      </div>
    </main>
  );
}