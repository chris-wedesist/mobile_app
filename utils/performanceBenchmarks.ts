import { performanceOptimizer } from './performanceOptimizer';

interface BenchmarkResult {
  name: string;
  duration: number;
  improvement?: number;
  cacheHitRate?: number;
  memoryUsage?: number;
}

class PerformanceBenchmarks {
  private results: BenchmarkResult[] = [];

  /**
   * Benchmark parallel vs sequential fetching
   */
  async benchmarkParallelFetching(): Promise<BenchmarkResult> {
    const mockFetch1 = () =>
      new Promise((resolve) => setTimeout(() => resolve('data1'), 100));
    const mockFetch2 = () =>
      new Promise((resolve) => setTimeout(() => resolve('data2'), 150));
    const mockFetch3 = () =>
      new Promise((resolve) => setTimeout(() => resolve('data3'), 200));

    // Sequential fetching
    const sequentialStart = Date.now();
    const sequentialResults = await Promise.all([
      mockFetch1(),
      mockFetch2(),
      mockFetch3(),
    ]);
    const sequentialDuration = Date.now() - sequentialStart;

    // Parallel fetching using Promise.all
    const parallelStart = Date.now();
    const parallelResults = await Promise.all([
      performanceOptimizer.fetchWithCache('data1', mockFetch1, {
        key: 'data1',
        duration: 300000,
      }),
      performanceOptimizer.fetchWithCache('data2', mockFetch2, {
        key: 'data2',
        duration: 300000,
      }),
      performanceOptimizer.fetchWithCache('data3', mockFetch3, {
        key: 'data3',
        duration: 300000,
      }),
    ]);
    const parallelDuration = Date.now() - parallelStart;

    const improvement =
      ((sequentialDuration - parallelDuration) / sequentialDuration) * 100;

    const result: BenchmarkResult = {
      name: 'Parallel vs Sequential Fetching',
      duration: parallelDuration,
      improvement,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Benchmark cache performance
   */
  async benchmarkCachePerformance(): Promise<BenchmarkResult> {
    const mockFetch = () =>
      new Promise((resolve) => setTimeout(() => resolve('cached data'), 200));

    // First call - cache miss
    const cacheMissStart = Date.now();
    await performanceOptimizer.fetchWithCache('benchmark_cache', mockFetch, {
      key: 'benchmark_cache',
      duration: 300000,
    });
    const cacheMissDuration = Date.now() - cacheMissStart;

    // Second call - cache hit
    const cacheHitStart = Date.now();
    await performanceOptimizer.fetchWithCache('benchmark_cache', mockFetch, {
      key: 'benchmark_cache',
      duration: 300000,
    });
    const cacheHitDuration = Date.now() - cacheHitStart;

    const improvement =
      ((cacheMissDuration - cacheHitDuration) / cacheMissDuration) * 100;
    const cacheHitRate = (cacheHitDuration / cacheMissDuration) * 100;

    const result: BenchmarkResult = {
      name: 'Cache Performance',
      duration: cacheHitDuration,
      improvement,
      cacheHitRate,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Benchmark batch operations
   */
  async benchmarkBatchOperations(): Promise<BenchmarkResult> {
    const mockFetch1 = () =>
      new Promise((resolve) => setTimeout(() => resolve('batch1'), 100));
    const mockFetch2 = () =>
      new Promise((resolve) => setTimeout(() => resolve('batch2'), 150));
    const mockFetch3 = () =>
      new Promise((resolve) => setTimeout(() => resolve('batch3'), 200));

    // Individual operations
    const individualStart = Date.now();
    const individualResults = await Promise.all([
      performanceOptimizer.fetchWithCache('batch_1', mockFetch1, {
        key: 'batch_1',
        duration: 300000,
      }),
      performanceOptimizer.fetchWithCache('batch_2', mockFetch2, {
        key: 'batch_2',
        duration: 300000,
      }),
      performanceOptimizer.fetchWithCache('batch_3', mockFetch3, {
        key: 'batch_3',
        duration: 300000,
      }),
    ]);
    const individualDuration = Date.now() - individualStart;

    // Batch operations (simulated with Promise.all)
    const batchStart = Date.now();
    const batchResults = await Promise.all([
      performanceOptimizer.fetchWithCache('batch_1', mockFetch1, {
        key: 'batch_1',
        duration: 300000,
      }),
      performanceOptimizer.fetchWithCache('batch_2', mockFetch2, {
        key: 'batch_2',
        duration: 300000,
      }),
      performanceOptimizer.fetchWithCache('batch_3', mockFetch3, {
        key: 'batch_3',
        duration: 300000,
      }),
    ]);
    const batchDuration = Date.now() - batchStart;

    const improvement =
      ((individualDuration - batchDuration) / individualDuration) * 100;

    const result: BenchmarkResult = {
      name: 'Batch Operations',
      duration: batchDuration,
      improvement,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Benchmark memory usage
   */
  async benchmarkMemoryUsage(): Promise<BenchmarkResult> {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    // Perform multiple cache operations
    for (let i = 0; i < 100; i++) {
      await performanceOptimizer.fetchWithCache(
        `memory_test_${i}`,
        async () => {
          return { data: `test data ${i}`, timestamp: Date.now() };
        },
        { key: `memory_test_${i}`, duration: 300000 }
      );
    }

    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryUsage = finalMemory - initialMemory;

    const result: BenchmarkResult = {
      name: 'Memory Usage',
      duration: 0,
      memoryUsage,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Benchmark real-world scenario simulation
   */
  async benchmarkRealWorldScenario(): Promise<BenchmarkResult> {
    // Simulate a typical app session with multiple data fetches
    const sessionStart = Date.now();

    // Simulate user opening app and loading multiple screens
    await Promise.all([
      // Home screen data
      performanceOptimizer.fetchWithCache(
        'home_news',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 150));
          return [{ id: '1', title: 'Home News' }];
        },
        { key: 'home_news', duration: 300000 }
      ),
      // Incidents data
      performanceOptimizer.fetchWithCache(
        'incidents_40.7128_-74.0060',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return [{ id: '1', type: 'ICE Activity' }];
        },
        { key: 'incidents_40.7128_-74.0060', duration: 300000 }
      ),
      // Legal help data
      performanceOptimizer.fetchWithCache(
        'attorneys_40.7128_-74.0060',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 180));
          return [{ id: '1', name: 'Attorney 1' }];
        },
        { key: 'attorneys_40.7128_-74.0060', duration: 300000 }
      ),
    ]);

    // Simulate user navigating and re-fetching data (should use cache)
    // Simulate user navigating and re-fetching data (should use cache)
    await Promise.all([
      performanceOptimizer.fetchWithCache(
        'home_news',
        async () => {
          return [{ id: '1', title: 'Home News' }];
        },
        { key: 'home_news', duration: 300000 }
      ),
      performanceOptimizer.fetchWithCache(
        'incidents_40.7128_-74.0060',
        async () => {
          return [{ id: '1', type: 'ICE Activity' }];
        },
        { key: 'incidents_40.7128_-74.0060', duration: 300000 }
      ),
      performanceOptimizer.fetchWithCache(
        'attorneys_40.7128_-74.0060',
        async () => {
          return [{ id: '1', name: 'Attorney 1' }];
        },
        { key: 'attorneys_40.7128_-74.0060', duration: 300000 }
      ),
    ]);

    const sessionDuration = Date.now() - sessionStart;

    const result: BenchmarkResult = {
      name: 'Real-World Session',
      duration: sessionDuration,
    };

    this.results.push(result);
    return result;
  }

  /**
   * Run all benchmarks
   */
  async runAllBenchmarks(): Promise<BenchmarkResult[]> {
    console.log('🚀 Starting Performance Benchmarks...\n');

    await this.benchmarkParallelFetching();
    await this.benchmarkCachePerformance();
    await this.benchmarkBatchOperations();
    await this.benchmarkMemoryUsage();
    await this.benchmarkRealWorldScenario();

    this.printResults();
    return this.results;
  }

  /**
   * Print benchmark results
   */
  private printResults(): void {
    console.log('\n📊 Performance Benchmark Results:\n');
    console.log('='.repeat(60));

    this.results.forEach((result) => {
      console.log(`\n🔸 ${result.name}`);
      console.log(`   Duration: ${result.duration}ms`);

      if (result.improvement !== undefined) {
        const improvementText =
          result.improvement > 0 ? 'improvement' : 'degradation';
        console.log(
          `   Performance: ${Math.abs(result.improvement).toFixed(
            2
          )}% ${improvementText}`
        );
      }

      if (result.cacheHitRate !== undefined) {
        console.log(`   Cache Hit Rate: ${result.cacheHitRate.toFixed(2)}%`);
      }

      if (result.memoryUsage !== undefined) {
        console.log(
          `   Memory Usage: ${(result.memoryUsage / 1024).toFixed(2)} KB`
        );
      }
    });

    console.log(`\n${  '='.repeat(60)}`);

    // Calculate overall improvement
    const improvements = this.results.filter(
      (r) => r.improvement !== undefined
    );
    if (improvements.length > 0) {
      const avgImprovement =
        improvements.reduce((sum, r) => sum + (r.improvement || 0), 0) /
        improvements.length;
      console.log(
        `\n🎯 Average Performance Improvement: ${avgImprovement.toFixed(2)}%`
      );
    }
  }

  /**
   * Get benchmark results
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }

  /**
   * Clear results
   */
  clearResults(): void {
    this.results = [];
  }
}

// Export singleton instance
export const performanceBenchmarks = new PerformanceBenchmarks();

// Export types
export type { BenchmarkResult };
