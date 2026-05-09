import { getPrecipitationTrend, getSatelliteWaterData } from '../google-earth-engine';

async function main() {
  console.log('Testing getPrecipitationTrend for Turkana, Kenya...');
  const precip = await getPrecipitationTrend(3.31, 35.57, 'turkana-kenya');

  console.log('Result:', JSON.stringify(precip, null, 2));

  // Verify interface fields
  const required = ['regionId', 'annualPrecipitationMm', 'trend10yr', 'droughtMonths', 'wetMonths', 'dataSource'];
  for (const key of required) {
    if (!(key in precip)) throw new Error(`Missing field: ${key}`);
  }
  if (precip.annualPrecipitationMm <= 0) throw new Error('Expected positive precipitation');
  if (precip.regionId !== 'turkana-kenya') throw new Error('Wrong regionId');

  console.log('\n✅ Precipitation test PASSED\n');

  console.log('Testing getSatelliteWaterData for Turkana, Kenya...');
  const water = await getSatelliteWaterData(3.31, 35.57, 'turkana-kenya');
  console.log('Result:', JSON.stringify(water, null, 2));

  const waterFields = ['regionId', 'surfaceWaterExtentKm2', 'permanentWaterKm2', 'seasonalWaterKm2', 'waterLossKm2', 'waterGainKm2', 'dataSource', 'timestamp'];
  for (const key of waterFields) {
    if (!(key in water)) throw new Error(`Missing field: ${key}`);
  }

  console.log('\n✅ Water data test PASSED');
  console.log('\n✅ All tests PASSED');
}

main().catch(e => { console.error('❌ TEST FAILED:', e); process.exit(1); });
