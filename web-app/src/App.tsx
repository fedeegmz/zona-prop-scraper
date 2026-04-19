import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Papa from 'papaparse';
import { MapPin, Maximize2, BedDouble, Bath, Loader2, Navigation, ExternalLink, SlidersHorizontal, ChevronRight, Plus, Minus } from 'lucide-react';
import './App.css';

interface Property {
  url: string;
  address: string;
  latitude: number;
  longitude: number;
  price_value: number;
  price_currency: string;
  expenses_value?: number;
  expenses_currency?: string;
  square_meters_area?: string;
  rooms?: string;
  bedrooms?: string;
  bathrooms?: string;
  parking?: string;
}

// Format price utility
const formatPrice = (value: number, currency: string) => {
  if (!value) return "Consultar";
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
    maximumFractionDigits: 0
  }).format(value);
};

// Custom Zoom Controls
function ZoomControls() {
  const map = useMap();
  return (
    <div className="zoom-controls">
      <button onClick={() => map.zoomIn()} title="Acercar">
        <Plus size={20} />
      </button>
      <div className="zoom-divider" />
      <button onClick={() => map.zoomOut()} title="Alejar">
        <Minus size={20} />
      </button>
    </div>
  );
}

// Component to dynamically fly to location
function MapAutoFly({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProp, setActiveProp] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");

  useEffect(() => {
    Papa.parse<Property>('/data.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Filter out properties missing crucial data
        const validProps = results.data.filter(p => p.latitude && p.longitude && p.price_value);
        setProperties(validProps as unknown as Property[]);
        setLoading(false);
      },
      error: (error) => {
        console.error("Error loading CSV: ", error);
        setLoading(false);
      }
    });
  }, []);

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      if (minPrice !== "" && p.price_value < minPrice) return false;
      if (maxPrice !== "" && p.price_value > maxPrice) return false;
      return true;
    });
  }, [properties, minPrice, maxPrice]);

  const mapCenter = useMemo(() => {
    const list = filteredProperties.length > 0 ? filteredProperties : properties;
    if (list.length === 0) return [-31.4201, -64.1888] as [number, number]; // Cordoba default
    const active = list.find(p => p.url === activeProp);
    if (active) return [active.latitude, active.longitude] as [number, number];
    return [list[0].latitude, list[0].longitude] as [number, number];
  }, [properties, filteredProperties, activeProp]);

  // Create custom marker icon
  const createCustomIcon = (price: number, currency: string, isActive: boolean) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="marker-pin ${isActive ? 'active' : ''}">${formatPrice(price, currency)}</div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={48} className="spin" />
        <p>Cargando propiedades...</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="loading-state">
        <Navigation size={48} />
        <p>No se encontraron propiedades procesadas. Verifica si ./data.csv existe.</p>
      </div>
    );
  }

  return (
    <div className={`app-container ${showFilters ? 'filters-open' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <h1>Zonaprop Explorer</h1>
          <p>{filteredProperties.length} propiedades encontradas</p>
        </div>

        <div className="property-list">
          {filteredProperties.map((prop, idx) => (
            <div
              key={idx}
              className={`glass-card property-card ${activeProp === prop.url ? 'active' : ''}`}
              onClick={() => setActiveProp(prop.url)}
            >
              <div className="price">
                <span>{formatPrice(prop.price_value, prop.price_currency)}</span>
                {prop.expenses_value && (
                  <span className="expenses">+ {formatPrice(prop.expenses_value, prop.expenses_currency || '$')} exp</span>
                )}
              </div>
              <div className="address">
                <MapPin size={14} style={{ display: 'inline', marginRight: 4, opacity: 0.7 }} />
                {prop.address}
              </div>

              <div className="features">
                {prop.square_meters_area && (
                  <div className="feature">
                    <Maximize2 size={14} /> {prop.square_meters_area} m²
                  </div>
                )}
                {prop.bedrooms && (
                  <div className="feature">
                    <BedDouble size={14} /> {prop.bedrooms} dorm
                  </div>
                )}
                {prop.bathrooms && (
                  <div className="feature">
                    <Bath size={14} /> {prop.bathrooms} ba
                  </div>
                )}
              </div>

              <div className="card-actions">
                <a
                  href={prop.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={14} />
                  Ver en Zonaprop
                </a>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Map View */}
      <main className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%', background: '#1e293b' }}
          zoomControl={false}
        >
          {/* CartoDB Dark Matter visually pairs excellently with Glassmorphism */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          <ZoomControls />
          <MapAutoFly center={mapCenter} />

          {filteredProperties.map((prop, idx) => (
            <Marker
              key={idx}
              position={[prop.latitude, prop.longitude]}
              icon={createCustomIcon(prop.price_value, prop.price_currency, activeProp === prop.url)}
              zIndexOffset={activeProp === prop.url ? 1000 : 0}
            >
              {/* Optional: Add Popup if user clicks instead of hovering */}
              <Popup>
                <div style={{ color: '#000', fontWeight: 600 }}>
                  <p style={{ margin: '0 0 5px 0' }}>{formatPrice(prop.price_value, prop.price_currency)}</p>
                  <a href={prop.url} target="_blank" style={{ fontSize: '0.85rem' }}>Ver propiedad</a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </main>

      {/* Right Sidebar - Filters */}
      <aside className={`filter-sidebar glass-panel ${showFilters ? 'open' : ''}`}>
        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
          title={showFilters ? "Cerrar filtros" : "Abrir filtros"}
        >
          {showFilters ? <ChevronRight size={20} /> : <SlidersHorizontal size={20} />}
        </button>

        <div className="filter-content">
          <div className="filter-header">
            <h3>Filtros</h3>
            {(minPrice !== "" || maxPrice !== "") && (
              <button className="btn-text" onClick={() => { setMinPrice(""); setMaxPrice(""); }}>
                Limpiar
              </button>
            )}
          </div>

          <div className="filter-section">
            <label>Rango de Precio</label>
            <div className="input-group">
              <div className="input-wrapper">
                <span>Min</span>
                <input
                  type="number"
                  placeholder="Ej: 500000"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
              <div className="input-wrapper">
                <span>Max</span>
                <input
                  type="number"
                  placeholder="Ej: 1500000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;
