import { useEffect, useMemo, useState } from "react";

import CRMMapPanel from "./CRMMapPanel";
import { searchHcps, searchNearbyHealthcare } from "../hooks/api";

const doctorSpecialties = ["Cardiologist", "Dentist", "Pediatrician", "Orthopedic Doctor", "Dermatologist", "General Physician"];

const defaults = {
  doctors: {
    eyebrow: "Find doctors",
    title: "Find CRM Doctors",
    subtitle: "Search existing HCP records by name, specialty, institution, and CRM metadata.",
    query: "",
    filters: doctorSpecialties,
    cta: "Open Interaction Logger",
  },
  clinics: {
    eyebrow: "Clinics",
    title: "Clinic Accounts",
    subtitle: "Review clinic-linked HCP records and institution locations from CRM data.",
    query: "clinic",
    filters: ["Clinic", "Medical Center", "Metro Clinic", "City Medical Center"],
    cta: "View CRM Account",
  },
  hospitals: {
    eyebrow: "Hospitals",
    title: "Hospital Accounts",
    subtitle: "Map hospital-linked providers and account relationships already stored in CRM.",
    query: "hospital",
    filters: ["Hospital", "Apollo Hospital", "National Brain Institute", "Chest & Lung Hospital"],
    cta: "View CRM Account",
  },
};

function normalizeHcp(hcp, index, type) {
  return {
    id: `${type}-${hcp.id || index}`,
    name: type === "doctor" ? hcp.name : hcp.institution || hcp.name,
    type,
    typeLabel: type === "doctor" ? "Doctor" : type === "clinic" ? "Clinic" : "Hospital",
    category: type === "doctor" ? "Doctor" : type === "clinic" ? "Clinic" : "Hospital",
    specialty: hcp.specialty || "",
    address: hcp.institution || "Address not available",
    contact: hcp.phone || hcp.email || "",
    metadata: type === "doctor" ? `CRM HCP ID: ${hcp.id || "N/A"}` : `Linked HCP: ${hcp.name}`,
    rating: "CRM",
    distance: hcp.latitude && hcp.longitude ? "CRM mapped" : "Coordinates missing",
    open_now: undefined,
    availability: "Use interaction logger",
    latitude: hcp.latitude,
    longitude: hcp.longitude,
  };
}

function distanceLabel(place, location) {
  if (!location || !place.latitude || !place.longitude) return "Nearby";
  const earthRadiusKm = 6371;
  const toRadians = (value) => Number(value) * (Math.PI / 180);
  const dLat = toRadians(place.latitude - location.latitude);
  const dLon = toRadians(place.longitude - location.longitude);
  const lat1 = toRadians(location.latitude);
  const lat2 = toRadians(place.latitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const km = earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return `${km.toFixed(km < 10 ? 1 : 0)} km away`;
}

function normalizeOsmPlace(place, location) {
  return {
    ...place,
    id: place.id,
    name: place.name || "Unnamed healthcare location",
    type: place.type || "healthcare",
    typeLabel: place.typeLabel || "Healthcare",
    category: place.category || place.type || "Healthcare",
    address: place.address || "Address not available",
    contact: place.contact || "",
    metadata: place.metadata || "OpenStreetMap healthcare location",
    rating: "OSM",
    distance: distanceLabel(place, location),
    availability: "Live OpenStreetMap result",
    source: "OpenStreetMap",
  };
}

function matchesType(hcp, type) {
  const text = `${hcp.name || ""} ${hcp.specialty || ""} ${hcp.institution || ""}`.toLowerCase();
  if (type === "clinics") return text.includes("clinic") || text.includes("center") || text.includes("centre");
  if (type === "hospitals") return text.includes("hospital") || text.includes("institute");
  return true;
}

function DiscoveryPage({ type = "doctors" }) {
  const config = defaults[type];
  const [query, setQuery] = useState(config.query);
  const [location, setLocation] = useState(null);
  const [hcps, setHcps] = useState([]);
  const [osmPlaces, setOsmPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [view, setView] = useState("list");
  const [error, setError] = useState("");
  const [nearbyError, setNearbyError] = useState("");

  const entityType = type === "clinics" ? "clinic" : type === "hospitals" ? "hospital" : "doctor";
  const nearbyCategory = type === "clinics" ? "clinics" : type === "hospitals" ? "hospitals" : "doctors";

  const fetchHcps = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await searchHcps("");
      setHcps(response.data || []);
    } catch {
      setError("Could not load CRM records from the backend. Please retry.");
      setHcps([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearby = async (nextQuery = query, nextLocation = location) => {
    if (!nextLocation) {
      setNearbyError("Allow location access to load live nearby healthcare locations.");
      setOsmPlaces([]);
      return;
    }
    setNearbyLoading(true);
    setNearbyError("");
    try {
      const response = await searchNearbyHealthcare({
        lat: nextLocation.latitude,
        lon: nextLocation.longitude,
        category: nearbyCategory,
        radius: 10000,
        q: nextQuery,
      });
      setOsmPlaces((response.data?.places || []).map((place) => normalizeOsmPlace(place, nextLocation)));
    } catch {
      setNearbyError("Could not load live OpenStreetMap healthcare results. Please retry.");
      setOsmPlaces([]);
    } finally {
      setNearbyLoading(false);
    }
  };

  const handleSearch = () => {
    fetchHcps();
    fetchNearby();
  };

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const nextLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setLocation(nextLocation);
        fetchNearby(config.query, nextLocation);
      },
      () => {
        setLocation(null);
        setNearbyError("Location permission is blocked. Enable it to load live nearby hospitals and clinics.");
      },
      { timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    setQuery(config.query);
    setOsmPlaces([]);
    setNearbyError("");
    fetchHcps();
    if (location) fetchNearby(config.query, location);
  }, [type]);

  const crmResults = useMemo(() => {
    const search = query.trim().toLowerCase();
    return hcps
      .filter((hcp) => matchesType(hcp, type))
      .filter((hcp) => {
        if (!search || ["clinic", "hospital"].includes(search)) return true;
        return `${hcp.name || ""} ${hcp.specialty || ""} ${hcp.institution || ""}`.toLowerCase().includes(search);
      })
      .map((hcp, index) => normalizeHcp(hcp, index, entityType));
  }, [entityType, hcps, query, type]);

  const results = useMemo(() => [...osmPlaces, ...crmResults], [crmResults, osmPlaces]);

  return (
    <main className="discovery-page">
      <section className="discovery-hero">
        <div>
          <p className="eyebrow">{config.eyebrow}</p>
          <h1>{config.title}</h1>
          <p>{config.subtitle}</p>
        </div>
        <div className="view-toggle" aria-label="View selector">
          <button className={view === "list" ? "active" : ""} type="button" onClick={() => setView("list")}>List View</button>
          <button className={view === "map" ? "active" : ""} type="button" onClick={() => setView("map")}>Map View</button>
        </div>
      </section>

      <section className="search-panel">
        <div className="search-row">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search CRM records by name, specialty, institution, or territory" />
          <button type="button" onClick={handleSearch}>Search</button>
        </div>
        <div className="filter-row">
          {config.filters.map((filter) => (
            <button className="filter-chip" type="button" key={filter} onClick={() => {
              setQuery(filter);
              fetchNearby(filter);
            }}>
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="discovery-layout">
        <div className={`result-list ${view === "map" ? "compact-results" : ""}`}>
          <div className="result-meta">
            <strong>{loading || nearbyLoading ? "Loading nearby healthcare records" : `${results.length} records found`}</strong>
            <span>{osmPlaces.length} live OSM results | {crmResults.length} CRM records</span>
          </div>
          {error && (
            <div className="map-config-alert">
              {error} <button type="button" onClick={handleSearch}>Retry</button>
            </div>
          )}
          {nearbyError && (
            <div className="map-config-alert">
              {nearbyError} <button type="button" onClick={handleSearch}>Retry</button>
            </div>
          )}
          {(loading || nearbyLoading) && <div className="empty-state">Loading live nearby healthcare locations...</div>}
          {!loading && !nearbyLoading && results.map((place) => (
            <article className="provider-card" key={place.id}>
              <div>
                <p className="eyebrow">{place.typeLabel}</p>
                <h3>{place.name}</h3>
                <p>{place.address}</p>
                <div className="provider-meta">
                  {place.specialty && <span>{place.specialty}</span>}
                  <span>{place.distance}</span>
                  <span>{place.metadata}</span>
                  {place.source && <span>{place.source}</span>}
                </div>
                <p className="availability">{place.availability}</p>
              </div>
              <div className="provider-actions">
                <a href={place.contact?.includes("@") ? `mailto:${place.contact}` : `tel:${place.contact || ""}`}>Contact</a>
                <button type="button" onClick={() => setView("map")}>Map View</button>
                <button type="button">{config.cta}</button>
              </div>
            </article>
          ))}
          {!loading && !nearbyLoading && !results.length && <div className="empty-state">No nearby healthcare records matched this search. Try a broader term or increase location access accuracy.</div>}
        </div>

        <aside className="map-panel">
          <CRMMapPanel places={results} location={location} />
          <p>
            Map powered by OpenStreetMap, Overpass, and Leaflet. Live markers come from OSM; CRM records remain available beside them.
          </p>
        </aside>
      </section>
    </main>
  );
}

export default DiscoveryPage;
