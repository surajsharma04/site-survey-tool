const parseStoredJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const getWorkspaceSnapshot = () => {
  const properties = parseStoredJson('siteSurveyProperties', []);
  const floorPlan = parseStoredJson('siteSurveyFloorPlan', null);
  const markers = parseStoredJson('siteSurveyMarkers', []);
  const completedSurvey = parseStoredJson('completedSurvey', null);

  const totals = properties.reduce((accumulator, property) => ({
    buildings: accumulator.buildings + (property.buildings || 0),
    floors: accumulator.floors + (property.floors || 0),
    spaces: accumulator.spaces + (property.spaces || 0),
  }), { buildings: 0, floors: 0, spaces: 0 });

  const openSites = properties.length;
  const hasFloorPlan = Boolean(floorPlan?.name);
  const hasSurvey = Boolean(completedSurvey);
  const pinCount = Array.isArray(markers) ? markers.length : 0;
  const readinessChecks = [openSites > 0, hasFloorPlan, hasSurvey, pinCount > 0].filter(Boolean).length;
  const readinessPercent = Math.round((readinessChecks / 4) * 100);
  const firstProperty = properties[0] || null;
  const propertyName = firstProperty?.name || 'No site selected';
  const propertyAddress = firstProperty?.address || 'Add a property to personalize this workspace';
  const systemHealth = openSites === 0
    ? 'Needs intake'
    : hasFloorPlan && hasSurvey
      ? 'Stable'
      : 'In progress';

  const activity = [
    {
      title: hasSurvey ? 'Survey completed' : 'Survey still in progress',
      detail: hasSurvey ? 'Checklist answers are ready for reporting.' : 'Complete the checklist to unlock a finalized handoff note.',
      stamp: hasSurvey ? 'Checklist ready' : 'Waiting on checklist',
    },
    {
      title: hasFloorPlan ? 'Floor plan staged' : 'No floor plan uploaded yet',
      detail: hasFloorPlan ? `${floorPlan.name} is available for mapping and markup.` : 'Upload a PDF or image plan to start placing spatial pins.',
      stamp: hasFloorPlan ? 'Plan attached' : 'Plan missing',
    },
    {
      title: pinCount > 0 ? 'Mapping board active' : 'Mapping board empty',
      detail: pinCount > 0 ? `${pinCount} pin${pinCount === 1 ? '' : 's'} captured across the current plan.` : 'Drop AP, riser, cabinet, or weak-signal markers to build survey context.',
      stamp: pinCount > 0 ? `${pinCount} pins` : '0 pins',
    },
    {
      title: openSites > 0 ? 'Property inventory available' : 'No properties saved yet',
      detail: openSites > 0 ? `${openSites} site${openSites === 1 ? '' : 's'} currently stored in this workspace.` : 'Create a property to anchor plans, reports, and site status.',
      stamp: openSites > 0 ? `${openSites} site${openSites === 1 ? '' : 's'}` : 'Needs intake',
    },
  ];

  return {
    properties,
    floorPlan,
    markers,
    completedSurvey,
    totals,
    openSites,
    hasFloorPlan,
    hasSurvey,
    pinCount,
    readinessPercent,
    systemHealth,
    propertyName,
    propertyAddress,
    activity,
  };
};
