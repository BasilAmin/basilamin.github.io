---
title: TVC Model Rocket
slug: tvc-model-rocket
summary: A scale-model, actively controlled rocket using thrust vectoring for stability.
year: 2023
date: 2026-07-20
status: Archived
tags: rocketry, engineering, physics, hobbyist
featured: true
order: 2
---
## Storytime

This project has a special place in my brain, being my first ever technical/hobbyist project. It's quite a funny story:

Back in 1st year, when I was 11/12ish, my maths teacher told me I should enter the BTYSE (BT Young Scientist Exhibition), since I'd figured out, using basic components, how to get a motor moving by clapping, and sent him a video of it. I was thinking about what to build next, and originally wanted to build something with magnets (I don't know why — at the time they were just interesting to me).

I ended up on a random NASA fanclub Discord, and fortuitously met a mechanical engineer who works as a technician at SpaceX. It was pretty random, but I got on a call with him — a genuinely nice guy. He told me about a control system SpaceX used to land their rockets, then told me to go build a rocket using that same system. I thought it sounded cool, so I said yes.

The project was filled with harsh and unforgiving challenges. Physics is cruel. Very cruel. And the Dunning-Kruger curve hit me harder than it's hit anyone in history. But I learned a crazy amount — probably more than I'll ever learn again in the technical fields in such a short span. I'd also naively decided I wanted to actually launch it and land it propulsively, something that hadn't been done before by a hobbyist, and to enter the whole thing into the BTYSE.

The rocket never launched. Even if it had, the project would still count as a failure by most measures — mainly because I tried to buy F-class motors through a supplier I really shouldn't have used, and ended up with faulty ones that had been opened before they reached me. The control system itself worked well in theory and bench testing, but nothing is proven until it's flown. I still call it a personal success, given how much I learned and applied.

I also went on national television (RTÉ's The Late Late Show) — [watch the clip here](https://drive.google.com/file/d/196UgNYvdXbkVi7Oqz2QPm5DFaSjFgQNb/view?usp=sharing) — to present the project, and picked up a minor award at the competition. It was pretty cool. They gave me free pizza.

More than anything, the project taught me a lot about myself — mainly, a much clearer sense of what I'm actually capable of. Since then, I've believed I can do whatever I set my mind to, as long as God wills it.

## How it works

The airframe was built around two BT-80 body tubes, giving enough internal volume for the electronics bay and gimbal assembly while keeping the diameter manageable for a first build.

**Structure** — All the non-off-the-shelf mechanical parts, including the gimbal mount, motor retainer, and fin can, were CAD-designed and 3D printed. This let me iterate on the gimbal geometry quickly without needing to machine anything.

**Actuation** — The motor mount was gimbaled on two axes, actuated by a pair of servos driven directly off commands from the flight computer. This is what let the rocket steer thrust independently of the airframe's orientation, rather than relying on fins alone.

**Electronics** — I designed a custom PCB to house the flight computer, sensor package, and servo drivers, rather than building around a breadboard or off-the-shelf dev board.

**Firmware** — I wrote the firmware myself, handling sensor readout, an IMU-based orientation estimate, and attitude error into gimbal commands in real time.

**Where it stood at the end** — The control loop performed well in bench testing and simulation, but the project never made it to a live flight, so the system was never validated in the one environment that actually matters.
