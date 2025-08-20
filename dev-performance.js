import { InteractionManager } from 'react-native';

let startTime = Date.now();
const timings = {};

export const DevPerformance = {
  startMeasure: (label) => {
    if (__DEV__) {
      timings[label] = { start: Date.now() };
      console.log(`[DevPerf] Started: ${label}`);
    }
  },
  
  endMeasure: (label) => {
    if (__DEV__ && timings[label]) {
      const end = Date.now();
      timings[label].end = end;
      timings[label].duration = end - timings[label].start;
      console.log(`[DevPerf] ${label}: ${timings[label].duration}ms`);
    }
  },
  
  logAppStartup: () => {
    if (__DEV__) {
      const loadTime = Date.now() - startTime;
      console.log(`[DevPerf] App Startup: ${loadTime}ms`);
      
      // Log after interactions are complete
      InteractionManager.runAfterInteractions(() => {
        const totalTime = Date.now() - startTime;
        console.log(`[DevPerf] App Ready: ${totalTime}ms`);
      });
    }
  },
  
  resetStartTime: () => {
    startTime = Date.now();
  },
  
  getReport: () => {
    return Object.entries(timings).map(([key, value]) => ({
      label: key,
      duration: value.duration || 'incomplete',
    }));
  }
};
