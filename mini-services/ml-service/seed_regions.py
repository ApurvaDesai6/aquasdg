import asyncio
from prisma import Prisma
import sys
import os

# add parent to path to import data module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from data import REGIONS_DATA

async def main():
    db = Prisma()
    await db.connect()
    
    print("Deleting old regions in case of conflict...")
    await db.region.delete_many()
    
    print(f"Seeding {len(REGIONS_DATA)} regions...")
    
    for r in REGIONS_DATA:
        try:
            await db.region.create(data={
                "id": r["id"],
                "name": r["name"],
                "country": r["country"],
                "countryCode": r["country"][:3].upper(), # pseudo code
                "latitude": r["coordinates"]["lat"],
                "longitude": r["coordinates"]["lng"],
                "population": r["population"],
                "riskScore": (r.get("composite_risk_score", 0) * 100) if "composite_risk_score" in r else 50.0,
                "basicWaterAccess": r["water_access"]["basic_pct"],
                "safelyManagedAccess": r["water_access"]["safely_managed_pct"],
                "waterStressIndex": r["water_stress_index"],
                "floodRiskScore": r["flood_risk_score"] * 100,
                "droughtRiskScore": r["drought_risk_score"] * 100,
                "climateVulnerability": r["climate_vulnerability"],
                "infrastructureGap": r["infrastructure_gap"]
            })
        except Exception as e:
            print(f"Error inserting {r['name']}: {e}")
            
    print("Seeding complete.")
    await db.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
