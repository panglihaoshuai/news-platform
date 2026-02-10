/**
 * Single Source Test Script
 * Tests each of the 24 GDELT sources to verify they return data
 * 
 * Usage: npx tsx scripts/test-24-sources.ts
 */

import { 
  GDELT_SOURCES, 
  buildGdeltQueryUrl, 
  GDELT_CONFIG 
} from '../src/config/gdelt-sources';

interface TestResult {
  sourceId: string;
  sourceName: string;
  domain: string;
  region: string;
  status: 'success' | 'error' | 'no-data';
  articleCount: number;
  errorMessage?: string;
  responseTime: number;
}

async function testSingleSource(
  source: typeof GDELT_SOURCES[0]
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const queryUrl = buildGdeltQueryUrl({
      query: `domain:${source.config.domain}`,
      mode: 'artlist',
      format: 'json',
      maxRecords: 10,
      timespan: '24h',
      sortByDate: true,
    });

    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(GDELT_CONFIG.timeoutMs),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        sourceId: source.id,
        sourceName: source.name,
        domain: source.config.domain || 'unknown',
        region: source.region || 'GLOBAL',
        status: 'error',
        articleCount: 0,
        errorMessage: `HTTP ${response.status}: ${response.statusText}`,
        responseTime,
      };
    }

    const data = await response.json() as { articles?: unknown[] };
    const articleCount = data.articles?.length || 0;

    return {
      sourceId: source.id,
      sourceName: source.name,
      domain: source.config.domain || 'unknown',
      region: source.region || 'GLOBAL',
      status: articleCount > 0 ? 'success' : 'no-data',
      articleCount,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      sourceId: source.id,
      sourceName: source.name,
      domain: source.config.domain || 'unknown',
      region: source.region || 'GLOBAL',
      status: 'error',
      articleCount: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    };
  }
}

async function runAllTests(): Promise<void> {
  console.log('🧪 Testing 24 GDELT Sources\n');
  console.log('=' .repeat(80));
  
  const results: TestResult[] = [];
  
  // Test sources in batches to avoid rate limiting
  const batchSize = 5;
  
  for (let i = 0; i < GDELT_SOURCES.length; i += batchSize) {
    const batch = GDELT_SOURCES.slice(i, i + batchSize);
    console.log(`\n📦 Testing batch ${Math.floor(i / batchSize) + 1} (sources ${i + 1}-${Math.min(i + batchSize, GDELT_SOURCES.length)})`);
    
    const batchResults = await Promise.all(
      batch.map(source => testSingleSource(source))
    );
    
    results.push(...batchResults);
    
    // Wait between batches
    if (i + batchSize < GDELT_SOURCES.length) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST RESULTS\n');
  
  let successCount = 0;
  let noDataCount = 0;
  let errorCount = 0;
  
  const byRegion: Record<string, { success: number; total: number }> = {};
  
  for (const result of results) {
    // Region summary
    if (!byRegion[result.region]) {
      byRegion[result.region] = { success: 0, total: 0 };
    }
    byRegion[result.region].total++;
    
    // Status count
    if (result.status === 'success') {
      successCount++;
      byRegion[result.region].success++;
    } else if (result.status === 'no-data') {
      noDataCount++;
    } else {
      errorCount++;
    }
    
    // Print result
    const icon = result.status === 'success' ? '✅' : result.status === 'no-data' ? '⚠️' : '❌';
    const countStr = result.status === 'success' ? `[${result.articleCount} articles]` : '';
    const timeStr = `${result.responseTime}ms`;
    
    console.log(`${icon} ${result.sourceName.padEnd(22)} | ${result.domain.padEnd(25)} | ${result.region.padEnd(3)} | ${countStr.padEnd(14)} | ${timeStr}`);
    
    if (result.errorMessage) {
      console.log(`   └─ Error: ${result.errorMessage}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📈 SUMMARY\n');
  
  console.log('Overall:');
  console.log(`  ✅ Success: ${successCount}/${results.length}`);
  console.log(`  ⚠️  No Data: ${noDataCount}/${results.length}`);
  console.log(`  ❌ Errors:  ${errorCount}/${results.length}`);
  
  console.log('\nBy Region:');
  for (const [region, stats] of Object.entries(byRegion)) {
    const pct = Math.round((stats.success / stats.total) * 100);
    const icon = pct >= 75 ? '✅' : pct >= 50 ? '⚠️' : '❌';
    console.log(`  ${icon} ${region.padEnd(3)}: ${stats.success}/${stats.total} (${pct}%)`);
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Exit with error code if any errors
  if (errorCount > 0) {
    console.log('\n❌ Some sources failed. Please review errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All sources tested successfully!');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
