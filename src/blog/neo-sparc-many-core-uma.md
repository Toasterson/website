---
title: "What if SPARC's Throughput Philosophy Got a Second Chance on RISC-V?"
type: post
date: 2026-03-29
summary: "An AI-assisted deep research session into why Sun's UltraSPARC T-series design philosophy — many simple cores, hardware multithreading, unified memory — deserves a comeback on open RISC-V silicon."
tags:
  - risc-v
  - sparc
  - architecture
  - illumos
  - hardware
  - ai-research
layout: post.njk
---

# What if SPARC's Throughput Philosophy Got a Second Chance on RISC-V?

Some backstory: I have been using Claude Code to plan out and research whether Sun's [SunRay](https://en.wikipedia.org/wiki/Sun_Ray) thin-client architecture could be replicated as a modern Wayland compositor. During that process I kept getting this gut feeling that SPARC's throughput computing design could handle this kind of workload — and my neuro-symbolic AI experiment ([akh-medu](https://github.com/Toasterson/akh-medu)) — more efficiently than what we have today. But I also knew that with all the improvements in modern CPUs and GPUs, a direct comparison was not really fair anymore. The old hardware is gone, the ISA is dead, and the ecosystem moved on.

So I posed a side research question to Claude: What from SPARC's design philosophy is actually worth salvaging? And what does RISC-V already have that could carry those ideas forward? This post is the result of that research session. Claude helped me survey the RISC-V many-core landscape, pull together specs, summarize architectural details, and do the math on theoretical performance. I then wrote up what I found interesting and where I think the real opportunity is. The research legwork is AI-assisted, the opinions and the architectural instinct are mine.

This is going to be a long one. Grab a coffee.

## The Throughput Computing Thesis

In 2005, while Intel was chasing single-thread performance with ever-deeper out-of-order pipelines, Sun went the opposite direction. Their bet: **most server workloads are memory-latency-bound, not compute-bound.** Instead of making one thread fast, make many threads *always busy*.

The T1 had 8 cores with 4 hardware threads each (32 total). Each core was deliberately simple — a 6-stage in-order pipeline. When thread A stalls on a cache miss, the core instantly switches to thread B. Zero-cycle context switch, because all thread state lives in dedicated hardware registers.

The T2 doubled down: 8 cores, 8 threads each, 64 hardware threads. Added per-core FPUs, integrated crypto engines (AES, SHA, RSA in hardware), and dual 10GbE MACs on-die.

Here is the thing that blew my mind when I actually looked at the scheduling logic: this is **conceptually identical** to how GPU warp scheduling works. An NVIDIA SM has 32-thread warps; when one warp stalls on memory, it switches to another. SPARC T-series was doing the same thing, except each thread ran a fully independent instruction stream (MIMD) rather than lockstep SIMT. Every thread could branch independently, chase pointers through graphs, run different code. No warp divergence penalty.

## Why SPARC Lost (And Why It Doesn't Matter)

SPARC did not lose on architecture. It lost on ecosystem lock-in (x86 had all the software), single-thread expectations (most 2000s workloads were poorly parallelized), Oracle's mismanagement after the Sun acquisition, and economies of scale.

But what has changed since then:

- **Parallelism is mandatory now.** Games need 8+ threads. AI inference is embarrassingly parallel. The "most workloads are single-threaded" argument is dead.
- **ISA matters less.** Everything compiles from portable source. Apple proved you can switch architectures and the world follows. Rust does not care what ISA you target.
- **Memory bandwidth is THE bottleneck.** LLM inference is almost entirely memory-bandwidth-limited. This is exactly where SPARC's latency-hiding design excels.
- **The CPU-GPU split is painful.** PCIe transfers, synchronization, separate memory spaces, different programming models. The industry is spending enormous effort papering over a fundamentally broken architecture.

## The Unified Memory Argument

This is where things get really interesting for practical workloads. Every time data crosses the PCIe bus between CPU and discrete GPU, you pay a bandwidth tax (PCIe 5.0 x16 gives ~50 GB/s vs HBM3E's 3.35 TB/s — a 67x cliff), a latency tax (1-10 microseconds with DMA vs 30-100 nanoseconds for local memory), a synchronization tax, and a programming model tax (two languages, two toolchains, two sets of bugs).

### Where This Hurts: Thin-Client Compositors

Consider a thin-client compositor pipeline — something like a modern Wayland-based successor to SunRay that renders, encodes, compresses and streams frames to remote clients. This is the kind of thing I have been researching with Claude Code. Every frame does something like:

```
Wayland clients submit buffers
    → Compositor composites (CPU or GPU)
    → Frame capture (if GPU rendered: GPU→CPU copy!)
    → H.264/AV1 encode (if GPU encode: CPU→GPU copy!)
    → Compressed bitstream
    → zstd compress (CPU)
    → QUIC packetize + TLS encrypt (CPU)
    → Network transmit
```

With a discrete GPU, the render-to-encode path crosses PCIe **twice** per frame unless you carefully keep everything on the GPU side — which means your compositor logic also needs to run on the GPU, in a different programming model.

With true UMA, this becomes: everything reads and writes the same memory. Zero copies. One programming model. One address space. The entire pipeline is just functions passing references.

### Where This Hurts: Neuro-Symbolic AI

The other workload that got me thinking about this is neuro-symbolic AI. I have been experimenting with [akh-medu](https://github.com/Toasterson/akh-medu), a system that combines LLM inference with knowledge graph traversal and symbolic reasoning. The compute profile of this kind of workload is exactly where the CPU-GPU split hurts the most:

| Component | Compute Profile | GPU Fitness | Many-Core UMA Fitness |
|-----------|----------------|-------------|----------------------|
| LLM inference (attention) | Matrix multiply, bandwidth-bound | Excellent | Good (vector units + HBM) |
| Knowledge graph traversal | Pointer-chasing, irregular | **Terrible** | **Excellent** |
| SPARQL query execution | Branch-heavy, integer | **Terrible** | **Excellent** |
| Symbolic unification | Pattern matching, recursive | **Terrible** | **Excellent** |
| Result composition | Mix of all above | Requires PCIe round-trips | **Native — zero copy** |

On a discrete GPU, a neuro-symbolic query involves **four PCIe round-trips** — embedding on GPU, back to CPU for graph traversal (can not do irregular access on GPU), back to GPU for language generation, back to CPU for the final answer. At 5-10 microseconds each with DMA overhead, that is 20-40+ microseconds of pure waste per query.

On a many-core UMA chip, you just partition cores by task. LLM cores, graph cores, reasoning cores, all sharing the same HBM. Zero copies. Zero synchronization overhead. Functions call each other. It is just Rust.

The graph traversal is particularly interesting here. Graph databases are notoriously GPU-hostile because memory access patterns are irregular (follow pointer, read node, follow next pointer), each step depends on the previous one, and nodes are scattered across memory. These are exactly the patterns that hardware multithreading was designed for. When a core's thread 0 chases a pointer and misses cache, thread 1 immediately runs. Eight threads per core means 8 concurrent graph walks in flight, hiding all those cache misses.

### What Apple and NVIDIA Already Proved

Apple's M-series is the strongest existence proof that UMA works. M4 Ultra runs ~819 GB/s unified memory shared by CPU, GPU, Neural Engine, and media engines. Final Cut Pro on M-series beats discrete-GPU workstations costing 3x more precisely because the render-encode pipeline has zero copies.

NVIDIA conceded the point too. Grace Hopper connects CPU and GPU via NVLink-C2C at 900 GB/s with cache coherency. AMD's MI300A fuses CPU and GPU dies sharing the same HBM pool.

The industry is converging. The question is whether you can leapfrog to a cleaner architecture.

## The 2K-Core Architecture Sketch

So what would this actually look like? Here is where I let myself dream a little:

```
2,048 RISC-V cores @ 1.5-2.0 GHz
8 hardware threads per core = 16,384 hardware threads
Per-core: 256-bit RVV vector FPU (8x FP32/cycle)
Per-core: 8KB L1I + 8KB L1D (intentionally small)

Clustered into 128 tiles of 16 cores each
Per-tile: 512KB shared L2

Tiles connected via 2D mesh Network-on-Chip
Shared L3: 256MB (on-package HBM-backed)

Memory: 4-8 HBM3E stacks
Bandwidth: 2-4 TB/s
Capacity: 64-128 GB
UMA: every core sees the same physical address space
```

Theoretical FP32 throughput with 256-bit RVV and FMA: **~65 TFLOPS**. For reference, an NVIDIA H100 SXM does ~60 TFLOPS FP32 (but behind PCIe for CPU workloads), and Apple M4 Ultra GPU does ~27 TFLOPS (but with UMA). Our hypothetical gets competitive TFLOPS *with* UMA *and* fully general-purpose cores.

The 16,384 hardware threads are all fully independent MIMD — no divergence penalty. For irregular workloads (graph traversal, symbolic reasoning, protocol processing), effective thread utilization could be 3-5x higher than GPU despite fewer threads.

Why in-order cores? They are ~0.1mm² in 5nm versus ~1-2mm² for out-of-order. You fit 10-20x more per die. Power per thread is 5-10x lower. Latency is deterministic (important for real-time compositing and protocol deadlines). And the 8 hardware threads per core hide memory latency the same way GPU warps do.

## What to Take from SPARC, What to Leave

The valuable innovations from SPARC T-series are **microarchitectural, not ISA-level.** Fine-grained hardware multithreading, crossbar memory interconnect, zero-cycle thread switching — none of these are ISA-dependent. They port cleanly to RISC-V.

What to drop: Register windows (waste die area, no benefit with modern L1 caches), the SPARC ISA itself (RISC-V has better toolchains), SPARC VIS vectors (RVV 1.0 is strictly superior), and the GPL license (RISC-V's BSD license enables both FLOSS and commercial use).

The OpenSPARC T1 source is unfortunately no longer easily available online (thanks Oracle). But the architectural ideas live on in [OpenPiton](https://github.com/PrincetonUniversity/openpiton), which started with OpenSPARC T1 cores and now supports RISC-V. If you want to study how SPARC's thread scheduling and crossbar design worked and see it applied to modern silicon, that is your starting point.

## What You Can Hack On Today

This is not purely theoretical. The components exist in open source.

**FPGA Proof-of-Concept (~$2K-$10K):** Take a Xilinx Alveo U280 or U55C (HBM-equipped FPGA), pick an open RISC-V core ([CVA6](https://github.com/openhwgroup/cva6) from ETH Zurich or [Snitch](https://github.com/pulp-platform/snitch_cluster) which was designed for many-core), add hardware multithreading by duplicating the register file and PC 4-8 times with a thread scheduler. Then tile and replicate using [OpenPiton](https://github.com/PrincetonUniversity/openpiton) from Princeton — which started with OpenSPARC T1 cores and now supports RISC-V. OpenPiton is the real gem here. It provides the mesh interconnect, cache coherence, and memory controller integration all in one framework. Boot Linux or illumos on 16-64 cores and measure scaling behavior.

**Simulation at Scale:** [gem5](https://www.gem5.org/) can model thousands of RISC-V cores. [FireSim](https://fires.im/) from UC Berkeley runs on AWS F1 FPGA instances and can simulate hundreds of cores at near-real-time speeds.

**Ride Existing Silicon:** [Esperanto Technologies](https://www.esperanto.ai/) built a 1,088 RISC-V core chip (ET-SoC-1 on TSMC 7nm), founded by Dave Ditzel — former Sun chief SPARC architect. This is literally the spiritual successor to SPARC Niagara rebuilt on RISC-V. [Tenstorrent](https://tenstorrent.com/) under Jim Keller is building RISC-V many-core with mesh NoC and matrix units. [ETH Zurich's Occamy](https://github.com/pulp-platform/occamy) taped out 432 Snitch RISC-V cores in GlobalFoundries 12nm with open-source RTL.

**illumos Thread Scheduler:** illumos already has sophisticated thread scheduling (processor sets, lgroups, FSS scheduler) inherited from Solaris, which was tuned for SPARC T-series hardware threads. If someone builds RISC-V hardware with SPARC-style multithreading, illumos is arguably the best OS to run on it. The `cmt.c` and `pg.c` code already distinguishes hardware threads from cores from sockets. That is a head start nobody else has.

## So How Crazy Am I?

Look, I am not going to pretend I am going to tape out a 2,048-core chip in my garage. But I also do not think this is pure fantasy. The core ideas — throughput computing, hardware multithreading, unified memory — are validated. SPARC T-series proved the architecture works. Apple proved UMA wins for mixed workloads. Esperanto and ETH Zurich proved you can build many-core RISC-V and it actually boots. The pieces exist.

What I honestly do not know yet is whether the software side is tractable. Getting compilers to do the right thing for thousands of in-order cores is not a solved problem. OS scheduler support needs real work — though illumos has a head start there because Solaris was tuned for exactly this kind of hardware. And developer tooling for debugging 16,000 hardware threads... yeah, that is going to be interesting.

If someone wanted to actually pursue this, a realistic path could look like: study the OpenSPARC design decisions through OpenPiton, prototype some hardware multithreading on a RISC-V core on an FPGA, and benchmark workloads like the SunRay-style compositor pipeline or neuro-symbolic queries against a discrete GPU setup. See if the numbers back up the gut feeling. And honestly, keep watching what Esperanto and Tenstorrent ship. If their silicon lands and performs well, you might not need custom hardware at all. Just adapt the software stack.

But even if nobody builds this exact chip, I think the design direction matters. We keep bolting more heterogeneous accelerators onto systems and then spending half our engineering time on the glue between them. At some point it is worth asking: what if the cores were just good enough at everything that you did not need the split? Not the fastest at any one thing. But fast enough at all of them, in one address space, with one programming model.

Not a GPU killer. Not a CPU killer. Something in between that makes the distinction irrelevant for the workloads that actually need both.

If any of this makes you want to dig into [OpenPiton](https://github.com/PrincetonUniversity/openpiton) or start tinkering with [Snitch clusters](https://github.com/pulp-platform/snitch_cluster) — I would love to hear about it. And if you know people at Esperanto or Tenstorrent who want to talk about workload profiles for this kind of architecture, point them my way.

*A note on process: The workload analysis, detailed writeups, performance numbers, spec comparisons, and ecosystem survey in this post were compiled with help from Claude Code. I find AI is genuinely good for this kind of legwork — pulling together scattered specs, summarizing source code, doing back-of-envelope math, and writing up the detailed technical sections. The opinions and the conviction that this design philosophy deserves a second look are mine. As always, verify the numbers before betting hardware budgets on a blog post.*

Hope to talk to some folks on Socials and email.

-- Toasty
