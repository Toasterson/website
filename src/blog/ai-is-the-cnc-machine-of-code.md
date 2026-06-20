---
title: "AI is the CNC Machine of Code"
type: post
date: 2026-06-20
summary: "Everyone keeps telling me AI is going to replace programmers. After using it daily on illumos work for a while now, I think it is something older and far less scary: the CNC machine of code. The craft does not vanish, it moves up a level."
tags:
  - ai
  - opinion
  - illumos
layout: post.njk
---

![A five-axis CNC machine in a bright workshop cutting a stream of glowing holographic code, sparks flying off the tool, with the chips stacking up as translucent data plates — a metaphor for AI turning a precise specification into working software.](/img/ai-is-the-cnc-machine-of-code.webp)

# AI is the CNC Machine of Code

I have been using the AI coding tools daily for a while now. On stream, on the
[Installer](https://github.com/Toasterson/illumos-installer), on package work, on
the small Rust glue that nobody else wants to write. And the discourse around
them drives me a little mad. Every week the timeline swings between "this is
useless autocomplete" and "programmers are finished, pack it up." Neither of those
matches what I actually see when I sit at the keyboard.

A hunch kept nagging me while I worked, and the longer I sat with it the better it
fit. So I am going to write it down and see if it holds up: **AI is the CNC
machine of code.** Not the robot that takes your job. The machine in the back of
the Shop that changed what the job *was*.

## What the CNC machine did to the shop

When numerically controlled machine tools showed up, and later the CAM software
that could generate the toolpaths for you, the prediction was made with a lot of
confidence: this is the end of the Machinist. Why keep paying someone with twenty
years of feel in their hands when a Program can cut the part?

That is not what happened. The trade changed instead. Manually punching code for
machines that could suddenly work four and five axes became too slow, so the work
moved up a layer. The Machinist told the CAM software *what* they wanted and the
software emitted the G-code. The handwheels went away. The judgment did not. The
people who understood metal kept understanding metal, they just stopped turning
cranks to express it.

## A CNC machine cuts perfect scrap

Here is the thing about a CNC machine that I think people forget. It does not
decide what to make. It takes a precise Program and executes it faithfully, fast,
and repeatably. That last word is the whole point. You can run the same program a
thousand times and get a thousand identical parts. For a small Shop that is an
enormous amount of leverage.

But the machine is completely indifferent to whether the Program is any good. Hand
it a bad one and it will happily cut you a flawless piece of scrap. On time. To
spec. Every single time. It amplifies whoever is driving it. A master gets
leverage out of it and a beginner gets to make expensive mistakes much faster than
they ever could by hand.

So the skill did not disappear when the cutting got automated. It moved:

- Off the handwheels and onto the **Program** — describing the intent precisely.
- Into **fixturing** — how you hold the stock so the cut comes out true.
- Into **feeds and speeds** — the tacit knowledge that separates a clean surface
  from a ruined one.
- Into **inspection** — because a part is not finished until someone has measured
  it against what it was supposed to be.

## Now read that back, for code

The mapping is almost embarrassingly direct, and that is why I cannot let the
hunch go.

AI is the spindle. The prompt, the spec, the issue you are working from is the
Program. Your existing codebase is the raw stock. Your tests, your types and your
CI are the fixturing and the jigs. And review, actually reading the diff, is the
metrology bench at the end of the line.

The machine executes your intent faithfully, fast, and at a scale you would not
attempt by hand. It is also gloriously indifferent to whether your intent was any
good. Garbage in, perfect garbage out, and it arrives a lot faster than the
garbage you would have typed yourself. A function the model wrote is not done
because it compiles, any more than a bracket is done because the spindle stopped
moving. It is done when someone who knows what the part is *for* has held it up
against the spec. On a project like illumos that someone is still very much us.

## The skill moves up a level

This is the part the "it will replace us" story keeps missing. CNC did not delete
the Machinist's knowledge, it relocated it. The machine took the rote cutting and
the human kept, and actually deepened, the part that was always hard: holding the
work, choosing the strategy, judging the result.

I think the same relocation is happening to us. The boilerplate, the third
near-identical handler, the test fixtures, the obvious mechanical refactor, that
is rote cutting and I am glad to hand it off. What stays human is the work that
was always the real job. Deciding *what* to build. Fixturing it so it can be
verified. Inspecting what comes out. The people in machining tell the same story
from the other side, by the way, the time saved on programming gets
[reinvested in fixturing and quality validation](https://www.americanmachinist.com/cad-and-cam/article/55260914/the-transformation-of-cnc-machining-through-the-power-of-artificial-intelligence-dassault-systemes),
not in sending the Machinist home.

## The plot twist nobody predicted in 1985

Here is what actually became of the Machinist forty years after the machine that
was going to replace them. There are
[not enough of them](https://lmkrecruiting.com/cnc-operator-shortage/). Over half
of manufacturers say they cannot hire qualified CNC people, and the median age of
the ones they do have sits around 55. The automation did not empty the trade. It
raised the floor, multiplied the output of the people who stayed, and made the
masters scarcer and more valuable than before.

I think the same thing is coming for our corner of software, and it is more or
less the opposite of the doom forecast. The people who deeply understand the
material, how a system actually fails, why a build is reproducible, what a correct
fix really looks like, do not get cheaper when the cutting is automated. They get
force-multiplied. The bottleneck stops being how fast you can type and becomes how
well you can judge. And judgment is the one thing the machine cannot hand you.

## What this means for a project like illumos

We are a Shop with far more work than hands. OpenIndiana and the wider illumos
community are a group of volunteers holding up a serious operating system, and
there is always another package to update, another driver to chase, another bit of
bitrot to file off. A CNC machine in the back of *that* Shop is a genuine gift.

But only if we keep the Machinist. The leverage is real and so is the failure
mode. A tool that lets a small team produce a lot, very fast, will just as happily
produce a lot of plausible scrap, and plausible scrap is worse than obvious scrap
because it gets through review. Our defense is the thing we already care about.
Knowing what a correct package looks like. Building reproducibly. Measuring every
part against the spec before it ships. I would argue review matters *more* in this
world, not less, not less.

I do not know exactly where the lines settle. I do not know how much of the audit
problem we already have with hundred-dependency Rust crates gets worse when a
machine is writing more of the code, and I do not know which parts of the craft
turn out to be load-bearing until we try to automate them and watch something
break. That is fine. We figured out the cargo-versus-system-packaging tension by
arguing it out in the open, and we will figure this one out the same way.

## An invite

If any of this resonates, I would love to compare notes. Come try the spindle on
something low-stakes. The illumos userland is full of small tools that are perfect
for it, and I could genuinely use the hands on the
[Installer](https://github.com/Toasterson/illumos-installer) and the package
[Forge](https://github.com/toasterson/forge). Or just go poke around
[the illumos repos](https://github.com/orgs/illumos/repositories?type=all) and see
what a real Shop looks like.

So that is the hunch, written down. AI is the CNC machine of code. Learn to drive
it, fixture your work so the output can be inspected, and never confuse a fast cut
with a good part. The spindle does not know what it is making. We still have to.

Hope to talk to some folks on Socials and email.

-- Toasty
