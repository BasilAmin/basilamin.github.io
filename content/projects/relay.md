---
title: Relay
slug: relay
summary: A modular embedded system for collecting and relaying sensor data in real time.
year: 2026
date: 2026-07-20
status: In progress
tags: hardware, embedded, sensors, biomechanics
featured: true
order: 4
---
## Why I built it

I wanted a reusable way to move sensor readings from hardware into software that can inspect, record, and act on them. Keeping that link separate from any one sensor makes it easier to reuse across experiments.

## How it works

Relay is split into small modules: sensors produce measurements, an embedded controller packages them, and a receiving application turns the stream into usable data. The boundaries between those parts are deliberately simple so that a sensor or transport can change without redesigning the whole system.

The current work focuses on:

- consistent timestamps and message formats
- reliable communication when samples are delayed or dropped
- a modular hardware layout that is easy to test

## What I am learning

The difficult part is not reading one sensor value. It is preserving useful timing and context as data crosses several boundaries, while keeping failures visible enough to diagnose.

## Next

The next step is to settle the message format, test it with representative sensor loads, and document the hardware and software interfaces as they stabilise.
