import { useEffect, useMemo, useState } from "react";

import { searchPlaces } from "../hooks/api";

const doctorSpecialties = ["Cardiologist", "Dentist", "Pediatrician", "Orthopedic Doctor", "Dermatologist", "General Physician"];

const defaults = {
  doctors: {
    eyebrow: "Find doctors",
    title: "Find Verified Doctors Near You",
    subtitle: "Search by speciality, rating, distance, and availability across nearby healthcare providers.",
    query: "doctor near me",
    filters: doctorSpecialties,
    cta: "Book Appointment",
  },
  clinics: {
    eyebrow: "Clinics",
    title: "Nearby Clinics",
    subtitle: "Compare ratings, locations, contact details, and visit options for clinics around you.",
    query: "medical clinic near me",
    filters: ["Medical Clinic", "Dental Clinic", "Diagnostics", "Open Now"],
    cta: "Book Visit",
  },
  hospitals: {
    eyebrow: "Hospitals",
    title: "Hospitals Around You",
    subtitle: "Find hospitals with emergency support, directions, ratings, and consultation options.",
    query: "hospital near me",
    filters: ["Emergency", "Multi-speciality", "Open Now", "Highest Rated"],
    cta: "Book Consultation",
  },
};

function DiscoveryPage({ type = "doctors" }) {
  const config = defaults[type];
  const [query, setQuery] = useState(config.query);
  const [location, setLocation] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("list");
  const [source, setSource] = useState("mock");

  const markerSummary = useMemo(() => results.slice(0, 6), [results]);

  const runSearch = async (nextQuery = query, nextLocation = location) => {
    setLoading(true);
    try {
      const response = await searchPlaces({
        query: nextQuery,
        latitude: nextLocation?.latitude,
        longitude: nextLocation?.longitude,
        radius: 6000,
      });
      setResults(response.data.results || []);
      setSource(response.data.source || "mock");
    } catch (error) {
      setResults([]);
      setSource("offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(nextLocation);
        runSearch(config.query, nextLocation);
      },
      () => runSearch(config.query, null),
      { timeout: 5000 }
    );
  }, [config.query]);

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
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search specialty, hospital, clinic, or city" />
          <button type="button" onClick={() => runSearch()}>Search</button>
        </div>
        <div className="filter-row">
          {config.filters.map((filter) => (
            <button className="filter-chip" type="button" key={filter} onClick={() => { setQuery(`${filter} near me`); runSearch(`${filter} near me`); }}>
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="discovery-layout">
        <div className={`result-list ${view === "map" ? "compact-results" : ""}`}>
          <div className="result-meta">
            <strong>{loading ? "Searching nearby providers" : `${results.length} results found`}</strong>
            <span>{source === "google" ? "Live Google Places results" : "Demo results until Google Maps API key is configured"}</span>
          </div>
          {results.map((place) => (
            <article className="provider-card" key={place.id || place.name}>
              <div>
                <p className="eyebrow">{place.category || config.eyebrow}</p>
                <h3>{place.name}</h3>
                <p>{place.address}</p>
                <div className="provider-meta">
                  <span>Rating {place.rating || "New"}</span>
                  <span>{place.distance || "Nearby"}</span>
                  <span>{place.open_now === false ? "Closed" : "Open Now"}</span>
                </div>
                <p className="availability">Availability: {place.availability || "Check availability"}</p>
              </div>
              <div className="provider-actions">
                <a href={`tel:${place.phone || ""}`}>Call</a>
                <a href={place.directions_url} target="_blank" rel="noreferrer">Directions</a>
                <button type="button">{config.cta}</button>
              </div>
            </article>
          ))}
          {!loading && !results.length && <div className="empty-state">No nearby providers found. Try another location or speciality.</div>}
        </div>

        <aside className="map-panel">
          <div className="map-canvas">
            <span>Map View</span>
            {markerSummary.map((place, index) => (
              <div className={`map-marker marker-${index + 1}`} key={place.id || place.name}>{index + 1}</div>
            ))}
          </div>
          <p>
            Google Maps data is loaded through the backend Places proxy. Add `GOOGLE_MAPS_API_KEY` in Render to show live
            provider results.
          </p>
        </aside>
      </section>
    </main>
  );
}

export default DiscoveryPage;
