import { strict as assert } from 'node:assert';
import { isMilitaryNews, sortMilitaryFirst } from '../src/lib/military/news-filter';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.log(`  ✗ ${name}`);
    throw error;
  }
}

console.log('\n=== Military News Filter Tests ===\n');

test('detects military keyword in title', () => {
  assert.equal(isMilitaryNews({ title: 'US Air Force expands bomber deployment' }), true);
});

test('ignores non military title', () => {
  assert.equal(isMilitaryNews({ title: 'Global tech market closes higher' }), false);
});

test('sorts military first then importance', () => {
  const now = new Date().toISOString();
  const list = [
    { id: 'n1', title: 'Economic policy update', importance_score: 99, published_at: now },
    { id: 'n2', title: 'US Navy carrier movement in Pacific', importance_score: 50, published_at: now },
  ] as any[];
  const out = sortMilitaryFirst(list as any);
  assert.equal(out[0].id, 'n2');
});

console.log('\nAll military news filter tests passed! ✓');
