"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import "leaflet-routing-machine";
import "leaflet.heat";

// Icons සකස් කිරීම
const blueIcon = L.icon({ iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });
const redIcon = L.icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });
const yellowIcon = L.icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });
const greenIcon = L.icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });

// --- Component: Dynamic Routing (Robust Fix) ---
function Routing({ userLoc, targetLoc, color = "#3b82f6" }: any) {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !targetLoc) return;

    try {
      // පවතින පැරණි Routing එකක් ඇත්නම් එය ඉවත් කිරීම
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }

      const routingControl = (L as any).Routing.control({
        waypoints: [L.latLng(userLoc[0], userLoc[1]), L.latLng(targetLoc[0], targetLoc[1])],
        lineOptions: { styles: [{ color: color, weight: 6, opacity: 0.8 }] },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false,
        createMarker: () => null
      }).addTo(map);

      routingControlRef.current = routingControl;

      // දකුණු පැත්තේ පෙනෙන ලිස්ට් එක බලහත්කාරයෙන් සැඟවීම
      const container = routingControl.getContainer();
      if (container) {
        container.style.display = 'none';
        container.style.visibility = 'hidden';
      }

    } catch (err) {
      console.error("Routing creation error:", err);
    }

    return () => {
      // Error එක වැළැක්වීමට safety check සහිතව ඉවත් කිරීම
      if (map && routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        } catch (e) {
          console.log("Cleanup handled");
        }
      }
    };
  }, [map, targetLoc, userLoc, color]);

  return null;
}

// --- Component: Heatmap ---
function HeatmapLayer({ points }: any) {
  const map = useMap();
  useEffect(() => {
    if (!map || !points || points.length === 0) return;
    const heatLayer = (L as any).heatLayer(points, { radius: 25, blur: 15 }).addTo(map);
    return () => {
      if (map && heatLayer) {
        try { map.removeLayer(heatLayer); } catch (e) { console.log("Heatmap cleanup"); }
      }
    };
  }, [map, points]);
  return null;
}

function MapFocus({ selectedLocation }: any) {
  const map = useMap();
  useEffect(() => { if (selectedLocation) map.flyTo(selectedLocation, 16); }, [selectedLocation, map]);
  return null;
}

export default function Map({ onRequestsUpdate, selectedLocation, filter, safeZones, showHeatmap, isVolunteer, showShelterRoute }: any) {
  const [position, setPosition] = useState<[number, number]>([6.9271, 79.8612]);
  const [requests, setRequests] = useState<any[]>([]);
  const [navTarget, setNavTarget] = useState<[number, number] | null>(null);
  const [nearestZone, setNearestZone] = useState<[number, number] | null>(null);

  const loadData = async () => {
    const { data } = await supabase.from("requests").select("*").neq("status", "resolved");
    if (data) { setRequests(data); if (onRequestsUpdate) onRequestsUpdate(data); }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => setPosition([pos.coords.latitude, pos.coords.longitude]));
    }
    loadData();
    const channel = supabase.channel('map-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => loadData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (showShelterRoute && safeZones.length > 0) {
      let minDist = Infinity; let closest: [number, number] | null = null;
      safeZones.forEach((z: any) => {
        const d = Math.sqrt(Math.pow(z.latitude - position[0], 2) + Math.pow(z.longitude - position[1], 2));
        if (d < minDist) { minDist = d; closest = [z.latitude, z.longitude]; }
      });
      setNearestZone(closest);
    } else { setNearestZone(null); }
  }, [showShelterRoute, safeZones, position]);

  const updateStatus = async (e: any, id: number, s: string) => { 
    e.stopPropagation(); 
    await supabase.from("requests").update({ status: s }).eq("id", id); 
  };

  const filteredRequests = filter === 'All' ? requests : requests.filter(r => r.emergency_type === filter);
  const heatPoints: [number, number, number][] = requests.map(r => [r.latitude, r.longitude, 0.5]);

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapFocus selectedLocation={selectedLocation} />
        {showHeatmap && <HeatmapLayer points={heatPoints} />}
        {navTarget && <Routing userLoc={position} targetLoc={navTarget} color="#3b82f6" />}
        {nearestZone && <Routing userLoc={position} targetLoc={nearestZone} color="#10b981" />}

        <Marker position={position} icon={blueIcon}><Popup>You are here</Popup></Marker>

        {filteredRequests.map((req) => (
          <Marker key={req.id} position={[req.latitude, req.longitude]} icon={req.status === 'pending' ? redIcon : yellowIcon}>
            <Popup>
              <div className="p-2 text-center min-w-[200px]">
                {req.image_url && <img src={req.image_url} alt="SOS" className="w-full h-32 object-cover rounded-xl mb-3 shadow-md border border-slate-100" />}
                <h3 className={`font-black uppercase text-[9px] ${req.status === 'pending' ? 'text-rose-600' : 'text-amber-600'}`}>{req.status}</h3>
                <p className="text-sm my-2 font-bold text-slate-700 leading-tight">{req.message}</p>
                <div className="flex flex-col gap-2 mt-2">
                  {isVolunteer ? (
                    <>
                      {req.status === 'pending' && <button onClick={(e) => updateStatus(e, req.id, 'helping')} className="bg-blue-600 text-white text-[10px] font-black py-2 rounded-xl w-full uppercase">I will help</button>}
                      {req.status === 'helping' && <button onClick={(e) => updateStatus(e, req.id, 'resolved')} className="bg-emerald-600 text-white text-[10px] font-black py-2 rounded-xl w-full uppercase">Mark Resolved</button>}
                      <button onClick={(e) => { e.stopPropagation(); setNavTarget([req.latitude, req.longitude]); }} className="bg-slate-800 text-white text-[10px] font-black py-2 rounded-xl w-full uppercase">Show Route</button>
                    </>
                  ) : (
                    <div className="text-[9px] font-black text-slate-400 bg-slate-50 p-2 rounded-lg uppercase italic">Volunteer Access Required</div>
                  )}
                  {navTarget && <button onClick={() => setNavTarget(null)} className="text-[9px] font-bold text-slate-400 uppercase underline">Clear Route</button>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {safeZones.map((zone: any) => (
          <Marker key={`zone-${zone.id}`} position={[zone.latitude, zone.longitude]} icon={greenIcon}>
            <Popup><div className="text-center font-bold text-xs uppercase text-emerald-600">{zone.name}</div></Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}