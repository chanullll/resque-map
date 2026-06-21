"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getDistance } from "@/lib/utils";

const Map = dynamic(() => import("@/components/Map").then((mod) => mod.default), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">Loading Map...</div>
});

export default function Home() {
  const [requests, setRequests] = useState<any[]>([]);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [selectedLoc, setSelectedLoc] = useState<[number, number] | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLoc([pos.coords.latitude, pos.coords.longitude]);
    });
  }, []);

  return (
    <main className="flex h-screen w-full bg-gray-100 overflow-hidden">
      {/* Sidebar - වම් පැත්ත */}
      <div className="w-full md:w-96 bg-white shadow-xl flex flex-col z-10">
        <div className="p-6 bg-blue-900 text-white">
          <h1 className="text-2xl font-black italic">RESQUEMAP</h1>
          <p className="text-xs opacity-75">Live Emergency Dashboard</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h2 className="font-bold text-gray-500 text-sm uppercase tracking-widest">Active Requests</h2>
          
          {requests.length === 0 && <p className="text-gray-400 text-sm italic">No active requests...</p>}

          {requests.map((req) => (
            <div 
              key={req.id}
              onClick={() => setSelectedLoc([req.latitude, req.longitude])}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-blue-400 ${req.status === 'pending' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${req.status === 'pending' ? 'bg-red-200 text-red-700' : 'bg-yellow-200 text-yellow-700'}`}>
                  {req.status}
                </span>
                {userLoc && (
                  <span className="text-xs font-bold text-gray-500">
                    {getDistance(userLoc[0], userLoc[1], req.latitude, req.longitude)} km away
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-semibold text-gray-800">{req.message}</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">{req.emergency_type}</p>
            </div>
          ))}
        </div>

        <div className="p-4 border-t">
          <button 
            onClick={() => window.location.reload()} // සරල SOS trigger එකක් ලෙස දැනට තබා ඇත
            className="w-full bg-red-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-red-700 transition-all"
          >
            SEND SOS HELP
          </button>
        </div>
      </div>

      {/* Map - දකුණු පැත්ත */}
      <div className="flex-1 relative">
        <Map 
          onRequestsUpdate={(data) => setRequests(data)} 
          selectedLocation={selectedLoc}
        />
      </div>
    </main>
  );
}