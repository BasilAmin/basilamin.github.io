---
title: Trading Algorithms
slug: trading-algorithms
summary: Simulation-only research into backtesting, quantitative methods, and how models mislead.
year: 2026
date: 2026-07-20
status: Research
role: Independent research and software
tags: Python, Statistics, Backtesting, Research
featured: true
order: 5
---

## Scope

This is a research project about measurement, not a promise of profit. I am using toy datasets and simulation to understand how backtests can produce convincing stories from weak evidence.

No part of the project is used for real-money deployment.

## Research plan

The first cycle is intentionally narrow:

- define one falsifiable question;
- implement a simple baseline;
- compare it against an equally simple benchmark;
- test for look-ahead, selection, and survivorship bias;
- write down the limitations before interpreting the result.

## Why it interests me

A backtest looks precise because it produces numbers. That precision can hide fragile assumptions, accidental leakage, and choices made after seeing the data. The useful lesson extends beyond finance: models should be judged by the process that produced them, not only by their cleanest chart.
