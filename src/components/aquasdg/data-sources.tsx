'use client';

import { ExternalLink } from 'lucide-react';

const SOURCES = [
  { name: 'World Bank Open Data', url: 'https://data.worldbank.org' },
  { name: 'UN SDG Indicators', url: 'https://unstats.un.org/sdgs' },
  { name: 'WRI Aqueduct 4.0', url: 'https://www.wri.org/aqueduct' },
  { name: 'INFORM Risk Index', url: 'https://drmkc.jrc.ec.europa.eu/inform-index' },
];

export function DataSources() {
  return (
    <div className="space-y-1.5">
      {SOURCES.map(s => (
        <a
          key={s.name}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <span>{s.name}</span>
          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
        </a>
      ))}
    </div>
  );
}
