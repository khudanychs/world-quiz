export class MapDataService {
  private static worker: Worker | null = null;
  private static reqId = 0;
  private static callbacks = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private static marineCache: any = null;
  private static landGeoCache: any = null;

  static init() {
    if (!this.worker && typeof window !== 'undefined') {
      this.worker = new Worker(new URL('./mapWorker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e) => {
        const { id, result, error } = e.data;
        const cb = this.callbacks.get(id);
        if (cb) {
          this.callbacks.delete(id);
          if (error) cb.reject(new Error(error));
          else cb.resolve(result);
        }
      };
    }
  }

  static async loadBaseMapData(needsDetailedLandMask: boolean, needsMarine: boolean): Promise<{ landGeoRaw: any, marineData: any }> {
    this.init();
    
    // Serve from cache instantly if we already have it
    if ((!needsDetailedLandMask || this.landGeoCache) && (!needsMarine || this.marineCache)) {
      return { landGeoRaw: this.landGeoCache, marineData: this.marineCache };
    }

    return new Promise((resolve, reject) => {
      const id = ++this.reqId;
      this.callbacks.set(id, { resolve: (val) => {
         if (val.landGeoRaw) this.landGeoCache = val.landGeoRaw;
         if (val.marineData) this.marineCache = val.marineData;
         resolve(val);
      }, reject });
      this.worker!.postMessage({ id, type: 'EXTRACT_LAND_AND_MARINE', params: { needsDetailedLandMask, needsMarine } });
    });
  }
}
