import { US_STATES } from './validation';

export type NominatimAddress = {
  name: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
};

interface NominatimPlace {
  name?: string;
  address?: {
    road?: string;
    pedestrian?: string;
    footway?: string;
    path?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

function mapNominatimData(place: NominatimPlace, venueName: string): NominatimAddress {
  const addr = place.address || {};
  const line1 = addr.road || addr.pedestrian || addr.footway || addr.path || '';
  const houseNumber = addr.house_number ? `${addr.house_number} ` : '';
  const fullLine1 = houseNumber + line1;
  const city = addr.city || addr.town || addr.village || addr.county || '';
  let state = addr.state || '';
  
  // Convert full state name to 2-letter code for the form dropdown
  if (state.length > 2) {
    const found = US_STATES.find(s => s.name.toLowerCase() === state.toLowerCase());
    if (found) state = found.code;
  }
  
  const zip = addr.postcode || '';

  return {
    name: place.name || venueName,
    line1: fullLine1.trim(),
    city,
    state,
    zip,
  };
}

export async function searchVenueWithZip(venueName: string, zip: string, _restrict: boolean): Promise<NominatimAddress | undefined> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', `${venueName} ${zip}`);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '1');

    const res = await fetch(url.toString());
    if (!res.ok) return undefined;
    
    const data = await res.json();
    if (!data || data.length === 0) return undefined;
    
    return mapNominatimData(data[0], venueName);
  } catch {
    return undefined;
  }
}

export async function fetchUserZipCode(): Promise<string | undefined> {
  if (!navigator.geolocation) return undefined;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
    });
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', pos.coords.latitude.toString());
    url.searchParams.set('lon', pos.coords.longitude.toString());
    url.searchParams.set('format', 'json');
    const res = await fetch(url.toString());
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.address?.postcode;
  } catch {
    return undefined;
  }
}

export async function fetchVenueLocation(venueName: string): Promise<NominatimAddress | undefined> {
  if (!navigator.geolocation) return undefined;

  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
    });

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', venueName);
    url.searchParams.set('lat', pos.coords.latitude.toString());
    url.searchParams.set('lon', pos.coords.longitude.toString());
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '1');

    const res = await fetch(url.toString());
    if (!res.ok) return undefined;
    
    const data = await res.json();
    if (!data || data.length === 0) return undefined;
    
    return mapNominatimData(data[0], venueName);
  } catch {
    return undefined;
  }
}

