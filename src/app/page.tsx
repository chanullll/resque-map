"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getDistance } from "@/lib/utils";
import Stats from "@/components/Stats";
import { 
  AlertCircle, MapPin, Activity, Heart, LifeBuoy, Utensils, 
  ChevronRight, Navigation, X, ShieldCheck, Zap, Search, Camera, ImageIcon
} from "lucide-react";

const Map = dynamic(() => import("@/components/Map").then((mod) => mod.default), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-slate-50 animate-pulse flex items-center justify-center font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Synchronizing Map Data</div>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]));
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
      let imageUrl = null;

      // පින්තූරයක් ඇත්නම් එය Storage එකට upload කිරීම
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('request_image')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from('request_image')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl.publicUrl;
      }

      const { error } = await supabase.from("requests").insert([{ 
        latitude: userLoc[0], 
        longitude: userLoc[1], 
        message: `${type} assistance required immediately.`, 
        emergency_type: type, 
        status: "pending",
        image_url: imageUrl 
      }]);

      if (error) throw error;
      setFile(null);
      setShowOptions(false);
      alert("SOS sent successfully with photo evidence!");
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const filteredList = requests.filter(r => {
    const matchesFilter = activeFilter === 'All' || r.emergency_type === activeFilter;
    const matchesSearch = r.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <main className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      <div className="w-full md:w-[400px] bg-white shadow-2xl flex flex-col z-30 border-r border-slate-100">
        
        {/* Header */}
        <div className="p-8 bg-slate-900 text-white relative">
          <h1 className="text-3xl font-black italic tracking-tighter leading-none flex items-center gap-2">
            <Zap className="text-rose-500 fill-rose-500 w-8 h-8" /> RESQUEMAP
          </h1>
          <div className="flex bg-slate-800 p-1 rounded-2xl mt-8 border border-slate-700/50">
            <button onClick={() => setViewMode('emergencies')} className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'emergencies' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Incidents</button>
            <button onClick={() => setViewMode('safezones')} className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'safezones' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Shelters</button>
            <button onClick={() => setViewMode('stats')} className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'stats' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Analytics</button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          {viewMode === 'emergencies' && (
            <>
              <div className="relative group mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input type="text" placeholder="Search incidents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-100 py-3 pl-11 pr-4 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm" />
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                {['All', 'Medical', 'Food', 'Rescue'].map((cat) => (
                  <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeFilter === cat ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-50'}`}>{cat}</button>
                ))}
              </div>
              {filteredList.map((req) => (
                <div key={req.id} onClick={() => setSelectedLoc([req.latitude, req.longitude])} className="p-5 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-rose-300 transition-all cursor-pointer shadow-sm">
                   <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className={req.status === 'pending' ? 'text-rose-600' : 'text-amber-600'}>{req.status}</span>
                    {userLoc && <span className="text-slate-400 bg-slate-50 px-2 py-1 rounded-lg italic"> {getDistance(userLoc[0], userLoc[1], req.latitude, req.longitude)} KM </span>}
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-700 leading-tight">{req.message}</p>
                  {req.image_url && <div className="mt-3 flex items-center gap-1 text-emerald-500 text-[9px] font-black uppercase tracking-widest"><ImageIcon className="w-3 h-3" /> Photo Attached</div>}
                </div>
              ))}
            </>
          )}
          {viewMode === 'safezones' && (
             <div className="space-y-4">
               {safeZones.map((zone) => (
                 <div key={zone.id} onClick={() => setSelectedLoc([zone.latitude, zone.longitude])} className="p-6 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-emerald-300 transition-all cursor-pointer shadow-sm">
                    <span className="text-[9px] font-black px-3 py-1 bg-emerald-100 text-emerald-700 rounded-xl uppercase">{zone.type}</span>
                    <p className="mt-4 text-sm font-black text-slate-700 uppercase tracking-tight leading-none">{zone.name}</p>
                 </div>
               ))}
             </div>
          )}
          {viewMode === 'stats' && <Stats requests={requests} />}
        </div>

        {/* Action Area */}
        <div className="p-6 bg-white border-t border-slate-100">
          {!showOptions ? (
            <button onClick={() => setShowOptions(true)} className="w-full h-20 bg-rose-600 text-white text-lg font-black rounded-[2.5rem] shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3 animate-pulse uppercase tracking-widest">
              <AlertCircle className="w-6 h-6" /> Send SOS Signal
            </button>
          ) : (
            <div className="space-y-4">
              <label className="flex items-center justify-center gap-3 bg-slate-50 border-2 border-dashed border-slate-200 p-4 rounded-[2rem] cursor-pointer hover:bg-slate-100 transition-all group">
                <Camera className={`w-5 h-5 ${file ? 'text-emerald-500' : 'text-slate-400 group-hover:text-blue-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {file ? "Photo Captured" : "Attach Evidence"}
                </span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button disabled={loading} onClick={() => sendSOS('Medical')} className="flex flex-col items-center bg-orange-50 border border-orange-100 text-orange-600 p-4 rounded-3xl"><Heart className="w-6 h-6 mb-2" /><span className="text-[9px] font-black uppercase">Medical</span></button>
                <button disabled={loading} onClick={() => sendSOS('Food')} className="flex flex-col items-center bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-3xl"><Utensils className="w-6 h-6 mb-2" /><span className="text-[9px] font-black uppercase">Food</span></button>
                <button disabled={loading} onClick={() => sendSOS('Rescue')} className="flex flex-col items-center bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-3xl"><LifeBuoy className="w-6 h-6 mb-2" /><span className="text-[9px] font-black uppercase">Rescue</span></button>
                <button onClick={() => setShowOptions(false)} className="col-span-3 py-2 text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 mt-2"><X className="w-3 h-3" /> Cancel SOS</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <Map onRequestsUpdate={(data) => setRequests(data)} selectedLocation={selectedLoc} filter={activeFilter} safeZones={safeZones} />
      </div>
    </main>
  );
}