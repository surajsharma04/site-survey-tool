import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Building2, ChevronRight, MapPin, Plus, RadioTower, Save, Search, Upload, X } from 'lucide-react';
import { siteApi } from '../api';

const propertyTypes = [
  'Apartment complex (Residential MDU)',
  'Office building (Commercial MTU)',
  'University or government campus',
  'Public park or large outdoor area',
];

const emptyForm = {
  name: '',
  address: '',
  type: propertyTypes[0],
};

const Properties = () => {
  const listRef = useRef(null);
  const navigate = useNavigate();
  const [properties, setProperties] = useState(() => {
    const saved = localStorage.getItem('siteSurveyProperties');
    return saved ? JSON.parse(saved) : [];
  });
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    siteApi.properties()
      .then((remoteProperties) => {
        if (!ignore && Array.isArray(remoteProperties)) {
          setProperties(remoteProperties.map((property) => ({
            ...property,
            type: property.type || 'Site',
            buildings: property.buildings || 0,
            floors: property.floors || 0,
            spaces: property.spaces || 0,
            status: property.status || 'Synced',
          })));
          setSyncMessage('Synced with backend');
        }
      })
      .catch(() => setSyncMessage('Using local workspace data'));
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('siteSurveyProperties', JSON.stringify(properties));
    window.dispatchEvent(new Event('site-survey-workspace-updated'));
  }, [properties]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.prop-item', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' });

      gsap.utils.toArray('.property-reveal').forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 26 },
          {
            opacity: 1,
            y: 0,
            duration: 0.72,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 84%',
            },
          }
        );
      });
    });

    return () => ctx.revert();
  }, [properties.length]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
  };

  const addProperty = async (event) => {
    event.preventDefault();
    const draft = {
      id: Date.now(),
      name: form.name.trim(),
      address: form.address.trim(),
      type: form.type,
      buildings: 1,
      floors: 1,
      spaces: 0,
      status: 'New intake',
    };
    let next = draft;
    try {
      const saved = await siteApi.createProperty({
        name: draft.name,
        addressLine1: draft.address,
        country: 'India',
      });
      next = { ...draft, ...saved, type: draft.type, status: 'Synced' };
      setSyncMessage('Property saved to backend');
    } catch {
      setSyncMessage('Saved locally; backend was unavailable or your role cannot create properties');
    }
    setProperties([next, ...properties]);
    closeForm();
  };

  const filtered = properties.filter((prop) => `${prop.name} ${prop.address || ''} ${prop.type}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-shell page-properties mx-auto max-w-7xl">
      <div className="property-reveal mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-600">Property inventory</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Sites & Buildings</h1>
          <p className="mt-1 text-slate-500">Track the places your crew still needs to walk, measure, or approve.</p>
          {syncMessage && <p className="mt-2 text-sm font-semibold text-teal-700">{syncMessage}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/floor-plans')} className="secondary-action">
            <Upload size={18} /> Upload Plan
          </button>
          <button onClick={() => setShowForm(true)} className="primary-action">
            <Plus size={18} /> New Property
          </button>
        </div>
      </div>

      {showForm && (
        <div className="property-reveal mb-6 rounded-2xl border border-teal-200 bg-white/95 p-5 shadow-lg">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Add property intake</h2>
              <p className="mt-1 text-sm text-slate-500">Capture the site details before any floor plans or survey pins are added.</p>
            </div>
            <button onClick={closeForm} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" aria-label="Close property form">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={addProperty} className="grid gap-4 lg:grid-cols-[1fr_1.2fr_1fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Property name</label>
              <input
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400"
                placeholder="Example: Greenview Towers"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Address or area</label>
              <input
                value={form.address}
                onChange={(event) => updateForm('address', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400"
                placeholder="Street address, campus name, or park zone"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Property type</label>
              <select
                value={form.type}
                onChange={(event) => updateForm('type', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800"
              >
                {propertyTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="primary-action h-[46px]">
              <Save size={18} /> Add
            </button>
          </form>
        </div>
      )}

      <div className="property-reveal mb-5 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
        <Search size={18} className="text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400" placeholder="Search by site name, address, or property type" />
      </div>

      <div ref={listRef} className="space-y-4">
        {filtered.length === 0 && (
          <div className="property-reveal metric-card rounded-3xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Building2 size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{properties.length === 0 ? 'No properties added yet' : 'No matching properties found'}</h3>
            <p className="mt-2 text-sm text-slate-500">
              {properties.length === 0
                ? 'Create your first property to drive dashboard counts, floor plan selection, mapping, and reports.'
                : 'Try a different search term or clear the current filter.'}
            </p>
          </div>
        )}
        {filtered.map((prop) => (
          <button key={prop.id} onClick={() => navigate('/floor-plans')} className="prop-item metric-card flex w-full flex-col gap-5 p-6 text-left lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-teal-50 p-4 text-teal-600">
                <Building2 size={24} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{prop.name}</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{prop.type}</span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                  <MapPin size={14} /> {prop.address || 'Address not added'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {[
                ['Buildings', prop.buildings],
                ['Floors', prop.floors],
                ['Spaces', prop.spaces],
              ].map(([label, value]) => (
                <div key={label} className="min-w-20 text-center">
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
                </div>
              ))}
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                <RadioTower size={16} /> {prop.status}
              </div>
              <ChevronRight className="text-slate-400" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Properties;
