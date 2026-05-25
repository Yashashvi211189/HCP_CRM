import { useEffect, useMemo, useState } from "react";

import CRMMapPanel from "./CRMMapPanel";
import { searchHcps } from "../hooks/api";

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
    filters: ["Medical Clinic", "Dental Clinic", "Diagnostics", "Primary Care"],
    cta: "View CRM Account",
  },
  hospitals: {
    eyebrow: "Hospitals",
    title: "Hospital Accounts",
    subtitle: "Map hospital-linked providers and account relationships already stored in CRM.",
    query: "hospital",
    filters: ["Hospital", "Cardiology", "Neurology", "Oncology"],
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
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("list");
  const [error, setError] = useState("");

  const entityType = type === "clinics" ? "clinic" : type === "hospitals" ? "hospital" : "doctor";

  const fetchHcps = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await searchHcps(query);
      setHcps(response.data || []);
    } catch {
      setError("Could not load CRM location records. Please retry.");
      setHcps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (position) => setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => setLocation(null),
      { timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    fetchHcps();
  }, [type]);

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    return hcps
      .filter((hcp) => matchesType(hcp, type))
      .filter((hcp) => {
        if (!search || ["clinic", "hospital"].includes(search)) return true;
        return `${hcp.name || ""} ${hcp.specialty || ""} ${hcp.institution || ""}`.toLowerCase().includes(search);
      })
      .map((hcp, index) => normalizeHcp(hcp, index, entityType));
  }, [entityType, hcps, query, type]);

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
          <button type="button" onClick={fetchHcps}>Search</button>
        </div>
        <div className="filter-row">
          {config.filters.map((filter) => (
            <button className="filter-chip" type="button" key={filter} onClick={() => setQuery(filter)}>
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="discovery-layout">
        <div className={`result-list ${view === "map" ? "compact-results" : ""}`}>
          <div className="result-meta">
            <strong>{loading ? "Loading CRM records" : `${results.length} CRM records found`}</strong>
            <span>OpenStreetMap + Leaflet using existing backend data</span>
          </div>
          {error && (
            <div className="map-config-alert">
              {error} <button type="button" onClick={fetchHcps}>Retry</button>
            </div>
          )}
          {loading && <div className="empty-state">Loading mapped CRM entities...</div>}
          {!loading && results.map((place) => (
            <article className="provider-card" key={place.id}>
              <div>
                <p className="eyebrow">{place.typeLabel}</p>
                <h3>{place.name}</h3>
                <p>{place.address}</p>
                <div className="provider-meta">
                  {place.specialty && <span>{place.specialty}</span>}
                  <span>{place.distance}</span>
                  <span>{place.metadata}</span>
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
          {!loading && !results.length && <div className="empty-state">No mapped CRM records match this search. Add HCP or account data to populate the map.</div>}
        </div>

        <aside className="map-panel">
          <CRMMapPanel places={results} location={location} />
          <p>
            Map powered by OpenStreetMap and Leaflet. Markers are generated from existing CRM HCP/account records.
          </p>
        </aside>
      </section>
    </main>
  );
}

export default DiscoveryPage;
