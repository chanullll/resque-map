"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getDistance } from "@/lib/utils";
import Stats from "@/components/Stats";
import { CardSkeleton, ChartSkeleton } from "@/components/Skeleton"; // අලුතින් එකතු කළා
import { motion, AnimatePresence } from "framer-motion"; // Animations සඳහා
import { useRouter } from 'next/navigation';
import { 
  AlertCircle, Activity, Heart, LifeBuoy, Utensils, ChevronRight, 
  X, Camera, Zap, Search, LogIn, LogOut, User, Navigation, Loader2 
} from "lucide-react";

const Map = dynamic(() => import("@/components/Map").then((mod) => mod.default), { 
  ssr: false, 
  loading: () => (
    <div className="h-full w-full bg-slate-50 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Initializing Engine</p>
    </div>
  )
});

export default function Home() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [safeZones, setSafeZones] = useState<any[]>([]);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [selectedLoc, setSelectedLoc] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(true); // මුලින්ම Load වන විට
  const [showOptions, setShowOptions] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showShelterRoute, setShowShelterRoute] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'emergencies' | 'safezones' | 'stats'>('emergencies');
  const [searchQuery, setSearchQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
        () => console.log("Location denied")
      );
    }

    const fetchData = async () => {
      setAppLoading(true);
      const { data: reqs } = await supabase.from("requests").select("*").neq("status", "resolved");
      const { data: zones } = await supabase.from("safe_zones").select("*");
      if (reqs) setRequests(reqs);
      if (zones) setSafeZones(zones);
      setAppLoading(false);
    };

    fetchData();
  }, []);

  const sendSOS = async (type: string) => {
    if (!userLoc) return;
    setLoading(true);
    try {
      let imageUrl = null;
      if (file) {
        const fileName = `${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('request_image').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from('request_image').getPublicUrl(fileName);
        imageUrl = publicUrl.publicUrl;
      }
      await supabase.from("requests").insert([{ latitude: userLoc[0], longitude: userLoc[1], message: `${type} assistance required.`, emergency_type: type, status: "pending", image_url: imageUrl }]);
      setFile(null); setShowOptions(false);
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const filteredList = requests.filter(r => (activeFilter === 'All' || r.emergency_type === activeFilter) && r.message.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <main className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900 antialiased">
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }}
        className="w-full md:w-[400px] bg-white shadow-2xl flex flex-col z-30 border-r border-slate-100"
      >
        <div className="p-8 bg-slate-900 text-white relative">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black italic tracking-tighter flex items-center gap-2">
              <Zap className="text-rose-500 fill-rose-500 w-8 h-8" /> RESQUEMAP
            </h1>
            {session ? (
              <button onClick={() => supabase.auth.signOut()} className="p-2 bg-slate-800 rounded-xl hover:bg-rose-500 transition-colors"><LogOut className="w-4 h-4" /></button>
            ) : (
              <button onClick={() => router.push('/login')} className="bg-slate-800 px-3 py-1.5 rounded-xl hover:bg-blue-600 transition-all text-[9px] font-black uppercase flex items-center gap-2"><LogIn className="w-3 h-3" /> Login</button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={() => setShowHeatmap(!showHeatmap)} className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${showHeatmap ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-200' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              {showHeatmap ? '🔥 Disable Heatmap' : '📡 Enable Heatmap View'}
            </button>
            <button onClick={() => setShowShelterRoute(!showShelterRoute)} className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${showShelterRoute ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              <Navigation className="w-3 h-3" /> {showShelterRoute ? '🛑 Stop Navigation' : '⛺ Find Nearest Shelter'}
            </button>
          </div>
          
          <div className="flex bg-slate-800 p-1 rounded-2xl mt-6 border border-slate-700/50">
            {['emergencies', 'safezones', 'stats'].map((mode: any) => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === mode ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500'}`}>{mode}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          <AnimatePresence mode="wait">
            {appLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
              </div>
            ) : (
              <motion.div 
                key={viewMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {viewMode === 'emergencies' && (
                  <>
                    <div className="relative group mb-4">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input type="text" placeholder="Search incidents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-100 py-3 pl-11 pr-4 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-500/10 transition-all" />
                    </div>
                    {filteredList.map((req) => (
                      <div key={req.id} onClick={() => setSelectedLoc([req.latitude, req.longitude])} className="p-5 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-rose-300 transition-all cursor-pointer shadow-sm transform hover:scale-[1.02]">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase">
                          <span className={req.status === 'pending' ? 'text-rose-600 font-black' : 'text-amber-600 font-black'}>{req.status}</span>
                          {userLoc && <span className="text-slate-400 bg-slate-50 px-2 py-1 rounded-lg"> {getDistance(userLoc[0], userLoc[1], req.latitude, req.longitude)} KM </span>}
                        </div>
                        <p className="mt-4 text-sm font-bold text-slate-700 leading-tight">{req.message}</p>
                      </div>
                    ))}
                  </>
                )}
                {viewMode === 'safezones' && safeZones.map((zone) => <div key={zone.id} onClick={() => setSelectedLoc([zone.latitude, zone.longitude])} className="p-6 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-emerald-300 transition-all cursor-pointer shadow-sm group"><span className="text-[9px] font-black px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg mb-3 inline-block uppercase">{zone.type}</span><p className="text-sm font-black text-slate-700 uppercase">{zone.name}</p></div>)}
                {viewMode === 'stats' && <Stats requests={requests} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SOS Action Area */}
        <div className="p-6 bg-white border-t border-slate-100">
          {!showOptions ? (
            <button onClick={() => setShowOptions(true)} className="w-full h-20 bg-rose-600 text-white text-lg font-black rounded-[2.5rem] shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3 animate-pulse uppercase tracking-widest">
              <AlertCircle className="w-6 h-6" /> Send SOS Signal
            </button>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
              <label className="flex items-center justify-center gap-3 bg-slate-50 border-2 border-dashed border-slate-200 p-4 rounded-[2rem] cursor-pointer hover:bg-slate-100 transition-all group">
                <Camera className={`w-5 h-5 ${file ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className="text-[10px] font-black uppercase text-slate-400">{file ? "Photo Attached" : "Capture Evidence"}</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Medical', 'Food', 'Rescue'].map(t => (
                  <button key={t} disabled={loading} onClick={() => sendSOS(t)} className="flex flex-col items-center bg-slate-50 border-2 border-slate-100 p-4 rounded-3xl transition-all hover:bg-rose-50 hover:border-rose-100 group">
                    {t === 'Medical' ? <Heart className="w-6 h-6 mb-2 text-rose-500" /> : t === 'Food' ? <Utensils className="w-6 h-6 mb-2 text-emerald-500" /> : <LifeBuoy className="w-6 h-6 mb-2 text-blue-500" />}
                    <span className="text-[9px] font-black uppercase text-slate-600 group-hover:text-rose-600">{t}</span>
                  </button>
                ))}
                <button onClick={() => setShowOptions(false)} className="col-span-3 py-2 text-slate-400 font-black text-[10px] uppercase text-center mt-2 tracking-widest"><X className="w-3 h-3 mx-auto" /> Cancel</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
      
      <div className="flex-1 relative overflow-hidden">
        <Map onRequestsUpdate={(data: any) => setRequests(data)} selectedLocation={selectedLoc} filter={activeFilter} safeZones={safeZones} showHeatmap={showHeatmap} isVolunteer={!!session} showShelterRoute={showShelterRoute} />
      </div>
    </main>
  );
}