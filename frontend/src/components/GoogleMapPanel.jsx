import { useEffect, useMemo, useRef, useState } from "react";

import { loadGoogleMaps } from "../utils/googlePlacesSearch";

function fallbackCenter(location, places) {
  const firstPlace = places.find((place) => place.latitude && place.longitude);
  if (location?.latitude && location?.longitude) {
    return { lat: Number(location.latitude), lng: Number(location.longitude) };
  }
  if (firstPlace) {
    return { lat: Number(firstPlace.latitude), lng: Number(firstPlace.longitude) };
  }
  return { lat: 28.6139, lng: 77.209 };
}

function GoogleMapPanel({ places = [], location, compact = false }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markers = useRef([]);
  const [loadState, setLoadState] = useState("idle");
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";
  const visiblePlaces = useMemo(() => places.slice(0, 6), [places]);

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;
    let cancelled = false;
    setLoadState("loading");

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        const center = fallbackCenter(location, visiblePlaces);
        if (!mapInstance.current) {
          mapInstance.current = new maps.Map(mapRef.current, {
            center,
            zoom: compact ? 12 : 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
        } else {
          mapInstance.current.setCenter(center);
        }

        markers.current.forEach((marker) => marker.setMap(null));
        markers.current = visiblePlaces
          .filter((place) => place.latitude && place.longitude)
          .map((place, index) => new maps.Marker({
            position: { lat: Number(place.latitude), lng: Number(place.longitude) },
            map: mapInstance.current,
            title: place.name,
            label: String(index + 1),
          }));
        setLoadState("loaded");
      })
      .catch(() => setLoadState("fallback"));

    return () => {
      cancelled = true;
    };
  }, [apiKey, compact, location, visiblePlaces]);

  if (!apiKey || loadState === "fallback") {
    return (
      <div className={compact ? "mini-map" : "map-canvas"}>
        <span>{apiKey ? "Map fallback" : "Add Maps API key"}</span>
        {visiblePlaces.length ? visiblePlaces.map((place, index) => (
          <div className={`map-marker marker-${index + 1}`} key={place.id || place.name}>{index + 1}</div>
        )) : null}
      </div>
    );
  }

  return (
    <div className={compact ? "google-map mini-google-map" : "google-map"} ref={mapRef}>
      {loadState === "loading" && <span>Loading Google Map...</span>}
    </div>
  );
}

export default GoogleMapPanel;
