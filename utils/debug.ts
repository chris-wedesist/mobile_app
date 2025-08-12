const DEBUG_ENABLED = process.env.NODE_ENV !== 'production';

export const debug = (area: string, message: string, data?: any) => {
  if (!DEBUG_ENABLED) return;
  
  console.log(`[DEBUG:${area}]`, message);
  if (data !== undefined) {
    console.log(JSON.stringify(data, null, 2));
  }
}; 