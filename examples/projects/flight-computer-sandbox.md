---
title: Flight Computer Sandbox
slug: flight-computer-sandbox
summary: A safe simulation environment for testing state machines, sensor faults, and recovery logic before touching hardware.
year: 2025
status: Archived experiment
tags: Simulation, Embedded, Testing
featured: true
order: 3
---
## Brief

This sandbox models a small event-driven computer and a handful of imperfect sensors. It exists to make software behaviour visible: state transitions, timeouts, degraded modes, and the assumptions hidden inside otherwise tidy code.

## Principles

1. Simulate failure before celebrating the happy path.
2. Record every state transition in plain language.
3. Keep the model simple enough to inspect.
4. Separate the educational simulation from any real-world control system.

## Outcome

The project became most valuable as a debugging exercise. A timeline of decisions exposed problems that ordinary logs made surprisingly easy to miss.
