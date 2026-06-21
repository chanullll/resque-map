"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const Map = dynamic(() => import("@/components/Map").then((mod) => mod.default), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-200 animate-pulse flex items-center justify-center italic text-gray-500 text-lg">Loading Map View...</div>
});

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [myLocation, setMyLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // ලොකේෂන් එක ලබා ගැනීම
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("Location found:", pos.coords.latitude, pos.coords.longitude);
          setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationError(null);
        },
        (err) => {
          console.error("Location error:", err.message);
          setLocationError("Please enable location access to use the SOS feature.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  }, []);

  const sendSOS = async () => {
    console.log("SOS Button Clicked!"); // Debugging

    if (!myLocation) {
      alert("Location not found yet. Please wait or enable location.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("requests").insert([
        {
          latitude: myLocation.lat,
          longitude: myLocation.lng,
          message: "Emergency SOS - Immediate assistance needed!",
          emergency_type: "Rescue",
          status: "pending"
        }
      ]);

      if (error) throw error;
      alert("SOS Sent Successfully! Help is on the way.");
    } catch (error: any) {
      console.error("Supabase Error:", error);
      alert("Error sending SOS: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-blue-50">
      <div className="max-w-4xl w-full text-center space-y-6">
        <header className="py-4">
          <h1 className="text-4xl font-black text-blue-900 tracking-tighter">RESQUEMAP</h1>
          <p className="text-blue-600 font-medium italic">Community-Driven Disaster Response</p>
        </header>

        <div className="w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
          <Map />
        </div>

        {locationError && (
          <p className="text-red-500 font-bold bg-red-100 p-2 rounded">{locationError}</p>
        )}

        <div className="py-4">
          <button 
            onClick={sendSOS}
            disabled={loading || !myLocation}
            className={`
              w-full sm:w-80 h-32 text-3xl font-black rounded-3xl shadow-2xl transition-all duration-300
              ${loading || !myLocation 
                ? "bg-gray-400 cursor-not-allowed opacity-70" 
                : "bg-red-600 hover:bg-red-700 active:scale-95 text-white animate-pulse"
              }
            `}
          >
            {loading ? "SENDING..." : !myLocation ? "WAITING FOR GPS..." : "SOS - SEND HELP"}
          </button>
        </div>
      </div>
    </main>
  );
}