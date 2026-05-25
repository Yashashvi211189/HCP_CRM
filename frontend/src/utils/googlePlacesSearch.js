let mapsLoaderPromise;

export function loadGoogleMaps(apiKey) {
  if (!apiKey) return Promise.reject(new Error("Missing Google Maps API key"));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (mapsLoaderPromise) return mapsLoaderPromise;

  mapsLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,marker,places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return mapsLoaderPromise;
}

function normalizePlace(place, index) {
  const location = place.location;
  const name = place.displayName || place.name || "Healthcare provider";
  const lat = typeof location?.lat === "function" ? location.lat() : location?.lat;
  const lng = typeof location?.lng === "function" ? location.lng() : location?.lng;

  return {
    id: place.id || place.placeId || `google-${index}`,
    name,
    category: place.primaryTypeDisplayName || "Healthcare",
    rating: place.rating || "New",
    address: place.formattedAddress || "",
    distance: "Nearby",
    phone: place.nationalPhoneNumber || "",
    open_now: place.businessStatus ? place.businessStatus === "OPERATIONAL" : undefined,
    availability: "Check availability",
    latitude: lat,
    longitude: lng,
    directions_url: place.googleMapsURI || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
  };
}

export async function searchPlacesWithGoogle({ query, location, includedType = "", maxResultCount = 8 }) {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";
  if (!apiKey) throw new Error("Missing Google Maps API key");

  const maps = await loadGoogleMaps(apiKey);
  const { Place } = await maps.importLibrary("places");
  const center = location?.latitude && location?.longitude
    ? new maps.LatLng(Number(location.latitude), Number(location.longitude))
    : new maps.LatLng(28.6139, 77.209);

  const request = {
    textQuery: query,
    fields: ["displayName", "location", "formattedAddress", "googleMapsURI", "businessStatus", "rating", "nationalPhoneNumber"],
    includedType,
    useStrictTypeFiltering: Boolean(includedType),
    locationBias: center,
    isOpenNow: false,
    language: "en-US",
    maxResultCount,
    minRating: 1,
    region: "in",
  };

  const { places } = await Place.searchByText(request);
  return (places || []).map(normalizePlace);
}

export async function searchNearbyWithGoogle({ location, includedPrimaryType = "doctor", maxResultCount = 5 }) {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";
  if (!apiKey || !location?.latitude || !location?.longitude) {
    throw new Error("Missing Google Maps API key or location");
  }

  const maps = await loadGoogleMaps(apiKey);
  const { Place, SearchNearbyRankPreference } = await maps.importLibrary("places");
  const center = new maps.LatLng(Number(location.latitude), Number(location.longitude));

  const request = {
    fields: ["displayName", "location", "formattedAddress", "googleMapsURI", "businessStatus", "rating", "nationalPhoneNumber"],
    locationRestriction: {
      center,
      radius: 50000,
    },
    includedPrimaryTypes: [includedPrimaryType],
    maxResultCount,
    rankPreference: SearchNearbyRankPreference.POPULARITY,
  };

  const { places } = await Place.searchNearby(request);
  return (places || []).map(normalizePlace);
}
