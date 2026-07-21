---
title: Smart Sole
slug: smart-sole
summary: A lightweight, modular foot sensor system for real-time pressure mapping and gait analysis.
year: 2026
date: 2026-07-20
status: In progress
tags: hardware, embedded, sensors, biomechanics
featured: true
order: 3
---
## Why I built it

Pressure distribution across a foot contains useful information about balance and gait, but many measurement systems are bulky or tied to a single experiment. I wanted to explore a lightweight sole that could collect that data without getting in the way of natural movement.

## How it works

An array of pressure sensors is distributed across the sole and read by a small embedded controller. The samples can be calibrated, timestamped, and sent to a computer for live visualisation or later analysis.

The design is organised around interchangeable layers:

- a flexible sensing layer inside the shoe
- compact electronics for sampling and communication
- software for calibration, pressure maps, and gait metrics

## Design constraints

The system needs to remain thin, flexible, and comfortable while protecting the sensors and wiring. Repeatable calibration also matters: raw readings are only useful when changes in pressure can be separated from sensor drift and differences in fit.

## Next

The next iteration will test sensor placement, calibration, and durability before expanding the analysis software.
