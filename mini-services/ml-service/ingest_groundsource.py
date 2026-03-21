import os
import pandas as pd
from prisma import Prisma
import asyncio
from shapely import wkb
from shapely.geometry import Point

# Load the dataset
print("Loading parquet...")
df = pd.read_parquet('groundsource_2026.parquet')
print(f"Loaded {len(df)} records")

# Sample it so it doesn't take forever, or just take the top 10000
df_sample = df.head(5000)

async def main():
    db = Prisma()
    await db.connect()
    
    print("Fetching regions from DB...")
    regions = await db.region.find_many()
    print(f"Found {len(regions)} regions in DB")
    
    if len(regions) == 0:
        print("No regions in DB... please run db push and seed first.")
        return

    # To map efficiently, create points for regions
    region_points = []
    for r in regions:
        region_points.append({
            'id': r.id,
            'point': Point(r.longitude, r.latitude),
            'name': r.name
        })

    events_to_create = []
    
    print("Processing geometries...")
    for idx, row in df_sample.iterrows():
        try:
            # Parse WKB geometry
            geom = wkb.loads(row['geometry'])
            
            # Simple spatial join: find the closest region to the centroid of the flood
            centroid = geom.centroid
            
            closest_region = None
            min_dist = float('inf')
            
            for rp in region_points:
                dist = centroid.distance(rp['point'])
                if dist < min_dist:
                    min_dist = dist
                    closest_region = rp['id']
                    
            if closest_region and min_dist < 5.0: # arbitrary distance threshold (degrees)
                events_to_create.append({
                    "regionId": closest_region,
                    "eventDate": pd.to_datetime(row['start_date']).isoformat() + "Z",
                    "severity": min(row['area_km2'] / 1000.0, 1.0), # normalize severity
                    "affectedAreaKm2": float(row['area_km2']),
                    "dataSource": "groundsource"
                })
        except Exception as e:
            continue
            
    print(f"Mapped {len(events_to_create)} events to regions.")
    
    # Batch create
    print("Inserting into database...")
    created = 0
    for evt in events_to_create:
        try:
            await db.floodevent.create(data=evt)
            created += 1
        except Exception as e:
            pass
            
    print(f"Successfully inserted {created} flood events!")
    
    await db.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
