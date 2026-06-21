"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getDistance } from "@/lib/utils";

// Map එක Client-side එකේ විතරක් load වෙන්න dynamic import කරනවා
const Map = dynamic(() => import("@/components/Map").then((mod) => mod.default), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center font-bold text-gray-400">Loading Map View...</div>
});

export default function Home() {
  const [requests, setRequests] = useState<any[]>([]);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [selectedLoc, setSelectedLoc] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false); // SOS වර්ග තෝරන මෙනු එක පෙන්වීමට

  // පරිශීලකයාගේ වත්මන් ස්ථානය (GPS) ලබා ගැනීම
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLoc([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.error("GPS Error:", err.message)
      );
    }
  }, []);

  // තෝරාගත් SOS වර්ගය අනුව දත්ත Database එකට යැවීම
  const sendSOS = async (type: string) => {
    if (!userLoc) {
      alert("Waiting for GPS location... Please ensure location is enabled.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("requests").insert([
        {
          latitude: userLoc[0],
          longitude: userLoc[1],
          message: `${type} assistance needed immediately!`,
          emergency_type: type,
          status: "pending"
        }
      ]);

      if (error) throw error;
      
      alert(`SOS for ${type} sent successfully!`);
      setShowOptions(false); // සාර්ථක වූ පසු මෙනු එක වසන්න
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-full bg-gray-100 overflow-hidden font-sans">
      {/* Sidebar - වම් පැත්ත */}
      <div className="w-full md:w-96 bg-white shadow-2xl flex flex-col z-20">
        
        {/* Sidebar Header */}
        <div className="p-8 bg-gradient-to-br from-blue-900 to-blue-700 text-white shadow-lg">
          <h1 className="text-3xl font-black italic tracking-tighter leading-none text-blue-50">RESQUEMAP</h1>
          <p className="text-[9px] uppercase font-black tracking-[0.2em] mt-3 opacity-60">Emergency Response System</p>
        </div>

        {/* SOS Requests ලැයිස්තුව */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          <div className="flex justify-between items-center px-1 mb-2">
            <h2 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">Active Requests</h2>
            <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">
              {requests.length} Nearby
            </span>
          </div>
          
          {requests.length === 0 && (
            <div className="text-center py-16 opacity-30">
               <p className="text-sm italic font-medium">No active SOS requests</p>
            </div>
          )}

          {requests.map((req) => (
            <div 
              key={req.id}
              onClick={() => setSelectedLoc([req.latitude, req.longitude])}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer transform hover:-translate-y-1 active:scale-95 shadow-sm hover:shadow-md ${
                req.status === 'pending' ? 'bg-white border-red-50 hover:border-red-400' : 'bg-white border-yellow-50 hover:border-yellow-400'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                  req.status === 'pending' ? 'bg-red-500 text-white' : 'bg-yellow-400 text-yellow-900'
                }`}>
                  {req.status}
                </span>
                {userLoc && (
                  <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                    {getDistance(userLoc[0], userLoc[1], req.latitude, req.longitude)} KM
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm font-bold text-gray-800 leading-tight">{req.message}</p>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{req.emergency_type}</span>
                <span className="text-[10px] text-blue-600 font-black italic">View Map →</span>
              </div>
            </div>
          ))}
        </div>

        {/* SOS Button Area */}
        <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-15px_30px_rgba(0,0,0,0.03)]">
          {!showOptions ? (
            <button 
              onClick={() => setShowOptions(true)}
              className="w-full h-20 bg-red-600 text-white text-xl font-black rounded-2xl shadow-xl hover:bg-red-700 transition-all transform active:scale-95 animate-pulse"
            >
              SEND SOS HELP
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button 
                disabled={loading}
                onClick={() => sendSOS('Medical')} 
                className="bg-orange-500 text-white p-4 rounded-xl font-black text-xs uppercase hover:bg-orange-600 transition-all"
              >
                🚑 Medical
              </button>
              <button 
                disabled={loading}
                onClick={() => sendSOS('Food')} 
                className="bg-green-500 text-white p-4 rounded-xl font-black text-xs uppercase hover:bg-green-600 transition-all"
              >
                🍲 Food
              </button>
              <button 
                disabled={loading}
                onClick={() => sendSOS('Rescue')} 
                className="bg-red-500 text-white p-4 rounded-xl font-black text-xs uppercase hover:bg-red-600 transition-all"
              >
                🚣 Rescue
              </button>
              <button 
                onClick={() => setShowOptions(false)} 
                className="bg-gray-200 text-gray-600 p-4 rounded-xl font-black text-xs uppercase hover:bg-gray-300 transition-all"
              >
                ✕ Cancel
              </button>
            </div>
          )}
          <p className="text-[9px] text-center text-gray-400 mt-4 font-bold uppercase tracking-widest italic">
            Location will be shared with volunteers
          </p>
        </div>
      </div>

      {/* Map Area - දකුණු පැත්ත */}
      <div className="flex-1 relative">
        <Map 
          onRequestsUpdate={(data) => setRequests(data)} 
          selectedLocation={selectedLoc}
        />
      </div>
    </main>
  );
}