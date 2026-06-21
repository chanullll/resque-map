"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getDistance } from "@/lib/utils";
import Stats from "@/components/Stats";
import { 
  AlertCircle, MapPin, Activity, Heart, LifeBuoy, Utensils, 
  ChevronRight, Navigation, X, ShieldCheck, Zap, Search, CloudRain 
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
  const [searchQuery, setSearchQuery] = useState(""); // සෙවීමට අවශ්‍ය state එක

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
      const { error } = await supabase.from("requests").insert([{ latitude: userLoc[0], longitude: userLoc[1], message: `${type} assistance required.`, emergency_type: type, status: "pending" }]);
      if (error) throw error;
      setShowOptions(false);
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  // සෙවීම සහ පෙරීම (Search & Filter) දෙකම එකවර සිදු කිරීම
  const filteredList = requests.filter(r => {
    const matchesFilter = activeFilter === 'All' || r.emergency_type === activeFilter;
    const matchesSearch = r.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.emergency_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <main className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans antialiased text-slate-900">
      
      {/* Sidebar Section */}
      <div className="w-full md:w-[400px] bg-white shadow-2xl flex flex-col z-30 border-r border-slate-100">
        
        {/* Modern Header */}
        <div className="p-8 bg-slate-900 text-white relative">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-black italic tracking-tighter leading-none flex items-center gap-2">
              <Zap className="text-rose-500 fill-rose-500 w-8 h-8" /> RESQUEMAP
            </h1>
            {/* Simple Weather Widget Mockup */}
            <div className="flex flex-col items-end opacity-60">
              <CloudRain className="w-5 h-5" />
              <span className="text-[10px] font-bold mt-1">28°C Rain</span>
            </div>
          </div>
          
          <div className="flex bg-slate-800 p-1 rounded-2xl mt-8 border border-slate-700/50 text-[9px] font-black uppercase tracking-widest">
            <button onClick={() => setViewMode('emergencies')} className={`flex-1 py-2.5 rounded-xl transition-all ${viewMode === 'emergencies' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Incidents</button>
            <button onClick={() => setViewMode('safezones')} className={`flex-1 py-2.5 rounded-xl transition-all ${viewMode === 'safezones' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Shelters</button>
            <button onClick={() => setViewMode('stats')} className={`flex-1 py-2.5 rounded-xl transition-all ${viewMode === 'stats' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Analytics</button>
          </div>
        </div>

        {/* Dynamic Search & List Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
          
          {viewMode === 'emergencies' && (
            <>
              {/* Search Bar */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search incidents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-100 py-3 pl-11 pr-4 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                />
              </div>

              <div className="px-1 py-1 flex gap-2 overflow-x-auto no-scrollbar mb-2">
                {['All', 'Medical', 'Food', 'Rescue'].map((cat) => (
                  <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeFilter === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-100'}`}>{cat}</button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredList.map((req) => (
                  <div key={req.id} onClick={() => setSelectedLoc([req.latitude, req.longitude])} className={`group p-5 rounded-[2rem] border-2 transition-all cursor-pointer transform hover:scale-[1.02] bg-white shadow-sm ${req.status === 'pending' ? 'border-slate-100 hover:border-rose-300' : 'border-slate-100 hover:border-amber-300'}`}>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${req.status === 'pending' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></div>
                        <span className={req.status === 'pending' ? 'text-rose-600' : 'text-amber-600'}>{req.status}</span>
                      </div>
                      {userLoc && <div className="text-slate-400 bg-slate-50 px-2 py-1 rounded-lg"> {getDistance(userLoc[0], userLoc[1], req.latitude, req.longitude)} KM </div>}
                    </div>
                    <p className="mt-4 text-sm font-bold text-slate-700 leading-tight">{req.message}</p>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[9px] font-black text-slate-300 uppercase italic tracking-tighter">
                      <span>{req.emergency_type} Support</span>
                      <ChevronRight className="w-3 h-3 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {viewMode === 'safezones' && (
            <div className="space-y-4 animate-in fade-in duration-500">
               {/* ... (Safe Zones list එලෙසම තියන්න) */}
            </div>
          )}

          {viewMode === 'stats' && (
            <Stats requests={requests} />
          )}
        </div>

        {/* SOS Action Area */}
        <div className="p-6 bg-white border-t border-slate-100">
          {/* ... (SOS බොත්තම කලින් වගේමයි) */}
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 relative overflow-hidden">
        <Map onRequestsUpdate={(data) => setRequests(data)} selectedLocation={selectedLoc} filter={activeFilter} safeZones={safeZones} />
      </div>
    </main>
  );
}