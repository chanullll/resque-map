"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const blueIcon = L.icon({ iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });
const redIcon = L.icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });
const yellowIcon = L.icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });
const greenIcon = L.icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });

interface MapProps {
  onRequestsUpdate?: (requests: any[]) => void;
  selectedLocation?: [number, number] | null;
  filter: string;
  safeZones: any[];
}

function MapFocus({ selectedLocation }: { selectedLocation: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedLocation) map.flyTo(selectedLocation, 16, { animate: true, duration: 2 });
  }, [selectedLocation, map]);
  return null;
}

export default function Map({ onRequestsUpdate, selectedLocation, filter, safeZones }: MapProps) {
  const [position, setPosition] = useState<[number, number]>([6.9271, 79.8612]);
  const [requests, setRequests] = useState<any[]>([]);

  const loadData = async () => {
    const { data } = await supabase.from("requests").select("*").neq("status", "resolved");
    if (data) { setRequests(data); if (onRequestsUpdate) onRequestsUpdate(data); }
  };

  useEffect(() => {
    if ("geolocation" in navigator) navigator.geolocation.getCurrentPosition((pos) => setPosition([pos.coords.latitude, pos.coords.longitude]));
    loadData();
    const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => loadData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (e: any, id: number, newStatus: string) => {
    e.stopPropagation();
    await supabase.from("requests").update({ status: newStatus }).eq("id", id);
  };

  const filteredRequests = filter === 'All' ? requests : requests.filter(r => r.emergency_type === filter);

  return (
    <div className="h-full w-full relative z-0 font-sans">
      <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapFocus selectedLocation={selectedLocation} />
        <Marker position={position} icon={blueIcon}><Popup>You are here</Popup></Marker>

        {filteredRequests.map((req) => (
          <Marker key={req.id} position={[req.latitude, req.longitude]} icon={req.status === 'pending' ? redIcon : yellowIcon}>
            <Popup>
              <div className="p-2 text-center min-w-[200px]">
                {req.image_url && (
                  <img src={req.image_url} alt="Emergency" className="w-full h-32 object-cover rounded-xl mb-3 shadow-md border border-slate-100" />
                )}
                <h3 className={`font-black uppercase text-[10px] tracking-widest ${req.status === 'pending' ? 'text-rose-600' : 'text-amber-600'}`}>{req.status}</h3>
                <p className="text-sm my-2 font-bold leading-tight text-slate-700">{req.message}</p>
                {req.status === 'pending' && <button onClick={(e) => updateStatus(e, req.id, 'helping')} className="bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-xl w-full uppercase mt-2 tracking-widest">I will help</button>}
                {req.status === 'helping' && <button onClick={(e) => updateStatus(e, req.id, 'resolved')} className="bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-xl w-full uppercase mt-2 tracking-widest">Mark Resolved</button>}
              </div>
            </Popup>
          </Marker>
        ))}

        {safeZones.map((zone) => (
          <Marker key={`zone-${zone.id}`} position={[zone.latitude, zone.longitude]} icon={greenIcon}>
            <Popup>
              <div className="p-2 text-center">
                <h3 className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]">{zone.type}</h3>
                <p className="text-sm font-bold mt-1 text-slate-700 leading-tight">{zone.name}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}