"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import "leaflet-routing-machine"; // අලුතින් එකතු කළා

// Icons සෙට් කිරීම
const blueIcon = L.icon({ iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });
const redIcon = L.icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });
const yellowIcon = L.icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });
const greenIcon = L.icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });

// මාර්ගය ඇඳීමට උදව් වන Component එක
function Routing({ userLoc, targetLoc }: { userLoc: [number, number], targetLoc: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetLoc) return;

    // පැරණි මාර්ග තිබේ නම් ඒවා අයින් කරනවා
    const routingControl = (L as any).Routing.control({
      waypoints: [
        L.latLng(userLoc[0], userLoc[1]),
        L.latLng(targetLoc[0], targetLoc[1])
      ],
      lineOptions: { styles: [{ color: "#3b82f6", weight: 6, opacity: 0.8 }] },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false, // පාරවල් ගැන විස්තර (text) පෙන්වන්නේ නැත
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [map, targetLoc, userLoc]);

  return null;
}

function MapFocus({ selectedLocation }: { selectedLocation: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedLocation) map.flyTo(selectedLocation, 16);
  }, [selectedLocation, map]);
  return null;
}

export default function Map({ onRequestsUpdate, selectedLocation, filter, safeZones }: any) {
  const [position, setPosition] = useState<[number, number]>([6.9271, 79.8612]);
  const [requests, setRequests] = useState<any[]>([]);
  const [navTarget, setNavTarget] = useState<[number, number] | null>(null); // Navigation target එක

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
    <div className="h-full w-full relative z-0">
      <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapFocus selectedLocation={selectedLocation} />
        
        {/* Navigation Layer */}
        {navTarget && <Routing userLoc={position} targetLoc={navTarget} />}

        <Marker position={position} icon={blueIcon}><Popup>You are here</Popup></Marker>

        {filteredRequests.map((req) => (
          <Marker key={req.id} position={[req.latitude, req.longitude]} icon={req.status === 'pending' ? redIcon : yellowIcon}>
            <Popup>
              <div className="p-2 text-center min-w-[200px]">
                {req.image_url && <img src={req.image_url} alt="SOS" className="w-full h-32 object-cover rounded-xl mb-3 shadow-md" />}
                <h3 className={`font-black uppercase text-[9px] ${req.status === 'pending' ? 'text-rose-600' : 'text-amber-600'}`}>{req.status}</h3>
                <p className="text-sm my-2 font-bold leading-tight">{req.message}</p>
                
                <div className="flex flex-col gap-2 mt-2">
                  {req.status === 'pending' && <button onClick={(e) => updateStatus(e, req.id, 'helping')} className="bg-blue-600 text-white text-[10px] font-black py-2 rounded-xl w-full uppercase">I will help</button>}
                  {req.status === 'helping' && <button onClick={(e) => updateStatus(e, req.id, 'resolved')} className="bg-emerald-600 text-white text-[10px] font-black py-2 rounded-xl w-full uppercase">Mark Resolved</button>}
                  
                  {/* මඟ පෙන්වීමේ බොත්තම */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setNavTarget([req.latitude, req.longitude]); }}
                    className="bg-slate-800 text-white text-[10px] font-black py-2 rounded-xl w-full uppercase"
                  >
                    Show Route
                  </button>
                  {navTarget && <button onClick={() => setNavTarget(null)} className="text-[9px] font-bold text-slate-400 uppercase underline">Clear Route</button>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {safeZones.map((zone: any) => (
          <Marker key={`zone-${zone.id}`} position={[zone.latitude, zone.longitude]} icon={greenIcon}>
            <Popup><div className="text-center font-bold text-sm">{zone.name}</div></Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}