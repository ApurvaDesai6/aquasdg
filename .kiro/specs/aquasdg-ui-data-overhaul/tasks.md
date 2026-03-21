# Implementation Plan: AquaSDG UI & Data Overhaul

## Overview

This plan implements the AquaSDG UI and data overhaul in incremental steps, starting with GitHub publishing, then backend data pipeline changes, followed by frontend UI fixes and feature additions. Each step builds on the previous one, ensuring no orphaned code.

## Tasks

- [-] 1. Publish current codebase to GitHub as v1
  - Initialize git repo if needed, create comprehensive .gitignore (exclude node_modules, .next, __pycache__, .env, service-account.json, *.parquet, prisma/dev.db)
  - Create README.md with project description, architecture overview, and setup instructions
  - Commit all files, create v1.0.0 tag, push to ApurvaDesai6/aquasdg
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Enhance Zustand store with indicator state and caching
  - [~] 2.1 Add activeIndicator, dataCache, serviceStatus, dataSources fields to `src/lib/aquasdg-store.ts`
    - Add `activeIndicator: IndicatorType | 'overall'` with default `'overall'`
    - Add `dataCache: Map<string, { data: any; timestamp: number }>` with get/set/clear methods
    - Add `serviceStatus` and `dataSources` fields with setters
    - _Requirements: 13.1, 13.2, 13.3, 10.1_

  - [~] 2.2 Write property tests for Zustand store
    - **Property 5: Store persists indicator and notifies subscribers**
    - **Validates: Requirements 4.5, 13.2**
    - **Property 23: Store cache keyed by region and indicator**
    - **Validates: Requirements 13.3**

- [ ] 3. Build groundsource data loader in ML service
  - [~] 3.1 Create `mini-services/ml-service/groundsource_loader.py`
    - Implement `GroundsourceLoader` class with `load()`, `query_region()`, `compute_indicators()`, `get_statistics()`, `get_paginated_records()` methods
    - Load parquet with column pruning for memory efficiency
    - Build region index for fast lookups
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [~] 3.2 Write property tests for groundsource loader
    - **Property 6: Real data regions return groundsource-derived indicators**
    - **Validates: Requirements 5.2**
    - **Property 7: Paginated API results satisfy filter criteria and pagination invariants**
    - **Validates: Requirements 5.3**
    - **Property 8: Missing-data regions fall back to demo source**
    - **Validates: Requirements 5.4**

  - [~] 3.3 Integrate groundsource loader into ML service `index.py`
    - Initialize loader on startup, add `GET /api/groundsource/records` and `GET /api/groundsource/stats` endpoints
    - Modify existing `GET /api/regions` and `GET /api/regions/{id}` to use real data with demo fallback
    - Add `?indicator=` query param support to region endpoints
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 4. Build Google API integration module
  - [~] 4.1 Create `mini-services/ml-service/google_apis.py`
    - Implement `GoogleDataClient` with FloodHub forecast/alert methods and Earth Engine satellite data methods
    - Handle missing API keys gracefully (return empty results, set status to "demo")
    - Add `GET /api/floodhub/forecasts`, `GET /api/floodhub/alerts`, `GET /api/data-sources/status` endpoints
    - _Requirements: 5.6, 5.7, 5.9_

  - [~] 4.2 Implement multi-source data merge in ML service
    - Merge groundsource + FloodHub + Earth Engine data per region
    - Add confidence score computation based on data coverage
    - Add `GET /api/regions/{id}/indicators/{indicator}` endpoint for deep indicator data
    - _Requirements: 5.8, 7.2_

  - [~] 4.3 Write property tests for data merge and confidence
    - **Property 9: Multi-source data merge preserves all source fields**
    - **Validates: Requirements 5.8**
    - **Property 12: Confidence scores reflect data coverage**
    - **Validates: Requirements 7.2**

- [~] 5. Checkpoint - Backend data pipeline
  - Ensure all ML service tests pass, verify groundsource loader works with the parquet file, ask the user if questions arise.

- [ ] 6. Fix scrolling across all panels
  - [~] 6.1 Fix Left Sidebar and Right Sidebar scrolling in `src/app/page.tsx`
    - Wrap sidebar content in `<ScrollArea className="h-[calc(100vh-4rem)]">` with `overflow-hidden` on parent
    - Add `overscroll-behavior: contain` to prevent scroll propagation to map
    - _Requirements: 2.2, 2.3, 2.5_

  - [~] 6.2 Fix Policy Intelligence scrolling in `src/components/aquasdg/policy-intelligence.tsx`
    - Wrap each phase panel content in ScrollArea
    - Ensure phase navigation stays fixed while content scrolls
    - _Requirements: 2.1, 6.1_

  - [~] 6.3 Fix Data Explorer scrolling in `src/components/aquasdg/groundsource-explorer.tsx`
    - Wrap records list in ScrollArea with sticky table header
    - _Requirements: 2.4_

- [ ] 7. Overhaul map tooltips
  - [~] 7.1 Redesign tooltip in `src/components/aquasdg/map-view.tsx`
    - Replace oversized AI analysis button with compact "View Details" text link
    - Show region name, country, risk badge, and top 3 metrics from `INDICATOR_CONFIG[activeIndicator].nuancedMetrics`
    - Use muted dark slate color palette (`bg-slate-900/95`, `border-slate-700`)
    - Fix icon sizing to `w-3.5 h-3.5` with `overflow-hidden` containment
    - Read `activeIndicator` from Zustand store to determine which metrics to show
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 7.2 Write property test for tooltip content
    - **Property 1: Tooltip displays indicator-specific metrics**
    - **Validates: Requirements 3.1**

- [ ] 8. Make sidebars SDG-layer-aware
  - [~] 8.1 Update Left Sidebar to read activeIndicator from store
    - Legend component reads `INDICATOR_CONFIG[activeIndicator]` for color scale and labels
    - Risk distribution counts recalculate per indicator using indicator-specific thresholds
    - _Requirements: 4.1, 7.1_

  - [~] 8.2 Update Right Sidebar to show indicator-specific data
    - Metrics section reads `nuancedMetrics` from `INDICATOR_CONFIG[activeIndicator]`
    - Indicator bars compute color from `colorScale` and value from `region.indicators[activeIndicator]`
    - Fetch indicator-specific deep data from `GET /api/regions/{id}/indicators/{indicator}`
    - _Requirements: 4.2, 4.3, 4.4_

  - [~] 8.3 Write property tests for indicator-aware UI
    - **Property 2: Left sidebar legend matches selected indicator**
    - **Validates: Requirements 4.1**
    - **Property 3: Right sidebar metrics match selected indicator**
    - **Validates: Requirements 4.2**
    - **Property 4: Indicator bars reflect selected indicator and region**
    - **Validates: Requirements 4.4**

- [ ] 9. Implement dynamic risk level filter
  - [~] 9.1 Update risk filter logic in `src/app/page.tsx`
    - Compute risk level per region using the active indicator's value and thresholds (not the single hardcoded `riskLevel`)
    - Recalculate filter counts when `activeIndicator` changes
    - Filter map markers and region lists using indicator-specific classification
    - _Requirements: 7.1, 7.3_

  - [~] 9.2 Display confidence scores in Right Sidebar
    - Fetch confidence data from enhanced region API
    - Show confidence score as a percentage with data source breakdown
    - _Requirements: 7.2_

  - [~] 9.3 Write property tests for risk filter
    - **Property 11: Risk distribution recalculates per indicator**
    - **Validates: Requirements 7.1**
    - **Property 13: Risk filter uses indicator-specific classification**
    - **Validates: Requirements 7.3**

- [~] 10. Checkpoint - UI indicator awareness
  - Ensure all frontend tests pass, verify sidebars update when switching indicators, ask the user if questions arise.

- [ ] 11. Fix Policy Intelligence workflow
  - [~] 11.1 Fix "Back to Implementation" button visibility
    - Change button classes from white-on-white to `text-white bg-cyan-600 hover:bg-cyan-500`
    - _Requirements: 6.3_

  - [~] 11.2 Add real stakeholder database
    - Create `src/lib/aquasdg/stakeholders.ts` with curated entries for UNICEF WASH, WHO/UNICEF JMP, World Bank Water GP, WaterAid, IRC WASH, and regional government water ministries
    - Each entry has real public URLs, contact info, and relevant indicator types
    - Update Stakeholder Mapping phase to use this database
    - _Requirements: 6.2_

  - [~] 11.3 Write property test for stakeholder URLs
    - **Property 10: Stakeholder URLs are valid HTTP(S) URLs**
    - **Validates: Requirements 6.2**

  - [~] 11.4 Enhance report generation
    - Update ML service report endpoint with enhanced system prompt for thorough, data-driven analysis
    - Include structured sections: Executive Summary, Situation Analysis, Risk Assessment, Intervention Recommendations, Budget Breakdown, Implementation Timeline, Monitoring Framework
    - Use real region data and ML insights in the prompt
    - _Requirements: 6.4, 6.6_

  - [~] 11.5 Implement PDF export
    - Add `jspdf` and `html2canvas` dependencies
    - Create `src/lib/aquasdg/pdf-export.ts` with `generatePolicyPDF()` function
    - Add PDF download button to Policy Intelligence report view
    - _Requirements: 6.5_

- [ ] 12. Enhance Data Explorer
  - [~] 12.1 Update `src/components/aquasdg/groundsource-explorer.tsx` with working filters
    - Add filter controls for country, date range, severity threshold, indicator type
    - Connect filters to `GET /api/groundsource/records` with query params
    - Display paginated results with proper columns (region, date, severity, affected area, source)
    - Render source URLs as clickable hyperlinks with `target="_blank"`
    - _Requirements: 11.1, 11.2, 11.3_

  - [~] 12.2 Add summary insights panel to Data Explorer
    - Show record count, average severity, temporal distribution chart (using Recharts), and top affected regions
    - Show mini-map for selected record location
    - _Requirements: 11.4, 11.5_

  - [ ]* 12.3 Write property tests for Data Explorer
    - **Property 18: Data Explorer filtered results match filter criteria**
    - **Validates: Requirements 11.2**
    - **Property 19: Data Explorer source links rendered as hyperlinks**
    - **Validates: Requirements 11.3**
    - **Property 20: Data Explorer summary insights contain required fields**
    - **Validates: Requirements 11.4**

- [ ] 13. Add flood event visualization
  - [~] 13.1 Add flood event map layer in `src/components/aquasdg/map-view.tsx`
    - Add MapLibre source+layer for flood events as circle markers with severity-coded radius and color
    - Toggle visibility: prominent when `activeIndicator === 'flood_risk'`, subtle otherwise
    - Add flood event tooltip showing date, severity, affected area, data source
    - _Requirements: 8.1, 8.2, 8.3_

  - [~] 13.2 Add FloodHub alert badges and SDG 6 overlay
    - Show alert badges on region markers and in Right Sidebar for regions with active flood alerts
    - When displaying flood data, overlay SDG 6 metrics (water access, sanitation, policy readiness)
    - Right Sidebar for flood-affected regions shows both hazard data and ML intervention recommendations
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ]* 13.3 Write property tests for flood visualization
    - **Property 14: Flood event tooltip shows all required fields**
    - **Validates: Requirements 8.2**
    - **Property 21: Flood alert badges shown for alerted regions**
    - **Validates: Requirements 12.2**
    - **Property 22: Flood display includes SDG 6 analysis overlay**
    - **Validates: Requirements 12.3**

- [ ] 14. Add error boundaries and resilience
  - [~] 14.1 Create error boundary component
    - Create `src/components/aquasdg/error-boundary.tsx` as a React error boundary with fallback UI and retry button
    - Wrap MapView, PolicyIntelligence, GroundsourceExplorer, and sidebar panels
    - _Requirements: 9.2_

  - [~] 14.2 Add contextual error handling to API client
    - Update `src/lib/aquasdg/api.ts` to produce contextual error messages with endpoint name and retry callback
    - Add service status detection (connected/degraded/offline) and update Zustand store
    - Show service status banner when ML service is unreachable
    - _Requirements: 9.1, 9.3_

  - [ ]* 14.3 Write property tests for error handling
    - **Property 15: Error handler produces contextual messages with retry**
    - **Validates: Requirements 9.1**
    - **Property 16: Error boundary renders fallback on child error**
    - **Validates: Requirements 9.2**

- [ ] 15. Implement data caching with React Query
  - [~] 15.1 Configure React Query caching in API hooks
    - Set `staleTime: 5 * 60 * 1000` (5 min) for region data queries
    - Add manual refresh button that calls `queryClient.invalidateQueries()`
    - Integrate with Zustand store cache for offline fallback
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 15.2 Write property test for cache behavior
    - **Property 17: Cache stores, serves within TTL, and expires after TTL**
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [~] 16. Final checkpoint - Full integration
  - Ensure all tests pass, verify end-to-end flow: select indicator → sidebars update → tooltips update → risk filter recalculates → Data Explorer filters work → flood events visible → PDF export works. Ask the user if questions arise.

## Notes

- Core data pipeline and indicator-awareness tests are required (tasks 2.2, 3.2, 4.3, 8.3, 9.3, 11.3)
- Deeper system tests marked with `*` are optional — run after core features are confirmed working (tasks 7.2, 12.3, 13.3, 14.3, 15.2)
- Each task references specific requirements for traceability
- Backend tasks (3, 4) come before frontend tasks (6-15) to ensure APIs are ready
- Checkpoints at tasks 5, 10, and 16 ensure incremental validation
- Property tests use `fast-check` for TypeScript and `hypothesis` for Python
- The parquet file (636MB) is already at `mini-services/ml-service/groundsource_2026.parquet`
