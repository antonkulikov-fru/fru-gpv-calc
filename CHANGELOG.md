# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive README.md detailing project goal, architecture (4 layers), and local setup
- Updated .gitignore with standard Node.js, Vite, and development environment exclusions

## [0.1.0] - 2026-01-27

### Added
- React + TypeScript + Vite application scaffolding
- Scenario workspace UI with layered input panels and computed outputs
- Model-data compute engine with trace and warning support
- Local scenario persistence and JSON import/export
- Default scenario JSON seeded with baseline inputs
- Jest test suite for core compute outputs and validation

### Changed
- Organized the Intent Capture layer by vertical with nested channel, surface, model, and CR-1 sections
- Added flow-based per-org layout for the Intent Capture layer
- Converted the Intent Capture layer into a column-based table layout
- Grouped vertical, channel, and surface rows in the Capture table to avoid repeated mixes
- Added a Config tab and reorganized Donation Execution into an aggregate table with output columns
- Removed GPV 1T output from the Donation Execution table (kept in Overall Outputs)
- Expanded the Config tab to show churn and seasonality derived columns
- Made monthly churn editable with automatic cumulative survival updates
- Restricted offline channel to mobile app surfaces in default scenario and UI
