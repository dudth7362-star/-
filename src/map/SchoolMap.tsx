import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { School, SchoolType } from '../types';
import { TILE_CONFIG } from './tileConfig';
import { Layers, MapPin, RefreshCw, ZoomIn, Eye, EyeOff } from 'lucide-react';

interface SchoolMapProps {
  schools: School[];
  selectedSchool: School | null;
  onSelectSchool: (school: School) => void;
  selectedDistrict: string;
}

// Color map per school type
const SCHOOL_TYPE_COLORS: Record<SchoolType, { bg: string; text: string; border: string }> = {
  일반고: { bg: '#2563eb', text: '#ffffff', border: '#1d4ed8' },
  자사고: { bg: '#7c3aed', text: '#ffffff', border: '#6d28d9' },
  특목고: { bg: '#059669', text: '#ffffff', border: '#047857' },
  영재고: { bg: '#d97706', text: '#ffffff', border: '#b45309' },
  특성화고: { bg: '#0891b2', text: '#ffffff', border: '#0e7490' },
  학력인정고: { bg: '#475569', text: '#ffffff', border: '#334155' },
  기타: { bg: '#64748b', text: '#ffffff', border: '#475569' },
};

function getGenderChar(gender: string): string {
  if (gender === '남학교') return '남';
  if (gender === '여학교') return '여';
  if (gender === '남녀공학') return '공';
  return '고';
}

function createSchoolIcon(school: School, isSelected: boolean): L.DivIcon {
  const typeStyle = SCHOOL_TYPE_COLORS[school.schoolType] || SCHOOL_TYPE_COLORS.기타;
  const genderChar = getGenderChar(school.genderType);
  const size = isSelected ? 34 : 26;
  const half = size / 2;

  const foundationBadge =
    school.foundationType === '사립'
      ? `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white"></span>`
      : school.foundationType === '국립'
      ? `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white"></span>`
      : '';

  const selectedRing = isSelected
    ? 'ring-4 ring-blue-500 ring-offset-2 scale-110 shadow-lg z-50'
    : 'shadow-md hover:scale-105';

  const html = `
    <div class="relative flex items-center justify-center transition-all duration-150 cursor-pointer ${selectedRing}" 
         style="width:${size}px; height:${size}px; border-radius:9999px; background-color:${typeStyle.bg}; border: 2px solid ${isSelected ? '#ffffff' : '#f8fafc'};">
      <span style="color:${typeStyle.text}; font-size:${isSelected ? '13px' : '11px'}; font-weight:700; line-height:1; user-select:none;">
        ${genderChar}
      </span>
      ${foundationBadge}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'school-marker-div-icon',
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half],
  });
}

const SEOUL_BOUNDS: L.LatLngBoundsLiteral = [
  [37.413, 126.734], // SouthWest
  [37.715, 127.269], // NorthEast
];

const SEOUL_MAX_BOUNDS: L.LatLngBoundsLiteral = [
  [37.25, 126.55],
  [37.88, 127.45],
];

export const SchoolMap: React.FC<SchoolMapProps> = ({
  schools,
  selectedSchool,
  onSelectSchool,
  selectedDistrict,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Boundary layers
  const districtLayersRef = useRef<L.GeoJSON | null>(null);
  const eduOfficeLayersRef = useRef<L.GeoJSON | null>(null);
  const districtBoundsMapRef = useRef<Map<string, L.LatLngBounds>>(new Map());

  // UI state
  const [isMapReady, setIsMapReady] = useState(false);
  const [tileErrorCount, setTileErrorCount] = useState(0);
  const [showTileErrorBanner, setShowTileErrorBanner] = useState(false);
  const [showDistrictBorders, setShowDistrictBorders] = useState(true);
  const [showEduOfficeBorders, setShowEduOfficeBorders] = useState(true);
  const [boundaryLoadError, setBoundaryLoadError] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // 1. Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 9,
      maxBounds: SEOUL_MAX_BOUNDS,
      maxBoundsViscosity: 0.8,
    });

    // Custom panes
    map.createPane('boundariesPane');
    const boundariesPane = map.getPane('boundariesPane');
    if (boundariesPane) {
      boundariesPane.style.zIndex = '350';
      boundariesPane.style.pointerEvents = 'auto';
    }

    // Zoom control on top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Initial fit bounds to Seoul
    map.fitBounds(SEOUL_BOUNDS, { padding: [16, 16] });

    // OpenStreetMap Tile Layer
    let consecutiveTileErrors = 0;
    let anyTileLoaded = false;

    const tileLayer = L.tileLayer(TILE_CONFIG.url, {
      attribution: TILE_CONFIG.attribution,
      maxZoom: TILE_CONFIG.maxZoom,
    });

    tileLayer.on('tileerror', () => {
      consecutiveTileErrors++;
      if (consecutiveTileErrors >= 5 && !anyTileLoaded) {
        setShowTileErrorBanner(true);
      }
    });

    tileLayer.on('tileload', () => {
      anyTileLoaded = true;
      consecutiveTileErrors = 0;
      setShowTileErrorBanner(false);
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    // Marker cluster group
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      removeOutsideVisibleBounds: true,
      maxClusterRadius: 40,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let bgClass = 'bg-blue-600';
        let size = 36;
        if (count > 25) {
          bgClass = 'bg-indigo-700';
          size = 42;
        } else if (count > 10) {
          bgClass = 'bg-blue-600';
          size = 38;
        }
        return L.divIcon({
          html: `<div class="flex items-center justify-center rounded-full ${bgClass} text-white font-bold text-xs shadow-md border-2 border-white" style="width:${size}px; height:${size}px;">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: [size, size],
        });
      },
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;
    mapRef.current = map;
    setIsMapReady(true);

    // ResizeObserver to handle size changes smoothly
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(containerRef.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Load GeoJSON Boundaries (Districts + EduOffices)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    async function fetchBoundaries() {
      const candidates = ['/data/seoul-gu.geojson', 'https://highmap.labbitory.com/data/seoul-gu.geojson'];

      let validData: any = null;

      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const text = await res.text();
          const json = JSON.parse(text);

          if (
            json &&
            json.type === 'FeatureCollection' &&
            Array.isArray(json.features) &&
            json.features.filter((f: any) => f?.properties?.kind === 'district').length === 25
          ) {
            validData = json;
            break;
          }
        } catch {
          // continue to next candidate
        }
      }

      if (!validData) {
        setBoundaryLoadError(true);
        return;
      }

      try {
        const districtFeatures = validData.features.filter((f: any) => f.properties?.kind === 'district');
        const eduOfficeFeatures = validData.features.filter((f: any) => f.properties?.kind === 'eduOffice');

        // District boundary layer
        const districtLayer = L.geoJSON(districtFeatures, {
          pane: 'boundariesPane',
          style: {
            color: '#64748b',
            weight: 1.2,
            opacity: 0.6,
            fillColor: '#94a3b8',
            fillOpacity: 0.04,
            dashArray: '3, 3',
          },
          onEachFeature: (feature, layer) => {
            const name = feature.properties?.name;
            if (name) {
              const bounds = (layer as L.Polygon).getBounds();
              districtBoundsMapRef.current.set(name, bounds);

              // Non-interactive tooltip for district name
              layer.bindTooltip(name, {
                permanent: true,
                direction: 'center',
                className: 'district-label-tooltip',
                interactive: false,
              });
            }
          },
        });

        // EduOffice boundary layer
        const eduOfficeLayer = L.geoJSON(eduOfficeFeatures, {
          pane: 'boundariesPane',
          style: {
            color: '#2563eb',
            weight: 2.4,
            opacity: 0.85,
            fillOpacity: 0,
          },
        });

        districtLayersRef.current = districtLayer;
        eduOfficeLayersRef.current = eduOfficeLayer;

        if (showDistrictBorders) {
          districtLayer.addTo(map);
        }
        if (showEduOfficeBorders) {
          eduOfficeLayer.addTo(map);
        }
      } catch (err) {
        console.warn('Error rendering boundary layers:', err);
        setBoundaryLoadError(true);
      }
    }

    fetchBoundaries();

    return () => {
      if (districtLayersRef.current && map) {
        map.removeLayer(districtLayersRef.current);
      }
      if (eduOfficeLayersRef.current && map) {
        map.removeLayer(eduOfficeLayersRef.current);
      }
    };
  }, [isMapReady]);

  // Toggle district borders
  useEffect(() => {
    if (!mapRef.current || !districtLayersRef.current) return;
    if (showDistrictBorders) {
      districtLayersRef.current.addTo(mapRef.current);
    } else {
      mapRef.current.removeLayer(districtLayersRef.current);
    }
  }, [showDistrictBorders]);

  // Toggle eduOffice borders
  useEffect(() => {
    if (!mapRef.current || !eduOfficeLayersRef.current) return;
    if (showEduOfficeBorders) {
      eduOfficeLayersRef.current.addTo(mapRef.current);
    } else {
      mapRef.current.removeLayer(eduOfficeLayersRef.current);
    }
  }, [showEduOfficeBorders]);

  // 3. Update Markers when schools list changes
  useEffect(() => {
    if (!mapRef.current || !clusterGroupRef.current) return;
    const clusterGroup = clusterGroupRef.current;

    clusterGroup.clearLayers();
    markersMapRef.current.clear();
    selectedMarkerRef.current = null;

    const markersToAdd: L.Marker[] = [];

    schools.forEach((school) => {
      if (!school.hasLocation || school.latitude === null || school.longitude === null) {
        return;
      }

      const isSelected = selectedSchool?.schoolCode === school.schoolCode;
      const icon = createSchoolIcon(school, isSelected);

      const marker = L.marker([school.latitude, school.longitude], {
        icon,
        title: school.schoolName,
      });

      // Secure DOM-based Popup content (no raw string injection)
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-1 min-w-[200px] text-slate-800';

      const titleEl = document.createElement('div');
      titleEl.className = 'font-bold text-sm text-slate-900 border-b pb-1 mb-1.5 flex items-center justify-between';
      titleEl.textContent = school.schoolName;
      popupDiv.appendChild(titleEl);

      const metaEl = document.createElement('div');
      metaEl.className = 'text-xs text-slate-500 mb-2 flex items-center gap-1.5 flex-wrap';
      metaEl.textContent = `${school.district} · ${school.schoolType} · ${school.genderType} · ${school.foundationType}`;
      popupDiv.appendChild(metaEl);

      if (school.address) {
        const addrEl = document.createElement('div');
        addrEl.className = 'text-xs text-slate-600 mb-2 truncate';
        addrEl.textContent = school.address;
        popupDiv.appendChild(addrEl);
      }

      const btnEl = document.createElement('button');
      btnEl.className =
        'w-full py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors';
      btnEl.textContent = '공시정보 상세 보기';
      btnEl.onclick = (e) => {
        e.stopPropagation();
        onSelectSchool(school);
      };
      popupDiv.appendChild(btnEl);

      marker.bindPopup(popupDiv, { maxWidth: 280 });

      marker.on('click', () => {
        onSelectSchool(school);
      });

      markersMapRef.current.set(school.schoolCode, marker);
      markersToAdd.push(marker);

      if (isSelected) {
        selectedMarkerRef.current = marker;
      }
    });

    clusterGroup.addLayers(markersToAdd);
  }, [schools, onSelectSchool]);

  // 4. Synchronize selected school from list
  useEffect(() => {
    if (!selectedSchool || !mapRef.current || !clusterGroupRef.current) return;

    // Reset previously highlighted marker
    if (selectedMarkerRef.current) {
      const prevCode = (selectedMarkerRef.current as any)._schoolCode;
      const prevSchool = schools.find((s) => s.schoolCode === prevCode);
      if (prevSchool) {
        selectedMarkerRef.current.setIcon(createSchoolIcon(prevSchool, false));
        selectedMarkerRef.current.setZIndexOffset(0);
      }
      selectedMarkerRef.current = null;
    }

    const marker = markersMapRef.current.get(selectedSchool.schoolCode);
    if (!marker) {
      return;
    }

    (marker as any)._schoolCode = selectedSchool.schoolCode;
    selectedMarkerRef.current = marker;

    // Highlight icon
    marker.setIcon(createSchoolIcon(selectedSchool, true));
    marker.setZIndexOffset(1000);

    // Zoom to layer through cluster
    clusterGroupRef.current.zoomToShowLayer(marker, () => {
      marker.openPopup();
      if (mapRef.current && marker.getLatLng()) {
        mapRef.current.panTo(marker.getLatLng(), { animate: true });
      }
    });
  }, [selectedSchool, schools]);

  // 5. Pan/fit bounds when district filter changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (!selectedDistrict || selectedDistrict === 'all') {
      map.fitBounds(SEOUL_BOUNDS, { padding: [20, 20] });
      return;
    }

    // Try polygon bounds from GeoJSON
    const polygonBounds = districtBoundsMapRef.current.get(selectedDistrict);
    if (polygonBounds) {
      map.fitBounds(polygonBounds, { padding: [30, 30] });
      return;
    }

    // Fallback: fit to visible schools in that district
    const districtSchools = schools.filter(
      (s) => s.district === selectedDistrict && s.hasLocation && s.latitude && s.longitude
    );
    if (districtSchools.length > 0) {
      const latLngs = districtSchools.map((s) => L.latLng(s.latitude!, s.longitude!));
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [selectedDistrict, schools]);

  const resetToSeoul = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.fitBounds(SEOUL_BOUNDS, { padding: [20, 20] });
    }
  }, []);

  const retryTiles = useCallback(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.redraw();
      setShowTileErrorBanner(false);
    }
  }, []);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-100 flex flex-col overflow-hidden">
      {/* Map container */}
      <div ref={containerRef} className="w-full h-full z-0" style={{ height: '100%', minHeight: '380px' }} />

      {/* Preparing Map Overlay */}
      {!isMapReady && (
        <div className="absolute inset-0 bg-slate-50/90 z-20 flex items-center justify-center text-slate-600 text-sm font-medium">
          <RefreshCw className="w-4 h-4 mr-2 animate-spin text-blue-600" />
          지도를 준비하고 있습니다…
        </div>
      )}

      {/* Tile Loading Error Banner */}
      {showTileErrorBanner && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90%] bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2 rounded-lg shadow text-xs flex items-center justify-between">
          <span>배경지도를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.</span>
          <button
            onClick={retryTiles}
            className="ml-3 shrink-0 px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition font-medium"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Top Floating Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
        {/* Reset bounds button */}
        <button
          onClick={resetToSeoul}
          title="서울 전체 보기"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg shadow-sm text-xs font-medium transition"
        >
          <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
          <span>서울 전체</span>
        </button>

        {/* Boundary Toggles */}
        <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-lg shadow-sm p-1.5 flex flex-col gap-1 text-xs">
          <div className="text-[11px] font-semibold text-slate-500 px-1 py-0.5 border-b border-slate-100 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>경계 표시</span>
          </div>
          <button
            onClick={() => setShowDistrictBorders(!showDistrictBorders)}
            className={`flex items-center justify-between gap-3 px-2 py-1 rounded transition text-left ${
              showDistrictBorders ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>자치구 경계</span>
            {showDistrictBorders ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
          </button>
          <button
            onClick={() => setShowEduOfficeBorders(!showEduOfficeBorders)}
            className={`flex items-center justify-between gap-3 px-2 py-1 rounded transition text-left ${
              showEduOfficeBorders ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>교육지원청 경계</span>
            {showEduOfficeBorders ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
          </button>
          {boundaryLoadError && (
            <span className="text-[10px] text-rose-500 px-1">구 경계 데이터를 불러오지 못했습니다</span>
          )}
        </div>
      </div>

      {/* Floating Legend (Bottom Left, safely above bottom and away from OSM attribution) */}
      <div className="absolute bottom-6 left-3 z-10">
        {showLegend ? (
          <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-lg shadow-md p-2.5 max-w-[210px] text-xs">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
              <span className="font-semibold text-slate-800 text-[11px]">학교 마커 범례</span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-slate-400 hover:text-slate-600 text-[10px] underline ml-2"
              >
                접기
              </button>
            </div>

            {/* School Type Colors */}
            <div className="grid grid-cols-2 gap-1 mb-2">
              {Object.entries(SCHOOL_TYPE_COLORS).map(([type, style]) => (
                <div key={type} className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: style.bg }}
                  />
                  <span className="text-slate-600 truncate">{type}</span>
                </div>
              ))}
            </div>

            {/* Gender / Foundation Labels */}
            <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-100 space-y-0.5">
              <div>마커 문자: <strong className="text-slate-700">남</strong>(남고) · <strong className="text-slate-700">여</strong>(여고) · <strong className="text-slate-700">공</strong>(공학)</div>
              <div>작은 배지: <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span> 사립 · <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500"></span> 국립</div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLegend(true)}
            className="bg-white/95 backdrop-blur border border-slate-200 rounded-lg shadow px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-white"
          >
            범례 보기
          </button>
        )}
      </div>
    </div>
  );
};
