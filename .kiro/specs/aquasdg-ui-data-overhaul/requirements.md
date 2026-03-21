# Requirements Document

## Introduction

This document specifies the requirements for a comprehensive UI and data overhaul of the AquaSDG platform — an AI-powered freshwater access intelligence system built with Next.js and a Python FastAPI ML service. The overhaul addresses critical UI bugs (scrolling, tooltip design, button visibility), replaces hardcoded mock data with real groundsource data (2.6M parquet records), makes all UI panels dynamically respond to SDG indicator layer selection, improves the Policy Intelligence workflow with real stakeholder data and PDF export, enhances AI-generated report quality, and adds infrastructure improvements including error boundaries, data caching, and flood event visualization.

## Glossary

- **AquaSDG_Platform**: The full-stack application comprising a Next.js frontend and Python FastAPI ML service for freshwater access intelligence
- **ML_Service**: The Python FastAPI backend service running on port 3001 that provides risk classification, intervention recommendations, and data APIs
- **SDG_Indicator**: One of nine Sustainable Development Goal water-related indicators: composite_risk, water_access, sanitation, water_stress, flood_risk, drought_risk, climate_vulnerability, infrastructure_gap, policy_vector
- **Indicator_Layer**: The currently selected SDG indicator that determines what data is displayed across all UI panels
- **Left_Sidebar**: The left panel on the map view containing the SDG indicator switcher, risk level filter, legend, and data source status
- **Right_Sidebar**: The right panel on the map view showing region details, nuanced metrics, and contextual insights for the selected region
- **Map_Tooltip**: The popup that appears when hovering over a region marker on the map
- **Policy_Intelligence**: The 5-phase workflow component (Situation Analysis, Intervention Planning, Stakeholder Mapping, Implementation Roadmap, Monitoring & Evaluation)
- **Groundsource_Data**: The 2.6M record parquet file containing real flood and water event data located at `mini-services/ml-service/groundsource_2026.parquet`
- **Data_Explorer**: The GroundsourceExplorer component for browsing and verifying data records
- **Risk_Level**: A classification of region risk: normal/low, watch/moderate, warning/high, danger/critical
- **Indicator_Bar**: Colored progress bars in the UI that visually represent indicator values for a region
- **Zustand_Store**: The global state management store that holds selected region, active indicator, filters, and UI state

## Requirements

### Requirement 1: Publish Current Codebase to GitHub as v1

**User Story:** As a developer, I want to publish the current codebase to GitHub as v1 before making any changes, so that I have a clean baseline to compare against and can roll back if needed.

#### Acceptance Criteria

1. WHEN the user initiates the publish workflow, THE AquaSDG_Platform codebase SHALL be pushed to a GitHub repository (ApurvaDesai6/aquasdg) with a v1.0.0 tag
2. WHEN publishing to GitHub, THE AquaSDG_Platform SHALL include a .gitignore that excludes node_modules, .next, __pycache__, .env files, service-account.json, and the parquet data file
3. WHEN the v1 tag is created, THE repository SHALL contain a README.md describing the project, setup instructions, and architecture overview

### Requirement 2: Fix Scrolling Across All Panels

**User Story:** As a user, I want all content panels to be scrollable, so that I can access all information without content being clipped or hidden.

#### Acceptance Criteria

1. WHEN the Policy_Intelligence content exceeds the viewport height, THE Policy_Intelligence SHALL provide vertical scrolling within each workflow phase
2. WHEN the Left_Sidebar content exceeds the viewport height, THE Left_Sidebar SHALL provide vertical scrolling without affecting the map
3. WHEN the Right_Sidebar content exceeds the viewport height, THE Right_Sidebar SHALL provide vertical scrolling without affecting the map
4. WHEN the Data_Explorer content exceeds the viewport height, THE Data_Explorer SHALL provide vertical scrolling for the records list
5. WHEN any scrollable panel is scrolled, THE AquaSDG_Platform SHALL not propagate scroll events to the underlying map or parent containers

### Requirement 3: Overhaul Map Tooltips

**User Story:** As a user, I want map tooltips to show concise, relevant ML insights with proper styling, so that I can quickly assess a region's status without visual clutter.

#### Acceptance Criteria

1. WHEN a user hovers over a region marker, THE Map_Tooltip SHALL display the region name, country, risk level badge, and the top 3 relevant indicator values for the current Indicator_Layer
2. THE Map_Tooltip SHALL NOT display an oversized AI analysis button
3. WHEN the Map_Tooltip displays icons, THE Map_Tooltip SHALL render icons fully without clipping or overflow
4. THE Map_Tooltip SHALL use a muted color palette consistent with the dark theme (not bright blue)
5. WHEN the current Indicator_Layer changes, THE Map_Tooltip SHALL update the displayed indicator values to reflect the selected layer's relevant metrics

### Requirement 4: SDG-Layer-Aware Sidebars

**User Story:** As an analyst, I want the left and right sidebars to dynamically update based on the selected SDG indicator layer, so that I see contextually relevant data for my current analysis focus.

#### Acceptance Criteria

1. WHEN a user selects a different SDG_Indicator in the Indicator_Layer switcher, THE Left_Sidebar SHALL update the legend, color scale, and risk distribution to reflect the selected indicator
2. WHEN a user selects a different SDG_Indicator, THE Right_Sidebar SHALL update the displayed metrics, insights, and contextual information to prioritize data relevant to the selected indicator
3. WHEN a region is selected and the Indicator_Layer changes, THE Right_Sidebar SHALL recalculate and display the region's metrics specific to the new indicator
4. THE Indicator_Bar elements SHALL change color and value dynamically based on the selected Indicator_Layer and the selected region's data
5. WHEN the Indicator_Layer is changed, THE Zustand_Store SHALL persist the selected indicator and notify all subscribed components

### Requirement 5: Integrate Real Groundsource and Google API Data

**User Story:** As a data analyst, I want the platform to use real data from the 2.6M record groundsource parquet file and live Google APIs (FloodHub, Earth Engine) instead of hardcoded values, so that analysis and decisions are based on actual observations with comprehensive coverage.

#### Acceptance Criteria

1. WHEN the ML_Service starts, THE ML_Service SHALL load and index the Groundsource_Data parquet file for query access
2. WHEN a region is queried, THE ML_Service SHALL return indicator values computed from real Groundsource_Data records matching that region
3. WHEN the Data_Explorer requests records, THE ML_Service SHALL serve paginated results from the Groundsource_Data with filtering by region, date range, severity, and indicator type
4. WHEN no Groundsource_Data records match a region, THE ML_Service SHALL fall back to the existing mock data and indicate the data source as "demo"
5. WHEN the ML_Service computes statistics, THE ML_Service SHALL derive aggregates from the Groundsource_Data rather than hardcoded values
6. WHEN a valid Google Cloud API key is configured, THE ML_Service SHALL connect to Google FloodHub API to fetch real-time and historical flood forecasting data
7. WHEN a valid Google Cloud service account is configured, THE ML_Service SHALL use Earth Engine to retrieve satellite-derived water body extent, vegetation indices, and precipitation data for enriching region indicators
8. WHEN live Google API data is available, THE ML_Service SHALL merge it with Groundsource_Data to provide comprehensive multi-source coverage per region
9. WHEN displaying data source status, THE AquaSDG_Platform SHALL show each source (Groundsource, FloodHub, Earth Engine) with its connection status (live/demo/error) and record count

### Requirement 6: Fix Policy Intelligence UI and Workflow

**User Story:** As a policy maker, I want the Policy Intelligence workflow to have scrollable content, real stakeholder data, a visible navigation button, and comprehensive report generation with PDF export, so that I can produce actionable policy documents.

#### Acceptance Criteria

1. WHEN the Policy_Intelligence phase content exceeds the visible area, THE Policy_Intelligence SHALL allow vertical scrolling within each phase panel
2. WHEN the Stakeholder Mapping phase is active, THE Policy_Intelligence SHALL display stakeholders with real public database links and contact information sourced from known international water organizations
3. WHEN the "Back to Implementation" button is rendered, THE Policy_Intelligence SHALL display the button with visible text contrast (not white text on white background)
4. WHEN a user requests report generation, THE Policy_Intelligence SHALL produce a comprehensive, professionally formatted report using real region data and ML insights
5. WHEN a user clicks the PDF export button, THE Policy_Intelligence SHALL generate and download a PDF document containing the full policy report
6. WHEN generating a report, THE ML_Service SHALL use an enhanced system prompt that produces thorough, data-driven analysis with proper section headings, statistics, and actionable recommendations

### Requirement 7: Dynamic Risk Level Filter and Confidence Numbers

**User Story:** As an analyst, I want risk level filters and confidence numbers to adjust dynamically based on the selected SDG layer and region, so that I see accurate, context-specific risk assessments.

#### Acceptance Criteria

1. WHEN the Indicator_Layer changes, THE Risk_Level filter counts SHALL recalculate based on the selected indicator's risk thresholds for all regions
2. WHEN a region is selected, THE Right_Sidebar SHALL display confidence scores computed from the actual data coverage and quality for that region
3. WHEN the risk filter is applied, THE AquaSDG_Platform SHALL filter map markers and region lists using indicator-specific risk classification rather than a single hardcoded risk level

### Requirement 8: Flood Event Visualization on Map

**User Story:** As a user, I want to see flood events visualized on the map, so that I can understand the spatial distribution and severity of historical flood incidents.

#### Acceptance Criteria

1. WHEN flood event data is available for a region, THE Map_View SHALL render flood event markers or heat zones on the map
2. WHEN a user hovers over a flood event marker, THE Map_Tooltip SHALL display the event date, severity, affected area, and data source
3. WHEN the flood_risk Indicator_Layer is selected, THE Map_View SHALL prominently display flood event overlays

### Requirement 9: Error Boundaries and Resilience

**User Story:** As a user, I want the application to handle errors gracefully, so that a failure in one component does not crash the entire interface.

#### Acceptance Criteria

1. WHEN a network request to the ML_Service fails, THE AquaSDG_Platform SHALL display a contextual error message with a retry option instead of a generic error
2. WHEN a UI component throws a rendering error, THE AquaSDG_Platform SHALL catch the error in an error boundary and display a fallback UI for that component only
3. IF the ML_Service is unreachable, THEN THE AquaSDG_Platform SHALL display a service status indicator and allow the user to continue using cached data

### Requirement 10: Data Caching Layer

**User Story:** As a user, I want previously fetched data to be cached, so that repeated views load instantly and reduce unnecessary API calls.

#### Acceptance Criteria

1. WHEN region data is fetched from the ML_Service, THE AquaSDG_Platform SHALL cache the response with a configurable time-to-live
2. WHEN the same region data is requested within the cache TTL, THE AquaSDG_Platform SHALL serve the cached response without making a new API call
3. WHEN the cache TTL expires, THE AquaSDG_Platform SHALL fetch fresh data from the ML_Service and update the cache
4. WHEN the user manually triggers a refresh, THE AquaSDG_Platform SHALL bypass the cache and fetch fresh data

### Requirement 11: Data Explorer with Filtering and Insights

**User Story:** As a researcher, I want the Data Explorer to provide working filters, functional source links, and ML-derived insights layered on top of raw data, so that I can efficiently investigate and understand the underlying records.

#### Acceptance Criteria

1. WHEN the Data_Explorer is opened, THE Data_Explorer SHALL display paginated records from the Groundsource_Data with columns for region, date, severity, affected area, and data source
2. WHEN a user applies filters (by country, date range, severity threshold, indicator type), THE Data_Explorer SHALL query the ML_Service and return only matching records
3. WHEN displaying a data source link, THE Data_Explorer SHALL render a clickable hyperlink that opens the original source URL in a new tab
4. WHEN a set of filtered records is displayed, THE Data_Explorer SHALL show summary insights including record count, average severity, temporal distribution chart, and top affected regions
5. WHEN a user selects a record, THE Data_Explorer SHALL display detailed information including all available fields and a mini-map showing the event location

### Requirement 12: FloodHub Feature Parity with SDG 6 Analysis

**User Story:** As a water security analyst, I want AquaSDG to provide flood monitoring capabilities comparable to Google FloodHub while adding SDG 6 focused ML analysis, so that I have a comprehensive platform for water risk assessment and policy action.

#### Acceptance Criteria

1. WHEN flood forecast data is available from FloodHub, THE AquaSDG_Platform SHALL display flood inundation forecasts on the map with severity-coded overlays
2. WHEN a region has active flood alerts, THE AquaSDG_Platform SHALL display alert badges on the region marker and in the Right_Sidebar
3. WHEN displaying flood data, THE AquaSDG_Platform SHALL overlay SDG 6 analysis including affected population water access rates, sanitation infrastructure at risk, and policy response readiness scores
4. WHEN a user views a flood-affected region, THE Right_Sidebar SHALL show both the FloodHub-style hazard data and AquaSDG's unique ML-derived intervention recommendations and cost estimates

### Requirement 13: Zustand Store Enhancement for Indicator State

**User Story:** As a developer, I want the global state store to track the active SDG indicator layer and propagate changes to all dependent components, so that the UI stays consistent.

#### Acceptance Criteria

1. THE Zustand_Store SHALL include an activeIndicator field of type IndicatorType with a default value of "overall"
2. WHEN the activeIndicator changes in the Zustand_Store, THE AquaSDG_Platform SHALL re-render all components that depend on the indicator selection
3. THE Zustand_Store SHALL include a data cache map keyed by region ID and indicator type for storing fetched indicator data
