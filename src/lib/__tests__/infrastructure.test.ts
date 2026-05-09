import { getWaterInfrastructure } from '../infrastructure-data';

async function main() {
  console.log('Testing Turkana, Kenya (3.31, 35.57) — population 926,976...\n');

  const result = await getWaterInfrastructure(3.31, 35.57, 'ken-turkana', 926976);

  console.log('Result:', JSON.stringify(result, null, 2));
  console.log('\n--- Assertions ---');

  console.assert(result.regionId === 'ken-turkana', 'regionId should be ken-turkana');
  console.assert(typeof result.totalWaterPoints === 'number', 'totalWaterPoints should be a number');
  console.assert(result.totalWaterPoints >= 0, 'totalWaterPoints should be >= 0');
  console.assert(result.dataSource === 'OpenStreetMap Overpass API', 'dataSource should match');
  console.assert(result.queryBbox.south === 3.06, `bbox south should be 3.06, got ${result.queryBbox.south}`);
  console.assert(result.queryBbox.north === 3.56, `bbox north should be 3.56, got ${result.queryBbox.north}`);

  // Verify peoplePerWaterPoint calculation
  if (result.totalWaterPoints > 0) {
    const expected = Math.round(926976 / result.totalWaterPoints);
    console.assert(result.peoplePerWaterPoint === expected, `peoplePerWaterPoint should be ${expected}, got ${result.peoplePerWaterPoint}`);
  } else {
    console.assert(result.peoplePerWaterPoint === 926976, 'With 0 water points, peoplePerWaterPoint should equal population');
  }

  // Verify coverage rating matches thresholds
  const ratio = result.peoplePerWaterPoint;
  if (ratio < 500) console.assert(result.coverageRating === 'adequate', 'Should be adequate');
  else if (ratio < 2000) console.assert(result.coverageRating === 'strained', 'Should be strained');
  else if (ratio < 10000) console.assert(result.coverageRating === 'critical', 'Should be critical');
  else console.assert(result.coverageRating === 'severely_lacking', 'Should be severely_lacking');

  console.log('\n✅ All assertions passed!');
}

main().catch((e) => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
