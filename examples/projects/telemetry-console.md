---
title: Telemetry Console
slug: telemetry-console
summary: A compact interface for turning noisy sensor streams into readable events, trends, and exceptions.
year: 2026
status: Prototype
tags: Software, Data, Interface
featured: true
order: 2
---
## Brief

Raw telemetry is precise but rarely calm. The goal of this prototype is to preserve the detail while making the important changes obvious: what moved, when it moved, and whether it deserves attention.

## Constraints

- Fast enough to remain useful on modest hardware.
- Legible on a laptop without a wall of miniature charts.
- Clear about missing data and uncertain readings.
- Keyboard-first for repeated inspection.

## Result

The current prototype uses a timeline, a narrow event rail, and a deliberate limit on simultaneous signals. That constraint made the interface more useful than an unlimited grid of panels.
