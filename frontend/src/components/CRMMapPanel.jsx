import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const fallbackCenter = [28.6139, 77.209];

function isValidCoordinate(value) {
  return Number.isFinite(Number(value));
}

function markerColor(type) {
  if (type === "clinic") return "#0891b2";
  if (type === "hospital") return "#dc2626";
  if (type === "territory") return "#7c3aed";
  if (type === "rep") return "#ea580c";
  if (type === "user") return "#059669";
  return "#2563eb";
}

function FitBounds({ markers, userLocation }) {
  const map = useMap();

  useEffect(() => {
    const points = [
      ...markers.map((marker) => [Number(marker.latitude), Number(marker.longitude)]),
      ...(userLocation ? [[Number(userLocation.latitude), Number(userLocation.longitude)]] : []),
    ].filter(([lat, lng]) => isValidCoordinate(lat) && isValidCoordinate(lng));

    if (points.length > 1) {
      map.fitBounds(points, { padding: [28, 28], maxZoom: 14 });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [map, markers, userLocation]);

  return null;
}

function CRMMapPanel({ places = [], location, compact = false }) {
  const validPlaces = useMemo(
    () => places
      .filter((place) => isValidCoordinate(place.latitude) && isValidCoordinate(place.longitude))
      .slice(0, compact ? 8 : 80),
    [compact, places]
  );
  const userLocation = location && isValidCoordinate(location.latitude) && isValidCoordinate(location.longitude)
    ? location
    : null;
  const center = userLocation
    ? [Number(userLocation.latitude), Number(userLocation.longitude)]
    : validPlaces.length
      ? [Number(validPlaces[0].latitude), Number(validPlaces[0].longitude)]
      : fallbackCenter;

  return (
    <div className={compact ? "osm-map mini-osm-map" : "osm-map"}>
      {!validPlaces.length && !userLocation && (
        <div className="map-empty-state">No mapped CRM locations yet</div>
      )}
      <MapContainer center={center} zoom={validPlaces.length || userLocation ? 12 : 5} scrollWheelZoom className="leaflet-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={validPlaces} userLocation={userLocation} />
        {userLocation && (
          <CircleMarker center={[Number(userLocation.latitude), Number(userLocation.longitude)]} radius={9} pathOptions={{ color: markerColor("user"), fillColor: markerColor("user"), fillOpacity: 0.9 }}>
            <Popup>
              <strong>Your location</strong>
              <p>Browser geolocation</p>
            </Popup>
          </CircleMarker>
        )}
        {validPlaces.map((place) => (
          <CircleMarker
            center={[Number(place.latitude), Number(place.longitude)]}
            radius={8}
            key={place.id || `${place.name}-${place.latitude}-${place.longitude}`}
            pathOptions={{ color: markerColor(place.type), fillColor: markerColor(place.type), fillOpacity: 0.85 }}
          >
            <Popup>
              <div className="map-popup-card">
                <strong>{place.name}</strong>
                <span>{place.typeLabel || place.category || place.type || "CRM entity"}</span>
                {place.address && <p>{place.address}</p>}
                {place.specialty && <p>Specialty: {place.specialty}</p>}
                {place.contact && <p>Contact: {place.contact}</p>}
                {place.metadata && <p>{place.metadata}</p>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export default CRMMapPanel;
