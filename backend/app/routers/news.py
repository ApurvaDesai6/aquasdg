"""
News/Events router - fetches REAL water-related disaster and event data
from free public APIs:
- ReliefWeb API (OCHA) - disasters, floods, droughts
- GDACS (Global Disaster Alert and Coordination System) - RSS/API
"""

import asyncio
from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException
import httpx
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

from ..services.regions import get_region_by_id, REGIONS_DEFINITION

router = APIRouter(prefix="/api/news", tags=["news"])


async def fetch_reliefweb_disasters(
    country_iso3: Optional[str] = None,
    disaster_types: Optional[List[str]] = None,
    limit: int = 20,
) -> List[Dict]:
    """
    Fetch real disaster events from ReliefWeb OCHA API.
    Filters for water-related disasters: Flood, Drought, Epidemic, Storm.
    """
    url = "https://api.reliefweb.int/v1/disasters"

    if disaster_types is None:
        disaster_types = ["Flood", "Drought", "Epidemic", "Storm", "Cold Wave"]

    # Build filter payload
    filter_conditions = []
    filter_conditions.append({
        "field": "type.name",
        "value": disaster_types,
        "operator": "OR",
    })

    if country_iso3:
        filter_conditions.append({
            "field": "country.iso3",
            "value": [country_iso3],
        })

    # Only get events from the last 2 years
    two_years_ago = (datetime.utcnow() - timedelta(days=730)).strftime("%Y-%m-%dT00:00:00+00:00")
    filter_conditions.append({
        "field": "date.created",
        "value": {"from": two_years_ago},
    })

    payload = {
        "appname": "aquasdg-intelligence-v3",
        "fields": {
            "include": [
                "name", "date", "country", "type", "status",
                "description", "url",
            ]
        },
        "filter": {
            "operator": "AND",
            "conditions": filter_conditions,
        },
        "sort": ["date.created:desc"],
        "limit": limit,
    }

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                return []
            data = resp.json()
            events = []
            for item in data.get("data", []):
                fields = item.get("fields", {})
                types = fields.get("type", [])
                countries = fields.get("country", [])
                date_info = fields.get("date", {})
                description = fields.get("description", "")

                # Truncate description
                if description and len(description) > 200:
                    description = description[:197] + "..."

                events.append({
                    "id": str(item.get("id", "")),
                    "title": fields.get("name", "Unknown Event"),
                    "date": date_info.get("created", ""),
                    "type": types[0].get("name", "Unknown") if types else "Unknown",
                    "countries": [c.get("name", "") for c in countries],
                    "country_codes": [c.get("iso3", "") for c in countries],
                    "status": fields.get("status", ""),
                    "description": description,
                    "source": "ReliefWeb",
                    "url": fields.get("url", ""),
                })
            return events
        except Exception:
            return []


async def fetch_gdacs_events() -> List[Dict]:
    """
    Fetch recent disaster alerts from GDACS RSS feed.
    GDACS provides real-time alerts for earthquakes, floods, cyclones, droughts.
    """
    url = "https://www.gdacs.org/xml/rss.xml"

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(url)
            if resp.status_code != 200:
                return []

            root = ET.fromstring(resp.text)
            events = []

            # GDACS RSS uses standard RSS format with gdacs namespace
            ns = {
                "gdacs": "http://www.gdacs.org",
                "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
            }

            for item in root.findall(".//item"):
                title_el = item.find("title")
                desc_el = item.find("description")
                link_el = item.find("link")
                pub_date_el = item.find("pubDate")
                event_type_el = item.find("gdacs:eventtype", ns)
                alert_level_el = item.find("gdacs:alertlevel", ns)
                country_el = item.find("gdacs:country", ns)
                lat_el = item.find("geo:lat", ns)
                lon_el = item.find("geo:long", ns)

                title = title_el.text if title_el is not None else "Unknown"
                if title is None:
                    title = "Unknown"

                # Filter for water-related events
                event_type = event_type_el.text if event_type_el is not None else ""
                if event_type is None:
                    event_type = ""
                water_types = ["FL", "TC", "DR"]  # Flood, Tropical Cyclone, Drought
                if event_type and event_type not in water_types:
                    continue

                type_map = {"FL": "Flood", "TC": "Cyclone", "DR": "Drought", "EQ": "Earthquake"}

                description = desc_el.text if desc_el is not None else ""
                if description is None:
                    description = ""
                if len(description) > 200:
                    description = description[:197] + "..."

                alert_level = alert_level_el.text if alert_level_el is not None else "Green"
                if alert_level is None:
                    alert_level = "Green"
                country = country_el.text if country_el is not None else ""
                if country is None:
                    country = ""

                lat = None
                lon = None
                try:
                    if lat_el is not None and lat_el.text:
                        lat = float(lat_el.text)
                    if lon_el is not None and lon_el.text:
                        lon = float(lon_el.text)
                except (ValueError, TypeError):
                    pass

                event = {
                    "id": f"gdacs-{hash(title) % 100000}",
                    "title": title,
                    "date": pub_date_el.text if pub_date_el is not None else "",
                    "type": type_map.get(event_type, event_type),
                    "alert_level": alert_level,
                    "countries": [country] if country else [],
                    "country_codes": [],
                    "description": description,
                    "source": "GDACS",
                    "url": link_el.text if link_el is not None else "",
                    "latitude": lat,
                    "longitude": lon,
                }
                events.append(event)

            return events[:15]
        except Exception:
            return []


@router.get("/recent")
async def get_recent_news(limit: int = 25):
    """
    Get recent water-related disaster news globally from multiple sources.
    Combines ReliefWeb disasters + GDACS alerts.
    """
    # Fetch from both sources in parallel
    reliefweb_events, gdacs_events = await asyncio.gather(
        fetch_reliefweb_disasters(limit=limit),
        fetch_gdacs_events(),
    )

    all_events = reliefweb_events + gdacs_events

    # Sort by date (newest first)
    def parse_date(event: Dict) -> str:
        return event.get("date", "") or ""

    all_events.sort(key=parse_date, reverse=True)

    return {
        "count": len(all_events),
        "events": all_events[:limit],
        "sources": ["ReliefWeb (OCHA)", "GDACS"],
        "fetched_at": datetime.utcnow().isoformat(),
    }


@router.get("/region/{region_id}")
async def get_region_news(region_id: str, limit: int = 10):
    """
    Get news/events for a specific region by fetching from ReliefWeb
    filtered by the region's country ISO3 code.
    """
    region = await get_region_by_id(region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")

    # Find the ISO3 code for this region
    iso3 = None
    for rdef in REGIONS_DEFINITION:
        if rdef["id"] == region_id:
            iso3 = rdef["iso3"]
            break

    if not iso3:
        raise HTTPException(status_code=404, detail="Region country mapping not found")

    events = await fetch_reliefweb_disasters(
        country_iso3=iso3,
        limit=limit,
    )

    return {
        "region_id": region_id,
        "region_name": region.name,
        "country": region.country,
        "count": len(events),
        "events": events,
        "source": "ReliefWeb (OCHA)",
        "fetched_at": datetime.utcnow().isoformat(),
    }
