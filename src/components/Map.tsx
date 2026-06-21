"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const blueIcon = L.icon({ iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });
const redIcon = L.icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });
const yellowIcon = L.icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });

interface SOSRequest {
  id: number;
  latitude: number;
  longitude: number;
  message: string;
  emergency_type: string;
  status: string;
}

interface MapProps {
  onRequestsUpdate?: (requests: SOSRequest[]) => void;
  selectedLocation?: [number, number] | null;
  filter: string;
}

function MapFocus({ selectedLocation }: { selectedLocation: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedLocation) {
      map.flyTo(selectedLocation, 16, { animate: true, duration: 2 });
    }
  }, [selectedLocation, map]);
  return null;
}

export default function Map({ onRequestsUpdate, selectedLocation, filter }: MapProps) {
  const [position, setPosition] = useState<[number, number]>([6.9271, 79.8612]);
  const [requests, setRequests] = useState<SOSRequest[]>([]);

  const loadData = async () => {
    const { data } = await supabase.from("requests").select("*").neq("status", "resolved");
    if (data) {
      setRequests(data);
      if (onRequestsUpdate) onRequestsUpdate(data);
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => setPosition([pos.coords.latitude, pos.coords.longitude]));
    }
    loadData();
    const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => loadData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateRequestStatus = async (e: React.MouseEvent, id: number, newStatus: string) => {
    e.stopPropagation();
    const { error } = await supabase.from("requests").update({ status: newStatus }).eq("id", id);
    if (error) alert("Error: " + error.message);
  };

  const filteredRequests = filter === 'All' ? requests : requests.filter(r => r.emergency_type === filter);

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapFocus selectedLocation={selectedLocation} />
        <Marker position={position} icon={blueIcon}><Popup>ඔබ සිටින ස්ථානය</Popup></Marker>
        {filteredRequests.map((req) => (
          <Marker key={req.id} position={[Number(req.latitude), Number(req.longitude)]} icon={req.status === 'pending' ? redIcon : yellowIcon}>
            <Popup>
              <div className="p-2 text-center min-w-[150px]">
                <h3 className={`font-bold ${req.status === 'pending' ? 'text-rose-600' : 'text-amber-600'}`}>
                  {req.status === 'pending' ? '🚨 SOS REQUEST' : '⚠️ HELPING IN PROGRESS'}
                </h3>
                <p className="text-sm my-2 font-medium">{req.message}</p>
                {req.status === 'pending' && (
                  <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => updateRequestStatus(e, req.id, 'helping')} className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-bold w-full">I WILL HELP</button>
                )}
                {req.status === 'helping' && (
                  <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => updateRequestStatus(e, req.id, 'resolved')} className="bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-bold w-full">MARK AS RESOLVED</button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}