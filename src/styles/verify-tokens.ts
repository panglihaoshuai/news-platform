/**
 * Design Tokens Verification Script
 * Run with: npx tsx src/styles/verify-tokens.ts
 */

import {
  designTokens,
  darkTokens,
  lightTokens,
  amberTokens,
  themes,
  getThemeTokens,
  getHeatColor,
  getHeatLevel,
  getPriorityColor,
  isDarkTheme,
} from './designTokens';

// Mock test function for standalone execution
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.log(`  ✗ ${name}: ${error}`);
  }
}

// Mock describe function
const describe = (name: string, fn: () => void) => {
  console.log(`\n${name}`);
  fn();
};

console.log('\n🧪 Design Tokens Unit Tests\n');

// Test 1: Theme structure
console.log('Theme Structure:');
test('darkTokens has all required keys', () => {
  const required = ['bg', 'text', 'accent', 'priority', 'heat', 'mapMode', 'border', 'shadow', 'opacity'];
  required.forEach((key) => {
    if (!(key in darkTokens)) throw new Error(`Missing ${key}`);
  });
});

test('lightTokens has all required keys', () => {
  const required = ['bg', 'text', 'accent', 'priority', 'heat', 'mapMode', 'border', 'shadow', 'opacity'];
  required.forEach((key) => {
    if (!(key in lightTokens)) throw new Error(`Missing ${key}`);
  });
});

test('amberTokens has all required keys', () => {
  const required = ['bg', 'text', 'accent', 'priority', 'heat', 'mapMode', 'border', 'shadow', 'opacity'];
  required.forEach((key) => {
    if (!(key in amberTokens)) throw new Error(`Missing ${key}`);
  });
});

// Test 2: Color formats
console.log('\nColor Formats:');
test('dark theme colors are valid hex', () => {
  const hexRegex = /^#([A-Fa-f0-9]{6})$/;
  Object.values(darkTokens.bg).forEach((color: string) => {
    if (!hexRegex.test(color)) throw new Error(`Invalid: ${color}`);
  });
});

test('light theme colors are valid hex', () => {
  const hexRegex = /^#([A-Fa-f0-9]{6})$/;
  Object.values(lightTokens.bg).forEach((color: string) => {
    if (!hexRegex.test(color)) throw new Error(`Invalid: ${color}`);
  });
});

test('amber theme colors are valid hex', () => {
  const hexRegex = /^#([A-Fa-f0-9]{6})$/;
  Object.values(amberTokens.bg).forEach((color: string) => {
    if (!hexRegex.test(color)) throw new Error(`Invalid: ${color}`);
  });
});

// Test 3: getThemeTokens
console.log('\ngetThemeTokens:');
test('returns dark tokens correctly', () => {
  const tokens = getThemeTokens('dark');
  if (tokens.bg.primary !== '#0a0a0b') throw new Error('Wrong primary bg');
  if (tokens.accent.up !== '#ffb000') throw new Error('Wrong accent');
});

test('returns light tokens correctly', () => {
  const tokens = getThemeTokens('light');
  if (tokens.bg.primary !== '#ffffff') throw new Error('Wrong primary bg');
  if (tokens.accent.up !== '#0066cc') throw new Error('Wrong accent');
});

test('returns amber tokens correctly', () => {
  const tokens = getThemeTokens('amber');
  if (tokens.bg.primary !== '#fdf6e3') throw new Error('Wrong primary bg');
  if (tokens.accent.up !== '#859900') throw new Error('Wrong accent');
});

// Test 4: getHeatColor
console.log('\ngetHeatColor:');
test('returns low heat for score 10', () => {
  const color = getHeatColor(10, 'dark');
  if (color !== darkTokens.heat.low) throw new Error('Wrong color');
});

test('returns medium heat for score 35', () => {
  const color = getHeatColor(35, 'dark');
  if (color !== darkTokens.heat.medium) throw new Error('Wrong color');
});

test('returns high heat for score 60', () => {
  const color = getHeatColor(60, 'dark');
  if (color !== darkTokens.heat.high) throw new Error('Wrong color');
});

test('returns critical heat for score 85', () => {
  const color = getHeatColor(85, 'dark');
  if (color !== darkTokens.heat.critical) throw new Error('Wrong color');
});

// Test 5: getHeatLevel
console.log('\ngetHeatLevel:');
test('returns low for score 10', () => {
  if (getHeatLevel(10) !== 'low') throw new Error('Wrong level');
});

test('returns medium for score 35', () => {
  if (getHeatLevel(35) !== 'medium') throw new Error('Wrong level');
});

test('returns high for score 60', () => {
  if (getHeatLevel(60) !== 'high') throw new Error('Wrong level');
});

test('returns critical for score 85', () => {
  if (getHeatLevel(85) !== 'critical') throw new Error('Wrong level');
});

// Test 6: getPriorityColor
console.log('\ngetPriorityColor:');
test('returns P0 color correctly', () => {
  if (getPriorityColor('P0', 'dark') !== darkTokens.priority.p0) throw new Error('Wrong color');
});

test('returns P1 color correctly', () => {
  if (getPriorityColor('P1', 'dark') !== darkTokens.priority.p1) throw new Error('Wrong color');
});

test('defaults to dark theme', () => {
  if (getPriorityColor('P0') !== darkTokens.priority.p0) throw new Error('Wrong default');
});

// Test 7: isDarkTheme
console.log('\nisDarkTheme:');
test('returns true for dark', () => {
  if (!isDarkTheme('dark')) throw new Error('Should be true');
});

test('returns true for amber', () => {
  if (!isDarkTheme('amber')) throw new Error('Should be true');
});

test('returns false for light', () => {
  if (isDarkTheme('light')) throw new Error('Should be false');
});

// Test 8: Amber theme warmth
console.log('\nAmber Theme Warmth:');
test('amber bg has warm tones', () => {
  const bg = amberTokens.bg.primary;
  const r = parseInt(bg.slice(1, 3), 16);
  const g = parseInt(bg.slice(3, 5), 16);
  const b = parseInt(bg.slice(5, 7), 16);
  if (r < 240) throw new Error('Not warm enough');
  if (g < 240) throw new Error('Not warm enough');
  if (r <= b) throw new Error('Not yellowish');
});

// Test 9: Exports
console.log('\nExports:');
test('themes contains all themes', () => {
  if (!themes.dark || !themes.light || !themes.amber) throw new Error('Missing themes');
});

test('designTokens defaults to dark', () => {
  if (designTokens.bg.primary !== darkTokens.bg.primary) throw new Error('Wrong default');
});

// Test 10: Integration
console.log('\nIntegration:');
test('complete workflow works', () => {
  const userTheme: Theme = 'amber';
  const newsHeatScore = 85;
  const tokens = getThemeTokens(userTheme);
  const heatColor = getHeatColor(newsHeatScore, userTheme);
  const heatLevel = getHeatLevel(newsHeatScore);
  
  if (tokens.bg.primary !== '#fdf6e3') throw new Error('Wrong theme');
  if (heatLevel !== 'critical') throw new Error('Wrong level');
  if (heatColor !== tokens.heat.critical) throw new Error('Wrong color');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50) + '\n');

if (failed > 0) {
  console.log('❌ Tests failed!');
  process.exit(1);
} else {
  console.log('✅ All tests passed!');
  console.log('\nTheme Summary:');
  console.log('  Dark:  #0a0a0b bg + #ffb000 accent (Bloomberg Gold)');
  console.log('  Light: #ffffff bg + #0066cc accent (Professional Blue)');
  console.log('  Amber: #fdf6e3 bg + #859900 accent (Solarized Olive)');
  console.log('');
}
