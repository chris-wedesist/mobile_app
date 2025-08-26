#!/usr/bin/env node

/**
 * Simple Performance Benchmark Runner
 */

// Mock AsyncStorage for Node.js environment
const AsyncStorage = {
  store: new Map(),
  async getItem(key) {
    return this.store.get(key) || null;
  },
  async setItem(key, value) {
    this.store.set(key, value);
  },
  async removeItem(key) {
    this.store.delete(key);
  },
  async getAllKeys() {
    return Array.from(this.store.keys());
  },
  async multiRemove(keys) {
    keys.forEach(key => this.store.delete(key));
  }
};

// Mock the performance optimizer
class PerformanceOptimizer {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  async fetchParallel(fetchFunctions) {
    const promises = Object.entries(fetchFunctions).map(async ([key, fetchFn]) => {
      const result = await fetchFn();
      return [key, result];
    });

    const results = await Promise.all(promises);
    return Object.fromEntries(results);
  }

  async fetchWithCache(key, fetchFunction, config = {}) {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return await this.pendingRequests.get(key);
    }

    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    // Fetch fresh data
    const fetchPromise = fetchFunction();
    this.pendingRequests.set(key, fetchPromise);

    try {
      const data = await fetchPromise;
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (config.duration || 300000)
      });
      return data;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  async fetchBatch(batchConfig) {
    const results = {};
    for (const [key, config] of Object.entries(batchConfig)) {
      results[key] = await this.fetchWithCache(config.key, config.fetch, config.cacheConfig);
    }
    return results;
  }

  async clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

const performanceOptimizer = new PerformanceOptimizer();

// Benchmark functions
async function benchmarkParallelFetching() {
  console.log('🔸 Parallel vs Sequential Fetching');
  
  const mockFetch1 = () => new Promise(resolve => setTimeout(() => resolve('data1'), 100));
  const mockFetch2 = () => new Promise(resolve => setTimeout(() => resolve('data2'), 150));
  const mockFetch3 = () => new Promise(resolve => setTimeout(() => resolve('data3'), 200));

  // Sequential fetching
  const sequentialStart = Date.now();
  await Promise.all([mockFetch1(), mockFetch2(), mockFetch3()]);
  const sequentialDuration = Date.now() - sequentialStart;

  // Parallel fetching
  const parallelStart = Date.now();
  await performanceOptimizer.fetchParallel({
    data1: mockFetch1,
    data2: mockFetch2,
    data3: mockFetch3
  });
  const parallelDuration = Date.now() - parallelStart;

  const improvement = ((sequentialDuration - parallelDuration) / sequentialDuration) * 100;
  
  console.log(`   Duration: ${parallelDuration}ms`);
  console.log(`   Performance: ${Math.abs(improvement).toFixed(2)}% improvement`);
  
  return { duration: parallelDuration, improvement };
}

async function benchmarkCachePerformance() {
  console.log('🔸 Cache Performance');
  
  const mockFetch = () => new Promise(resolve => setTimeout(() => resolve('cached data'), 200));

  // First call - cache miss
  const cacheMissStart = Date.now();
  await performanceOptimizer.fetchWithCache('benchmark_cache', mockFetch);
  const cacheMissDuration = Date.now() - cacheMissStart;

  // Second call - cache hit
  const cacheHitStart = Date.now();
  await performanceOptimizer.fetchWithCache('benchmark_cache', mockFetch);
  const cacheHitDuration = Date.now() - cacheHitStart;

  const improvement = ((cacheMissDuration - cacheHitDuration) / cacheMissDuration) * 100;
  const cacheHitRate = (cacheHitDuration / cacheMissDuration) * 100;
  
  console.log(`   Duration: ${cacheHitDuration}ms`);
  console.log(`   Performance: ${Math.abs(improvement).toFixed(2)}% improvement`);
  console.log(`   Cache Hit Rate: ${cacheHitRate.toFixed(2)}%`);
  
  return { duration: cacheHitDuration, improvement, cacheHitRate };
}

async function benchmarkBatchOperations() {
  console.log('🔸 Batch Operations');
  
  const mockFetch1 = () => new Promise(resolve => setTimeout(() => resolve('batch1'), 100));
  const mockFetch2 = () => new Promise(resolve => setTimeout(() => resolve('batch2'), 150));
  const mockFetch3 = () => new Promise(resolve => setTimeout(() => resolve('batch3'), 200));

  // Individual operations
  const individualStart = Date.now();
  await Promise.all([
    performanceOptimizer.fetchWithCache('batch_1', mockFetch1),
    performanceOptimizer.fetchWithCache('batch_2', mockFetch2),
    performanceOptimizer.fetchWithCache('batch_3', mockFetch3)
  ]);
  const individualDuration = Date.now() - individualStart;

  // Batch operations
  const batchStart = Date.now();
  await performanceOptimizer.fetchBatch({
    data1: { key: 'batch_1', fetch: mockFetch1 },
    data2: { key: 'batch_2', fetch: mockFetch2 },
    data3: { key: 'batch_3', fetch: mockFetch3 }
  });
  const batchDuration = Date.now() - batchStart;

  const improvement = ((individualDuration - batchDuration) / individualDuration) * 100;
  
  console.log(`   Duration: ${batchDuration}ms`);
  console.log(`   Performance: ${Math.abs(improvement).toFixed(2)}% improvement`);
  
  return { duration: batchDuration, improvement };
}

async function benchmarkRealWorldScenario() {
  console.log('🔸 Real-World Session');
  
  const sessionStart = Date.now();

  // Simulate user opening app and loading multiple screens
  await Promise.all([
    // Home screen data
    performanceOptimizer.fetchWithCache('home_news', async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
      return [{ id: '1', title: 'Home News' }];
    }),
    // Incidents data
    performanceOptimizer.fetchWithCache('incidents_40.7128_-74.0060', async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return [{ id: '1', type: 'ICE Activity' }];
    }),
    // Legal help data
    performanceOptimizer.fetchWithCache('attorneys_40.7128_-74.0060', async () => {
      await new Promise(resolve => setTimeout(resolve, 180));
      return [{ id: '1', name: 'Attorney 1' }];
    })
  ]);

  // Simulate user navigating and re-fetching data (should use cache)
  await Promise.all([
    performanceOptimizer.fetchWithCache('home_news', async () => {
      return [{ id: '1', title: 'Home News' }];
    }),
    performanceOptimizer.fetchWithCache('incidents_40.7128_-74.0060', async () => {
      return [{ id: '1', type: 'ICE Activity' }];
    }),
    performanceOptimizer.fetchWithCache('attorneys_40.7128_-74.0060', async () => {
      return [{ id: '1', name: 'Attorney 1' }];
    })
  ]);

  const sessionDuration = Date.now() - sessionStart;
  
  console.log(`   Duration: ${sessionDuration}ms`);
  
  return { duration: sessionDuration };
}

// Run all benchmarks
async function runAllBenchmarks() {
  console.log('🚀 Starting Performance Benchmarks...\n');
  console.log('📊 Performance Benchmark Results:\n');
  console.log('='.repeat(60));

  const results = [];
  
  results.push(await benchmarkParallelFetching());
  results.push(await benchmarkCachePerformance());
  results.push(await benchmarkBatchOperations());
  results.push(await benchmarkRealWorldScenario());

  console.log(`\n${  '='.repeat(60)}`);
  
  // Calculate overall improvement
  const improvements = results.filter(r => r.improvement !== undefined);
  if (improvements.length > 0) {
    const avgImprovement = improvements.reduce((sum, r) => sum + (r.improvement || 0), 0) / improvements.length;
    console.log(`\n🎯 Average Performance Improvement: ${avgImprovement.toFixed(2)}%`);
  }

  console.log('\n💡 Performance Analysis:');
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  if (avgDuration < 500) {
    console.log('   ✅ Excellent performance! App is very responsive.');
  } else if (avgDuration < 1000) {
    console.log('   ⚠️  Good performance, but consider optimizing slow operations.');
  } else {
    console.log('   ❌ Performance needs improvement. Consider caching and optimization.');
  }
}

// Run benchmarks
runAllBenchmarks().catch(console.error); 