import { useEffect, useRef, useState } from "react";

let mapsLoaderPromise;

function loadGoogleMaps(apiKey) {
  if (!apiKey) return Promise.reject(new Error("Missing Google Maps API key"));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (mapsLoaderPromise) return mapsLoaderPromise;

  mapsLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,marker,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return mapsLoaderPromise;
}

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
  const visiblePlaces = places.slice(0, 6);

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
        )) : [1, 2, 3].map((index) => (
          <div className={`map-marker marker-${index}`} key={index}>{index}</div>
        ))}
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
