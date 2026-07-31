---
title: Patch program, week one
slug: patch-program-week-one
summary: Building Relay at Dogpatch Labs and discovering where the interfaces are still vague.
date: 2026-07-21
tags: Relay, Dogpatch Labs, Build Log
---

The team is now deep into Relay, our gantry-based robotic chess system. I am spending most of my time on firmware, software, and the points where one subsystem hands responsibility to another.

The biggest lesson so far is that “it works” is not a useful statement without a boundary. Works with which board state? After which failure? Who owns recovery? The next build log needs to record those conditions, not just the happy path.
