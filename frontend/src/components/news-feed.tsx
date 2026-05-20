"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type NewsEvent } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

function getEventIcon(type: string): string {
  switch (type.toLowerCase()) {
    case "flood": return "\u{1F4A7}";  // droplet
    case "drought": return "\u{2600}";  // sun
    case "cyclone":
    case "storm": return "\u{1F32A}";  // tornado
    case "epidemic": return "\u{26A0}"; // warning
    default: return "\u{1F30D}";        // globe
  }
}

function getAlertColor(type: string, alertLevel?: string): string {
  if (alertLevel === "Red") return "#ef4444";
  if (alertLevel === "Orange") return "#f59e0b";
  switch (type.toLowerCase()) {
    case "flood": return "#3b82f6";
    case "drought": return "#f59e0b";
    case "cyclone":
    case "storm": return "#8b5cf6";
    case "epidemic": return "#ef4444";
    default: return "#06b6d4";
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export function NewsFeed() {
  const { selectedRegion } = useAppStore();

  // Fetch global news or region-specific news
  const globalNews = useQuery({
    queryKey: ["news-recent"],
    queryFn: () => api.getRecentNews(15),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !selectedRegion,
  });

  const regionNews = useQuery({
    queryKey: ["news-region", selectedRegion?.id],
    queryFn: () => api.getRegionNews(selectedRegion!.id, 10),
    staleTime: 5 * 60 * 1000,
    enabled: !!selectedRegion,
  });

  const events = selectedRegion
    ? regionNews.data?.events
    : globalNews.data?.events;
  const isLoading = selectedRegion ? regionNews.isLoading : globalNews.isLoading;
  const isError = selectedRegion ? regionNews.isError : globalNews.isError;

  return (
    <div className="h-full flex flex-col">
      <div className="panel-header">
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-accent-blue live-dot" />
          {selectedRegion ? `Events: ${selectedRegion.country}` : "Live Intelligence"}
        </span>
        <span className="text-[8px] text-accent-blue">
          {globalNews.data?.sources?.join(" + ") || "ReliefWeb + GDACS"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-2 bg-bg-tertiary rounded w-3/4 mb-1" />
                <div className="h-2 bg-bg-tertiary rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-2 text-[9px] text-text-muted">
            Unable to fetch live events. Retrying...
          </div>
        ) : events && events.length > 0 ? (
          <div className="divide-y divide-border/30">
            {events.map((event: NewsEvent) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="p-2 text-[9px] text-text-muted">
            No recent water-related events found.
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: NewsEvent }) {
  const color = getAlertColor(event.type, event.alert_level);
  const icon = getEventIcon(event.type);

  return (
    <div className="px-2 py-1.5 hover:bg-bg-tertiary/50 transition-colors group">
      <div className="flex items-start gap-1.5">
        <span
          className="shrink-0 w-0.5 self-stretch rounded-full mt-0.5"
          style={{ background: color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[8px]">{icon}</span>
            <span
              className="text-[8px] font-medium uppercase tracking-wider"
              style={{ color }}
            >
              {event.type}
            </span>
            <span className="text-[7px] text-text-muted ml-auto shrink-0">
              {formatDate(event.date)}
            </span>
          </div>
          <div className="text-[9px] text-text-secondary leading-snug line-clamp-2">
            {event.title}
          </div>
          {event.countries.length > 0 && (
            <div className="flex gap-1 mt-0.5 flex-wrap">
              {event.countries.slice(0, 3).map((c, i) => (
                <span
                  key={i}
                  className="text-[7px] px-1 py-0 rounded bg-bg-tertiary border border-border/50 text-text-muted"
                >
                  {c}
                </span>
              ))}
              {event.source && (
                <span className="text-[7px] text-text-muted ml-auto">
                  {event.source}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
