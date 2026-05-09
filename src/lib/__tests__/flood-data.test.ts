// src/lib/__tests__/flood-data.test.ts
import { getFloodEvents, getRecentFloods, getFloodRiskProfile } from '../flood-data';

async function main() {
  console.log('=== Testing getFloodEvents("Kenya") ===');
  const events = await getFloodEvents('Kenya');
  console.log(`Got ${events.length} flood events for Kenya`);
  if (events.length === 0) throw new Error('Expected flood events for Kenya');

  const first = events[0];
  console.log('First event:', JSON.stringify(first, null, 2));

  // Verify interface shape
  const requiredKeys: (keyof typeof first)[] = ['id', 'date', 'country', 'severity', 'affectedPeople', 'description', 'source', 'sourceUrl'];
  for (const key of requiredKeys) {
    if (!(key in first)) throw new Error(`Missing key: ${key}`);
  }
  if (!['minor', 'moderate', 'major', 'catastrophic'].includes(first.severity)) {
    throw new Error(`Invalid severity: ${first.severity}`);
  }
  console.log('✓ Interface shape valid\n');

  console.log('=== Testing getRecentFloods() ===');
  const recent = await getRecentFloods(5);
  console.log(`Got ${recent.length} recent floods`);
  if (recent.length === 0) throw new Error('Expected recent floods');
  console.log('✓ Recent floods returned\n');

  console.log('=== Testing getFloodRiskProfile("nairobi", "Kenya") ===');
  const profile = await getFloodRiskProfile('nairobi', 'Kenya');
  console.log(`Profile: avgEventsPerYear=${profile.avgEventsPerYear}, avgAffected=${profile.avgAffectedPerEvent}, frequencyScore=${profile.floodFrequencyScore}`);
  if (profile.avgEventsPerYear <= 0) throw new Error('Expected positive avgEventsPerYear');
  if (profile.floodFrequencyScore < 0 || profile.floodFrequencyScore > 1) throw new Error('Score out of range');
  console.log('✓ Risk profile valid\n');

  console.log('ALL TESTS PASSED ✓');
}

main().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
