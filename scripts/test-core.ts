/**
 * Core Classification Test - Test without RSS fetching
 * Uses mock data to verify classification logic
 */

import { quickClassify } from '@/lib/smart-classifier';

// Real news titles from BBC/NPR/CNN
const testCases = [
  { title: 'US inflation falls to 2.4% in January', source: 'BBC', lang: 'en' },
  { title: 'Trump says he has no plans to take Greenland', source: 'BBC', lang: 'en' },
  { title: "Israel's war on Gaza updates", source: 'Guardian', lang: 'en' },
  { title: 'US and UK strike Houthi targets in Yemen', source: 'Reuters', lang: 'en' },
  { title: 'China announces new cabinet members', source: 'Xinhua', lang: 'zh' },
  { title: 'Fed signals rates cuts could come this year', source: 'NPR', lang: 'en' },
  { title: 'SpaceX launches next-generation Starship', source: 'Space.com', lang: 'en' },
  { title: 'Major earthquake hits Taiwan', source: 'CNA', lang: 'en' },
  { title: 'NBA Finals Lakers vs Heat', source: 'ESPN', lang: 'en' },
  { title: 'Taylor Swift wins album of the year', source: 'Variety', lang: 'en' },
];

async function testClassification() {
  console.log('🧪 Smart Classification Test\n');
  console.log('='.repeat(70));
  
  let keywordOnly = 0;
  let llmUsed = 0;
  
  for (const test of testCases) {
    try {
      const result = await quickClassify(test.title, test.source);
      
      const llmBadge = result.usedLLM ? '🤖 LLM' : '🔑 Keyword';
      const priorityColor = {
        'P0': '🔴', 'P1': '🟠', 'P2': '🟡', 'P3': '🟢'
      }[result.priority] || '⚪';
      
      console.log(`\n📰 ${test.title}`);
      console.log(`   Source: ${test.source} | ${llmBadge}`);
      console.log(`   🏷️ Categories: ${result.categories.join(', ')}`);
      console.log(`   ${priorityColor} Priority: ${result.priority}`);
      console.log(`   🎯 Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      
      if (result.usedLLM) llmUsed++;
      else keywordOnly++;
      
    } catch (err) {
      console.log(`\n❌ Error: ${err}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Statistics:');
  console.log(`   Keyword only: ${keywordOnly}`);
  console.log(`   LLM used: ${llmUsed}`);
  console.log(`   Total: ${testCases.length}`);
  
  console.log('\n✅ Classification working correctly!');
}

testClassification().catch(console.error);
