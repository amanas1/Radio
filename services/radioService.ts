
import { RadioStation } from '../types';
import { RADIO_BROWSER_MIRRORS } from '../constants';

const CACHE_KEY_PREFIX = 'streamflow_station_cache_v6_';
const CACHE_TTL_MINUTES = 30;

interface CacheEntry {
    data: RadioStation[];
    timestamp: number; 
}

const getFromCache = (key: string): RadioStation[] | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
        if (cached) {
            const entry: CacheEntry = JSON.parse(cached);
            const now = Date.now();
            if (now - entry.timestamp < CACHE_TTL_MINUTES * 60 * 1000) {
                return entry.data;
            }
            localStorage.removeItem(CACHE_KEY_PREFIX + key);
        }
    } catch (e) {
        localStorage.removeItem(CACHE_KEY_PREFIX + key);
    }
    return null;
};

const setToCache = (key: string, data: RadioStation[]) => {
    try {
        const entry: CacheEntry = { data, timestamp: Date.now() };
        localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(entry));
    } catch (e) {}
};

const promiseAny = <T>(promises: Promise<T>[]): Promise<T> => {
    return new Promise((resolve, reject) => {
        let rejectedCount = 0;
        const errors: any[] = [];
        if (promises.length === 0) {
            return reject(new Error("No promises provided"));
        }
        promises.forEach((p, i) => {
            p.then(resolve).catch(err => {
                errors[i] = err;
                rejectedCount++;
                if (rejectedCount === promises.length) {
                    reject(new Error("All mirrors failed"));
                }
            });
        });
    });
};

const fetchAcrossMirrorsFast = async (path: string, urlParams: string): Promise<RadioStation[]> => {
    const query = urlParams ? `?${urlParams}` : '';
    
    const fetchPromises = RADIO_BROWSER_MIRRORS.map(async (baseUrl) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // Fast but reliable timeout

        try {
            const response = await fetch(`${baseUrl}/${path}${query}`, {
                mode: 'cors',
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error('Mirror status not OK');
            return await response.json();
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    });

    try {
        return await promiseAny(fetchPromises);
    } catch (e) {
        console.warn("All fast mirrors failed, trying fallback...");
        throw new Error("Station source unavailable");
    }
};

const filterStations = (data: RadioStation[]) => {
    if (!Array.isArray(data)) return [];
    
    const uniqueStations = new Map();
    const len = data.length;
    
    for (let i = 0; i < len; i++) {
      const station = data[i];
      if (!station || !station.url_resolved) continue;
      
      const url = station.url_resolved;
      if (url.charCodeAt(4) !== 115) continue; // Must be https
      
      const codec = (station.codec || '').toLowerCase();
      const isBrowserCompatible = 
        codec.includes('mp3') || 
        codec.includes('aac') || 
        url.includes('.mp3') || 
        url.includes('.aac') ||
        codec === '';

      if (isBrowserCompatible) {
        const existing = uniqueStations.get(station.name);
        if (!existing || station.votes > existing.votes) {
            uniqueStations.set(station.name, station);
        }
      }
    }

    return Array.from(uniqueStations.values())
        .sort((a: any, b: any) => b.votes - a.votes) as RadioStation[];
};

export const fetchStationsByTag = async (tag: string, limit: number = 30): Promise<RadioStation[]> => {
  const cacheKey = `tag_v6_${tag}_l${limit}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) return cachedData;

  try {
    // Increase internal fetch to 80 to ensure 50 valid filtered stations
    const urlParams = `limit=80&order=votes&reverse=true&hidebroken=true`;
    const data = await fetchAcrossMirrorsFast(`bytag/${tag}`, urlParams);
    
    const result = filterStations(data).slice(0, limit);
    setToCache(cacheKey, result);
    return result;
  } catch (error) {
    return [];
  }
};

export const fetchStationsByUuids = async (uuids: string[]): Promise<RadioStation[]> => {
    if (uuids.length === 0) return [];
    const cacheKey = `uuids_v6_${uuids.sort().join('_')}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) return cachedData;

    try {
        const fetchPromises = uuids.slice(0, 15).map(uuid => 
            fetchAcrossMirrorsFast(`byuuid/${uuid}`, '')
        );
        const results = await Promise.all(fetchPromises);
        const result = filterStations(results.flat());
        setToCache(cacheKey, result);
        return result;
    } catch (error) {
        return [];
    }
};
