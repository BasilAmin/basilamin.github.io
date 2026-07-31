---
title: Relay
slug: relay
summary: A gantry-based robotic chess system that keeps a physical board and a Lichess game in sync.
year: 2026
date: 2026-07-20
status: In progress
role: Firmware and software
tags: Robotics, Embedded Systems, Computer Vision, Collaboration
featured: true
order: 2
---

## The project

Relay is our team project for the Patch summer accelerator at Dogpatch Labs. We are turning a repurposed 3D-printer gantry into a robotic chess system: the machine observes a physical board, reconciles it with an online game, and moves pieces through an electromagnet mounted on the gantry.

The difficult part is not making one piece move once. It is keeping several imperfect systems in agreement: board state, move detection, motion control, network state, and recovery when reality does not match the software’s assumptions.

## My work

I am working mainly on firmware and software. That includes defining the interfaces between subsystems, making state changes explicit, and building tests that expose failures before a full demonstration does.

A useful design question has been: what must each part know, and what should it never be allowed to assume?

## Current focus

- write the architecture and interface map;
- keep a real build log instead of relying on memory;
- define repeatable integration tests with the team;
- record failure modes and recovery behaviour;
- make the public explanation match the system we actually built.

## What I am learning

Team engineering is less about having the cleverest isolated solution and more about making boundaries legible. A component is not finished when it works alone; it is finished when the rest of the system can depend on it without guesswork.
