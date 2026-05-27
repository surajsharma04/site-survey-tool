import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Cable, Grip, Layers, MapPin, RadioTower, Router, Satellite, Target, Trash2 } from 'lucide-react';
import { getWorkspaceSnapshot } from '../workspaceSnapshot';

const pinTypes = [
  { id: 'ap', label: 'AP candidate', icon: Router, color: '#0f766e' },
  { id: 'riser', label: 'Riser', icon: Cable, color: '#2563eb' },
  { id: 'cabinet', label: 'Cabinet', icon: MapPin, color: '#d97706' },
  { id: 'weak', label: 'Weak signal', icon: RadioTower, color: '#dc2626' },
];

const defaultLayers = {
  floorPlan: true,
  rfHeat: true,
  cableRoutes: true,
  zones: true,
};

const normalizeMarker = (marker, index) => {
  if (Array.isArray(marker)) {
    return {
      id: `legacy-${index}-${marker[0]}-${marker[1]}`,
      x: 50 + ((marker[0] % 1) * 30),
      y: 50 - ((marker[1] % 1) * 30),
      type: 'ap',
      label: `Pin ${index + 1}`,
    };
  }

  return {
    id: marker.id || `pin-${index}`,
    x: Number.isFinite(marker.x) ? marker.x : 50,
    y: Number.isFinite(marker.y) ? marker.y : 50,
    type: marker.type || 'ap',
    label: marker.label || `Pin ${index + 1}`,
  };
};

const CanvasMap = () => {
  const boardRef = useRef(null);
  const workspace = getWorkspaceSnapshot();
  const [floorPlan] = useState(() => {
    const saved = localStorage.getItem('siteSurveyFloorPlan');
    return saved ? JSON.parse(saved) : null;
  });
  const [markers, setMarkers] = useState(() => {
    const saved = localStorage.getItem('siteSurveyMarkers');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.map(normalizeMarker);
  });
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const [syncStatus, setSyncStatus] = useState('Ready for field pins');
  const [activeType, setActiveType] = useState(pinTypes[0].id);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [layers, setLayers] = useState(() => {
    const saved = localStorage.getItem('siteSurveyMapLayers');
    return saved ? { ...defaultLayers, ...JSON.parse(saved) } : defaultLayers;
  });

  useEffect(() => {
    gsap.fromTo(
      boardRef.current,
      { opacity: 0, scale: 0.98 },
      { opacity: 1, scale: 1, duration: 0.55, ease: 'power3.out' }
    );
  }, []);

  useEffect(() => {
    localStorage.setItem('siteSurveyMarkers', JSON.stringify(markers));
    window.dispatchEvent(new Event('site-survey-workspace-updated'));
  }, [markers]);

  useEffect(() => {
    localStorage.setItem('siteSurveyMapLayers', JSON.stringify(layers));
  }, [layers]);

  useEffect(() => {
    if (!dragState) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      if (!boardRef.current) return;

      const rect = boardRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      setMarkers((current) =>
        current.map((marker) =>
          marker.id === dragState.id
            ? {
                ...marker,
                x: Math.min(98, Math.max(2, x)),
                y: Math.min(96, Math.max(4, y)),
              }
            : marker
        )
      );
    };

    const handlePointerUp = () => {
      setDragState(null);
      setSyncStatus('Pin position updated');
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState]);

  const addPin = (event) => {
    if (!boardRef.current || event.target.closest('[data-map-control="true"]')) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const type = pinTypes.find((item) => item.id === activeType) || pinTypes[0];
    const nextNumber = markers.length + 1;

    setMarkers((current) => [
      ...current,
      {
        id: `pin-${Date.now()}`,
        x: Math.min(98, Math.max(2, x)),
        y: Math.min(96, Math.max(4, y)),
        type: type.id,
        label: `${type.label} ${nextNumber}`,
      },
    ]);
    setSelectedMarkerId(null);
    setSyncStatus(`${type.label} ${nextNumber} added`);
  };

  const clearPins = () => {
    setMarkers([]);
    setSelectedMarkerId(null);
    setSyncStatus('Pins cleared');
  };

  const syncDevices = () => {
    setSyncStatus('Checking visible layers and RF pins...');
    setTimeout(() => {
      const visibleLayers = Object.values(layers).filter(Boolean).length;
      setSyncStatus(`Checked ${markers.length} pin${markers.length === 1 ? '' : 's'} across ${visibleLayers} layer${visibleLayers === 1 ? '' : 's'}`);
    }, 700);
  };

  const toggleLayer = (key) => {
    setLayers((current) => ({ ...current, [key]: !current[key] }));
  };

  const selectMarker = (event, markerId) => {
    event.stopPropagation();
    setSelectedMarkerId(markerId);
  };

  const startDraggingMarker = (event, markerId) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedMarkerId(markerId);
    setDragState({ id: markerId });
    setSyncStatus('Dragging selected pin...');
  };

  const deleteMarker = (markerId) => {
    setMarkers((current) => current.filter((marker) => marker.id !== markerId));
    setSelectedMarkerId((current) => (current === markerId ? null : current));
    setSyncStatus('Selected pin deleted');
  };

  const displayPlanName = floorPlan?.name || workspace.propertyName;
  const activeLayerCount = Object.values(layers).filter(Boolean).length;
  const selectedMarker = markers.find((marker) => marker.id === selectedMarkerId) || null;

  return (
    <div className="page-shell page-map mx-auto flex max-w-7xl flex-col">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">Spatial planning</p>
          <h1 className="text-3xl font-bold text-slate-950 tracking-tight">Pin Board</h1>
          <p className="text-slate-500 mt-1">Select a pin type, then click the floor plan to mark risers, cabinets, AP candidates, and weak-signal corners.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowLayerPanel(!showLayerPanel)} className="secondary-action">
            <Layers size={18} /> Layers
          </button>
          <button onClick={clearPins} className="secondary-action">
            <Trash2 size={18} /> Clear
          </button>
          <button onClick={syncDevices} className="primary-action">
            <Target size={18} /> Check Points
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" data-map-control="true">
        {pinTypes.map((type) => {
          const Icon = type.icon;
          const active = activeType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={`map-tool-button inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition-all ${
                active ? 'is-active border-teal-600 bg-teal-50 text-teal-800 shadow-sm' : 'border-slate-200 bg-white/85 text-slate-600 hover:bg-white'
              }`}
            >
              <Icon size={16} style={{ color: type.color }} />
              {type.label}
            </button>
          );
        })}
      </div>

      <div
        ref={boardRef}
        onClick={addPin}
        className="map-board map-board-height relative cursor-crosshair overflow-hidden rounded-3xl border border-slate-300 bg-stone-100 shadow-2xl"
      >
        <div className="map-board-glow absolute inset-0 pointer-events-none" />

        {layers.floorPlan && floorPlan?.dataUrl && floorPlan?.type?.startsWith('image/') && (
          <img src={floorPlan.dataUrl} alt={floorPlan.name} className="pointer-events-none absolute inset-0 h-full w-full object-contain p-6 opacity-[0.97]" />
        )}

        {layers.floorPlan && floorPlan?.dataUrl && floorPlan?.type === 'application/pdf' && (
          <iframe src={floorPlan.dataUrl} title={floorPlan.name} className="pointer-events-none absolute inset-0 h-full w-full bg-white opacity-[0.97]" />
        )}

        {layers.floorPlan && (
          <div className={`map-grid absolute inset-0 ${floorPlan?.dataUrl ? 'opacity-25 mix-blend-multiply' : ''}`} />
        )}

        {layers.zones && (
          <>
            <div className="map-zone absolute left-[8%] top-[10%] h-[28%] w-[30%] rounded-xl border-2 border-dashed" />
            <div className="map-zone absolute right-[10%] top-[12%] h-[34%] w-[34%] rounded-xl border-2 border-dashed" />
            <div className="map-zone absolute bottom-[12%] left-[16%] h-[30%] w-[58%] rounded-xl border-2 border-dashed" />
          </>
        )}

        {layers.cableRoutes && (
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M12 72 C28 58 34 66 48 48 S68 31 86 22" fill="none" stroke="#2563eb" strokeWidth="0.7" strokeDasharray="2 1.5" />
            <path d="M18 28 H38 V72 H78" fill="none" stroke="#0f766e" strokeWidth="0.65" strokeDasharray="1.5 1.2" />
          </svg>
        )}

        {layers.rfHeat && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_34%,rgba(16,185,129,.16),transparent_18%),radial-gradient(circle_at_62%_42%,rgba(245,158,11,.15),transparent_18%),radial-gradient(circle_at_76%_72%,rgba(220,38,38,.11),transparent_16%)]" />
        )}

        <div className="map-floor-label absolute left-6 top-6 right-6 z-20 rounded-2xl border px-4 py-4 shadow-sm lg:right-auto lg:max-w-[min(38rem,calc(100%-24rem))]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{floorPlan?.dataUrl ? 'Uploaded plan' : 'Selected site'}</p>
              <p className="map-floor-title mt-1 text-sm font-bold text-slate-900" title={displayPlanName}>{displayPlanName}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.16em]">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{markers.length} pin{markers.length === 1 ? '' : 's'}</span>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700">{activeLayerCount} layer{activeLayerCount === 1 ? '' : 's'}</span>
              {selectedMarker && <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">Pin selected</span>}
            </div>
          </div>
        </div>

        {markers.map((marker, index) => {
          const type = pinTypes.find((item) => item.id === marker.type) || pinTypes[0];
          const Icon = type.icon;
          const isSelected = selectedMarkerId === marker.id;
          return (
            <div
              key={marker.id}
              data-map-control="true"
              className={`map-pin absolute z-20 -translate-x-1/2 -translate-y-full ${isSelected ? 'is-selected' : ''} ${dragState?.id === marker.id ? 'is-dragging' : ''}`}
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              title={marker.label}
              onClick={(event) => selectMarker(event, marker.id)}
              onPointerDown={(event) => startDraggingMarker(event, marker.id)}
            >
              <div className="flex flex-col items-center">
                <div className="map-pin-node flex h-9 w-9 items-center justify-center rounded-full border-4 border-white text-white shadow-lg" style={{ backgroundColor: type.color }}>
                  <Icon size={16} />
                </div>
                {isSelected && (
                  <div className="map-pin-actions mb-1 flex items-center gap-1 rounded-full border border-white/70 bg-white/92 px-1.5 py-1 shadow-lg">
                    <button
                      type="button"
                      className="map-pin-action flex h-7 w-7 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteMarker(marker.id);
                      }}
                      aria-label={`Delete ${marker.label}`}
                    >
                      <Trash2 size={14} />
                    </button>
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                      <Grip size={11} /> Drag
                    </span>
                  </div>
                )}
                <span className="mt-1 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-white">P{index + 1}</span>
              </div>
            </div>
          );
        })}

        {showLayerPanel && (
          <div data-map-control="true" className="map-layer-panel absolute bottom-6 left-6 z-30 w-80 rounded-2xl border p-4 shadow-xl backdrop-blur-md">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
              <MapPin className="text-teal-600" size={20} />
              Active Survey
            </h3>
            <p className="mb-2 text-sm text-slate-600">Dropped Pins: <span className="font-bold text-slate-900">{markers.length}</span></p>
            <p className="mb-3 flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
              <Satellite size={14} /> {syncStatus}
            </p>

            <div className="mb-4 grid grid-cols-2 gap-2">
              {[
                ['floorPlan', 'Floor plan'],
                ['zones', 'Rooms/zones'],
                ['cableRoutes', 'Cable routes'],
                ['rfHeat', 'RF heat'],
              ].map(([key, label]) => (
                <label key={key} className="map-layer-toggle flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs font-bold text-slate-700">
                  {label}
                  <input type="checkbox" checked={layers[key]} onChange={() => toggleLayer(key)} className="h-4 w-4 accent-teal-700" />
                </label>
              ))}
            </div>

            {selectedMarker && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                <p className="font-bold uppercase tracking-[0.16em]">Selected pin</p>
                <p className="mt-1">{selectedMarker.label}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
                    onClick={() => deleteMarker(selectedMarker.id)}
                  >
                    <Trash2 size={14} /> Delete Pin
                  </button>
                </div>
              </div>
            )}

            <div className="map-pin-list space-y-2 overflow-y-auto">
              {markers.map((marker, i) => {
                const type = pinTypes.find((item) => item.id === marker.type) || pinTypes[0];
                return (
                  <button
                    type="button"
                    key={marker.id}
                    className={`map-pin-row flex w-full items-center justify-between rounded-lg p-2 text-left text-xs text-slate-600 ${selectedMarkerId === marker.id ? 'is-selected' : ''}`}
                    onClick={() => setSelectedMarkerId(marker.id)}
                  >
                    <span className="font-bold text-slate-800">Pin {i + 1}</span>
                    <span>{type.label} / {marker.x.toFixed(1)}%, {marker.y.toFixed(1)}%</span>
                  </button>
                );
              })}
              {markers.length === 0 && <p className="map-pin-empty rounded-lg p-3 text-xs text-slate-500">No pins yet. Pick a pin type above, then click the plan.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasMap;
