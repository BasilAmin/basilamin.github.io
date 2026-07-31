---
title: Smart Sole
slug: smart-sole
summary: A modular pressure-sensing prototype exploring real-time gait feedback.
year: 2026
date: 2026-07-20
status: Documenting
role: Concept, electronics, embedded software
tags: Embedded Systems, Sensors, Biomechanics, Prototyping
featured: true
order: 3
---

## Why I started it

The project began with a personal problem: my grandmother lives with reduced sensation in her feet. I wanted to explore whether pressure sensing and immediate feedback could make otherwise invisible patterns easier to notice.

Smart Sole is a prototype and research project, not a diagnostic or medical device. Any useful version would require proper clinical input, validation, safety work, and a much clearer understanding of the people using it.

## The idea

The sole measures pressure across several points under the foot and turns those readings into a live map. A feedback layer could then flag unusual loading patterns or repeated pressure in one area.

The interesting engineering problem is the loop:

1. sense a physical pattern;
2. turn noisy readings into something interpretable;
3. communicate it without overwhelming the user;
4. learn whether the feedback changes behaviour in a useful way.

## Current state

The next useful step is documentation before expansion. I am inventorying the existing hardware, code, measurements, and assumptions, then drawing the system as it actually exists. That should make the gaps—especially validation and user feedback—much easier to see.
