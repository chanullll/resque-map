"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// සාමාන්‍ය Blue Marker එක (ඔබ ඉන්න තැනට)
const blueIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// SOS සඳහා Red Marker එක
const redIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

interface SOSRequest {
  id: number;
  latitude: number;
  longitude: number;
  message: string;
  emergency_type: string;
}

export default function Map() {
  const [position, setPosition] = useState<[number, number]>([6.9271, 79.8612]);
  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [hasLocation, setHasLocation] = useState(false);

  // 1. දැනට පවතින SOS Requests ලබා ගැනීම
  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("status", "pending");
    
    if (data) setRequests(data);
    if (error) console.error("Error fetching requests:", error);
  };

  useEffect(() => {
    // පරිශීලකයාගේ ලොකේෂන් එක ගැනීම
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setHasLocation(true);
      });
    }

    fetchRequests();

    // 2. Real-time Subscription: අලුතින් SOS එකක් ආපු ගමන් සිතියමට එකතු කරනවා
    const subscription = supabase
      .channel("realtime-requests")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "requests" }, 
      (payload) => {
        setRequests((prev) => [...prev, payload.new as SOSRequest]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
      <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {hasLocation && <ChangeView center={position} />}

        {/* පරිශීලකයාගේ Marker එක (Blue) */}
        <Marker position={position} icon={blueIcon}>
          <Popup>ඔබ දැනට මෙතැන සිටී.</Popup>
        </Marker>

        {/* සියලුම SOS Requests පෙන්වීම (Red) */}
        {requests.map((req) => (
          <Marker key={req.id} position={[req.latitude, req.longitude]} icon={redIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-red-600">🚨 SOS REQUEST</p>
                <p className="text-sm">{req.message}</p>
                <p className="text-xs text-gray-500">Type: {req.emergency_type}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}