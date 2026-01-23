import { useState, useEffect, useRef } from "react";
import { MapPinIcon, ClockIcon } from "@heroicons/react/24/outline";
import { branches } from "@/utils/branches";

interface BranchMapProps {
  selectedBranchId?: string;
  onSelectBranch?: (branchId: string) => void;
  showTitle?: boolean;
  className?: string;
}

// Declarar tipo global para Google Maps
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
    initMap: () => void;
  }
}

export default function BranchMap({
  selectedBranchId,
  onSelectBranch,
  showTitle = true,
  className = "",
}: BranchMapProps) {
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const googleMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);

  const GOOGLE_MAPS_API_KEY = "AIzaSyClw74i2eJECRchabkgoo3F0sB3idu833Y";

  useEffect(() => {
    console.log("🗺️ Iniciando carga de Google Maps...");
    console.log("📍 Número de sucursales:", branches.length);

    // Cargar el script de Google Maps
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=es`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("✅ Google Maps script cargado");
        setMapLoaded(true);
      };
      script.onerror = () => {
        console.error("❌ Error al cargar Google Maps script");
      };
      document.head.appendChild(script);
    } else {
      console.log("✅ Google Maps ya estaba cargado");
      // Usar setTimeout para evitar el warning de setState en efecto
      setTimeout(() => setMapLoaded(true), 0);
    }
  }, []);

  useEffect(() => {
    if (mapLoaded && mapRef.current && !googleMapRef.current) {
      console.log("🎨 Inicializando mapa...");

      // Inicializar el mapa
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 20.6596988, lng: -103.3496126 },
        zoom: 11,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      googleMapRef.current = map;

      // Crear marcadores para todas las sucursales
      console.log("📌 Creando marcadores...");
      branches.forEach((branch, index) => {
        console.log(
          `  ${index + 1}. ${branch.name}: ${branch.coordinates.lat}, ${branch.coordinates.lng}`,
        );

        const marker = new window.google.maps.Marker({
          position: {
            lat: branch.coordinates.lat,
            lng: branch.coordinates.lng,
          },
          map: map,
          title: branch.name,
          animation: window.google.maps.Animation.DROP,
        });

        // InfoWindow con información de la sucursal
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; color: #2391C3; font-weight: bold;">${branch.name}</h3>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${branch.address}</p>
              <div style="font-size: 11px; color: #666;">
                <p style="margin: 4px 0;"><strong>L-V:</strong> ${branch.schedule.weekdays}</p>
                <p style="margin: 4px 0;"><strong>Sáb:</strong> ${branch.schedule.saturday}</p>
                <p style="margin: 4px 0;"><strong>Dom:</strong> ${branch.schedule.sunday}</p>
              </div>
            </div>
          `,
        });

        marker.addListener("click", () => {
          // Cerrar todas las ventanas de información
          markersRef.current.forEach((m) => m.infoWindow.close());
          // Abrir la ventana de este marcador
          infoWindow.open(map, marker);
          // Hacer zoom a este marcador
          map.setZoom(15);
          map.setCenter(marker.getPosition());
          // Notificar la selección
          if (onSelectBranch) {
            onSelectBranch(branch.id);
          }
        });

        markersRef.current.push({ marker, infoWindow, branchId: branch.id });
      });

      console.log("✅ Marcadores creados:", markersRef.current.length);
    }
  }, [mapLoaded, onSelectBranch]);

  // Actualizar vista cuando se selecciona una sucursal
  useEffect(() => {
    if (googleMapRef.current && selectedBranchId) {
      console.log("🎯 Seleccionando sucursal:", selectedBranchId);
      const selectedMarker = markersRef.current.find(
        (m) => m.branchId === selectedBranchId,
      );

      if (selectedMarker) {
        // Cerrar todas las ventanas y quitar animaciones
        markersRef.current.forEach((m) => {
          m.infoWindow.close();
          m.marker.setAnimation(null);
        });

        // Abrir la ventana seleccionada
        selectedMarker.infoWindow.open(
          googleMapRef.current,
          selectedMarker.marker,
        );

        // Animar el marcador seleccionado (bounce)
        selectedMarker.marker.setAnimation(window.google.maps.Animation.BOUNCE);

        // Centrar en el marcador
        googleMapRef.current.setCenter(selectedMarker.marker.getPosition());
        googleMapRef.current.setZoom(15);

        // Detener la animación después de 2 segundos
        setTimeout(() => {
          selectedMarker.marker.setAnimation(null);
        }, 2000);
      }
    } else if (googleMapRef.current && !selectedBranchId) {
      // Volver a la vista general
      console.log("🌍 Volviendo a vista general");
      markersRef.current.forEach((m) => {
        m.infoWindow.close();
        m.marker.setAnimation(null);
      });
      googleMapRef.current.setCenter({ lat: 20.6596988, lng: -103.3496126 });
      googleMapRef.current.setZoom(11);
    }
  }, [selectedBranchId]);

  return (
    <div className={className}>
      {showTitle && (
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          Sucursales Casa Blanca
        </h3>
      )}

      {/* Mapa con las ubicaciones */}
      <div className="bg-gray-100 rounded-lg overflow-hidden mb-6 relative h-96 border-2 border-gray-200">
        <div ref={mapRef} className="w-full h-full"></div>

        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2391C3] border-t-transparent mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">Cargando mapa...</p>
            </div>
          </div>
        )}

        {mapLoaded && !selectedBranch && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg pointer-events-none">
            <p className="text-xs text-gray-700 font-medium">
              💡 Haz clic en los marcadores numerados o en las sucursales abajo
            </p>
          </div>
        )}
      </div>

      {/* Lista de sucursales */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => {
              console.log("🖱️ Click en tarjeta:", branch.name, branch.id);
              if (onSelectBranch) {
                onSelectBranch(branch.id);
              } else {
                console.warn("⚠️ onSelectBranch no está definido");
              }
            }}
            onMouseEnter={() => setHoveredBranch(branch.id)}
            onMouseLeave={() => setHoveredBranch(null)}
            className={`text-left p-4 rounded-lg border-2 transition-all cursor-pointer ${
              selectedBranchId === branch.id
                ? "border-[#2391C3] bg-[#2391C3]/5 shadow-lg"
                : hoveredBranch === branch.id
                  ? "border-[#2391C3]/50 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-2 mb-2">
              <MapPinIcon
                className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  selectedBranchId === branch.id
                    ? "text-[#2391C3]"
                    : "text-gray-400"
                }`}
              />
              <div className="flex-1">
                <h4 className="font-bold text-gray-800">{branch.name}</h4>
                <p className="text-xs text-gray-600 mt-1">{branch.address}</p>
              </div>
            </div>

            <div className="ml-7 space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                <span>
                  <strong>L-V:</strong> {branch.schedule.weekdays}
                </span>
              </div>
              <div className="ml-5">
                <strong>Sáb:</strong> {branch.schedule.saturday}
              </div>
              <div className="ml-5">
                <strong>Dom:</strong> {branch.schedule.sunday}
              </div>
            </div>

            {selectedBranchId === branch.id && (
              <div className="mt-2 pt-2 border-t border-[#2391C3]/20">
                <a
                  href={branch.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#2391C3] hover:underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MapPinIcon className="h-3 w-3" />
                  Ver en Google Maps
                </a>
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedBranch && (
        <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-sm text-gray-700">
            ⏰ <strong>Importante:</strong> Tienes 7 días para recoger tu
            producto en la sucursal <strong>{selectedBranch.name}</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
