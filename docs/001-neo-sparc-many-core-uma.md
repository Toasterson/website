# Spicy Idea #001: A Neo-SPARC Many-Core with Unified Memory

**Status:** Wild Speculation with Architectural Merit
**Spice Level:** 3/5 -- Habanero (not Carolina Reaper, but it'll make you sweat)
**Date:** 2026-03-29

---

## The Elevator Pitch

What if we took Sun's UltraSPARC T-series throughput-computing philosophy -- many simple in-order cores with hardware thread scheduling -- rebuilt it on open RISC-V silicon with modern vector extensions, slapped it on a unified memory architecture with HBM, and scaled it to 2,048-4,096 cores?

Not as a GPU replacement. Not as a general-purpose CPU. As something *in between* -- a **unified compute fabric** where your Wayland compositor, video encoder, compression engine, QUIC stack, and neuro-symbolic AI reasoning all run on the same ISA, the same cores, sharing the same memory, with zero copies and zero programming model splits.

This document lays out why this isn't as crazy as it sounds, where the real architectural merit lives, and how you could actually hack on this today with open-source silicon.

---

## Part 1: Why SPARC's Ghost Matters

### The Throughput Computing Thesis

In 2005, while Intel was chasing single-thread performance with ever-deeper out-of-order pipelines and branch predictors, Sun Microsystems went the opposite direction with UltraSPARC T1 (Niagara). Their bet: **most server workloads are memory-latency-bound, not compute-bound.** Instead of making one thread fast, make many threads *always busy*.

The T1 had 8 cores with 4 hardware threads each (32 total). Each core was deliberately simple -- a 6-stage in-order pipeline. When thread A stalls on a cache miss, the core instantly switches to thread B. Zero-cycle context switch, because all thread state lives in dedicated hardware registers (including SPARC's famous register windows).

The T2 doubled down: 8 cores, 8 threads each, 64 hardware threads. Added per-core FPUs, integrated crypto engines (AES, SHA, RSA in hardware), and dual 10GbE MACs on-die. Connected everything through a non-blocking crossbar switch to an 8-bank shared L2 cache.

This is **conceptually identical** to how GPU warp scheduling works. An NVIDIA SM has 32-thread warps; when one warp stalls on memory, it switches to another. SPARC T-series was doing the same thing, except each thread ran a fully independent instruction stream (MIMD) rather than lockstep SIMT. Every thread could branch independently, chase pointers through graphs, run different code. No warp divergence penalty.

### The T-Series Technical Specs

| Feature | T1 (2005) | T2 (2007) | Hypothetical Neo-SPARC |
|---------|-----------|-----------|----------------------|
| Cores | 8 | 8 | 2,048-4,096 |
| Threads/core | 4 | 8 | 4-8 |
| Total threads | 32 | 64 | 8,192-32,768 |
| Pipeline | 6-stage in-order | 8-stage in-order | 6-8 stage in-order |
| FPU | 1 shared(!) | 1 per core | Vector FPU per core |
| Interconnect | Crossbar | Crossbar | Hierarchical mesh NoC |
| L2 | 3MB shared, 4-bank | 4MB shared, 8-bank | 256MB+ (HBM-backed) |
| Memory | 2x DDR2 | 4x DDR2 | 4-8x HBM3E stacks |
| Special | -- | Crypto engines, 2x10GbE | RVV vectors, matrix units |

### Why SPARC Lost (And Why It Doesn't Matter)

SPARC didn't lose on architecture. It lost on:

1. **Ecosystem lock-in**: x86 had Windows and all the software. ISA mattered when recompilation was hard.
2. **Single-thread performance**: Most 2000s workloads were poorly parallelized. Intel's deep OoO pipelines won on the code people actually ran.
3. **Oracle's mismanagement**: Acquired Sun in 2010, milked SPARC for margin, killed the team in 2017.
4. **Economies of scale**: Intel amortized fab costs over millions of desktop+server chips. SPARC was server-only.
5. **Cloud shift**: AWS/GCP/Azure built on x86. SPARC had zero cloud presence.

**What's changed:**

- **Parallelism is mandatory now.** Games need 8+ threads. AI inference is embarrassingly parallel. The "most workloads are single-threaded" argument is dead.
- **ISA matters less.** Everything compiles from portable source. Apple proved you can switch architectures (x86 to ARM) and the world follows. Rust doesn't care what ISA you target.
- **Memory bandwidth is THE bottleneck.** LLM inference is almost entirely memory-bandwidth-limited. This is exactly where SPARC's latency-hiding design philosophy excels.
- **The CPU-GPU split is painful.** PCIe transfers, synchronization, separate memory spaces, different programming models, different languages (CUDA vs everything else). The industry is spending enormous effort papering over a fundamentally broken architecture.

---

## Part 2: The Unified Memory Argument

### The CPU-GPU Copy Tax Is Real

Every time data crosses the PCIe bus between CPU and discrete GPU, you pay:

- **Bandwidth tax**: PCIe 5.0 x16 gives ~50 GB/s bidirectional. HBM3E on an H100 gives 3.35 TB/s. That's a 67x bandwidth cliff at the bus boundary.
- **Latency tax**: PCIe round-trip is 1-10 microseconds with DMA setup. Local memory access is 30-100 nanoseconds.
- **Synchronization tax**: You need explicit fences, events, or stream synchronization to coordinate CPU and GPU work. This kills fine-grained interleaving.
- **Programming model tax**: You write CPU code in one language/paradigm and GPU code in another (CUDA, OpenCL, Vulkan compute). Two mental models, two toolchains, two sets of bugs.

### How This Hits WayRay's Pipeline

Consider the WayRay thin-client compositor pipeline -- every frame does this:

```
Wayland clients submit buffers
    --> Smithay compositor composites (CPU or GPU)
    --> Frame capture (if GPU rendered: GPU-->CPU copy!)
    --> H.264/AV1 encode (if GPU encode: CPU-->GPU copy!)
    --> Compressed bitstream
    --> zstd compress (CPU)
    --> QUIC packetize + TLS encrypt (CPU)
    --> Network transmit
```

With a discrete GPU, the render-to-encode path crosses PCIe **twice** per frame (once down, once up) unless you carefully keep everything on the GPU side -- which means your compositor logic also needs to run on the GPU, in a different programming model.

With true UMA, this becomes:

```
Wayland clients submit buffers (shared memory)
    --> Compositor composites (same memory)
    --> Encoder reads the composited frame (same memory, zero copy)
    --> Compressed bitstream lands in same memory
    --> zstd + QUIC + TLS read it directly (zero copy)
    --> DMA to NIC
```

**Zero copies. One programming model. One address space.** The entire pipeline is just Rust functions passing references.

### What Apple Proved

Apple's M-series is the strongest existence proof that UMA works:

- M4 Ultra: ~819 GB/s unified LPDDR5X bandwidth, shared by CPU, GPU, Neural Engine, and media engines.
- Final Cut Pro on M-series is faster than on discrete-GPU workstations costing 3x more, precisely because the render-encode pipeline has zero copies.
- M2/M4 Ultra runs 70B+ parameter LLMs at useful speeds because the full 192-256 GB memory pool is accessible to both CPU and GPU at native speed. No PCIe wall.

Apple proved UMA isn't a compromise -- for mixed workloads, it's architecturally superior.

### What NVIDIA Conceded

NVIDIA Grace Hopper connects a Grace CPU to an H100 GPU via NVLink-C2C at 900 GB/s with cache coherency. This is NVIDIA admitting the PCIe wall is a problem. They didn't go full UMA (GPU still has its own HBM), but they're bridging toward it.

AMD's MI300A fuses CPU and GPU dies sharing the same HBM pool. Even closer to true UMA.

The industry is converging. The question is whether you can leapfrog to a cleaner architecture.

---

## Part 3: The 2K-Core Architecture -- What Would This Actually Look Like?

### Design Sketch

```
                    Neo-SPARC / "SPARC-V" SoC
    ================================================

    2,048 RISC-V cores @ 1.5-2.0 GHz
    8 hardware threads per core = 16,384 hardware threads
    Per-core: 128-bit or 256-bit RVV vector FPU (4-8x FP32/cycle)
    Per-core: 8KB L1I + 8KB L1D (intentionally small)

    Clustered into 128 tiles of 16 cores each
    Per-tile: 512KB shared L2 (scratchpad-capable)

    Tiles connected via 2D mesh Network-on-Chip (NoC)
    Mesh provides ~10 TB/s aggregate bisection bandwidth

    Shared L3: 256MB (on-package HBM-backed)

    Memory: 4-8 HBM3E stacks
    Bandwidth: 2-4 TB/s
    Capacity: 64-128 GB
    UMA: every core sees the same physical address space

    On-die accelerators (optional):
    - Media encode/decode engines (H.264/AV1/VP9)
    - Crypto engines (AES-GCM, ChaCha20, SHA-256)
    - DMA engines for network I/O
```

### Theoretical Performance

**Integer throughput:**
- 2,048 cores x 2 GHz x 1 op/cycle = **4 TOPS** (integer)
- With 2-issue in-order: **8 TOPS**

**FP32 throughput (with 256-bit RVV):**
- 2,048 cores x 2 GHz x 8 FP32 ops/cycle = **32 TFLOPS**
- With FMA (fused multiply-add): **~65 TFLOPS**

**For reference:**
- NVIDIA H100 SXM: ~60 TFLOPS FP32 (but behind PCIe for CPU workloads)
- Apple M4 Ultra GPU: ~27 TFLOPS FP32 (but with UMA)
- Our hypothetical: **~65 TFLOPS FP32 with full UMA and general-purpose cores**

**Hardware thread count:**
- 16,384 hardware threads, each capable of running independent code
- An H100 has 262,144 CUDA threads but they run in 32-wide lockstep warps
- Our 16,384 threads are fully independent MIMD -- no divergence penalty
- For irregular workloads (graph traversal, symbolic reasoning, protocol processing), effective thread utilization could be 3-5x higher than GPU despite fewer threads

### Why In-Order Cores at This Scale

In-order cores are:
- **Small**: ~0.1mm2 in 5nm vs ~1-2mm2 for OoO cores. You fit 10-20x more per die.
- **Power-efficient**: No speculative execution, no reorder buffer, no branch prediction structures. Power per thread is 5-10x lower.
- **Deterministic latency**: Important for real-time compositing and network protocol deadlines.
- **Latency-tolerant via threading**: The 8 hardware threads per core hide memory latency the same way GPU warps do.

The tradeoff is single-thread performance. A single thread on this chip runs at maybe 1/5 the speed of a Zen 5 core. But you have 16,384 threads instead of 32-64. For throughput workloads, total work done per second per watt is what matters.

---

## Part 4: Do You Need Different Core Types?

### The Float/Integer Question

GPUs evolved from pixel pipelines -- their DNA is floating-point. CPUs evolved from business logic -- their DNA is integer. But this distinction is rapidly blurring:

**Modern GPUs do integer well:**
- NVIDIA Turing+ has independent INT32 datapaths running concurrently with FP32
- Tensor Cores handle INT8/INT4 for quantized inference
- But: irregular integer workloads (compression, crypto, protocol parsing) hit **warp divergence**, reducing real throughput to 10-30% of peak

**Modern CPUs do float well:**
- AVX-512 gives 16 FP32 ops per cycle per core
- Intel AMX does matrix multiply on CPU
- ARM SVE2 gives scalable vectors for float
- But: core count is limited to 64-128, so total FP throughput can't match GPU

**The convergence thesis:**
A homogeneous core with a good vector FPU and integer pipeline handles both. Not the absolute best at either, but eliminates the heterogeneous programming tax. For workloads that are 30% float and 70% integer (which describes most real-world server pipelines), you come out ahead because nothing sits idle.

### What About Matrix Multiply?

This is where pure homogeneous gets challenged. Dense matrix multiply (the core of LLM inference) benefits enormously from systolic arrays / tensor cores -- specialized hardware that's 10-50x more area-efficient than general-purpose FPUs for this one operation.

**Options:**
1. **Just use vector FPUs**: RVV can do matrix multiply via outer-product or dot-product sequences. Not as efficient per mm2 as tensor cores, but you have 2,048 of them. Competitive for inference, not for training.
2. **Add matrix extension tiles**: RISC-V has proposed matrix extensions. Add a small matrix unit per cluster (not per core). 128 matrix units across the chip, each doing 16x16 FMA per cycle.
3. **Dedicated matrix block**: One region of the die with tensor-core-style fixed function, like Apple's Neural Engine. Breaks pure homogeneity but keeps UMA.

For a WayRay + neuro-symbolic workload, option 1 or 2 is likely sufficient. You're doing inference, not training.

---

## Part 5: The Neuro-Symbolic Killer App

### Why This Architecture Is Tailor-Made for akh-medu

Neuro-symbolic AI combines:

| Component | Compute Profile | GPU Fitness | Many-Core UMA Fitness |
|-----------|----------------|-------------|----------------------|
| LLM inference (attention) | Matrix multiply, bandwidth-bound | Excellent | Good (vector units + HBM) |
| LLM decode (autoregressive) | Memory-bandwidth-bound | Bandwidth-limited | Equal (same HBM) |
| Knowledge graph traversal | Pointer-chasing, irregular | **Terrible** | **Excellent** |
| SPARQL query execution | Branch-heavy, integer | **Terrible** | **Excellent** |
| Symbolic unification | Pattern matching, recursive | **Terrible** | **Excellent** |
| Result composition | Mix of all above | Requires PCIe round-trips | **Native -- zero copy** |

On a discrete GPU, a neuro-symbolic query looks like:

```
CPU: Parse query
CPU-->GPU copy: Send embedding request
GPU: Compute embedding
GPU-->CPU copy: Return embedding
CPU: Traverse knowledge graph (can't do this on GPU -- irregular access)
CPU: Apply symbolic rules
CPU-->GPU copy: Send to LLM for natural language generation
GPU: Run LLM
GPU-->CPU copy: Return response
CPU: Compose final answer
```

That's **four PCIe round-trips** per query. At 5-10 microseconds each with DMA overhead, plus synchronization, you're adding 20-40+ microseconds of pure waste per query.

On our hypothetical UMA many-core:

```
Cores 0-511:    LLM matrix multiply (vector units, HBM bandwidth)
Cores 512-1023: Knowledge graph traversal (threading hides pointer-chase latency)
Cores 1024-1535: Symbolic reasoning engine (branch-heavy, independent threads)
Cores 1536-2047: WayRay compositor + encode + QUIC pipeline

All sharing the same HBM. Zero copies. Zero synchronization overhead.
Functions call each other. Data passes by reference.
It's just Rust.
```

The graph traversal component is particularly interesting. Graph databases are notoriously GPU-hostile because:
- Memory access patterns are irregular (follow pointer, read node, follow next pointer)
- Each traversal step depends on the previous (serial dependency chains)
- Nodes are scattered across memory (poor spatial locality, cache thrashing)

These are exactly the patterns that hardware multithreading was designed for. When core 512's thread 0 chases a pointer and misses cache, thread 1 immediately runs. Eight threads per core means you can have 8 concurrent graph walks in flight, hiding the latency of all those cache misses.

A GPU can't do this because all 32 threads in a warp would need to follow the *same* pointer (SIMT). They diverge immediately and serialize.

---

## Part 6: The Hacking Possibilities

### What You Can Actually Build Today

This isn't purely theoretical. The components exist in open source. Here's a realistic hacking roadmap from "weekend project" to "startup-grade prototype."

#### Level 1: FPGA Proof-of-Concept (Months, ~$2K-$10K)

**Hardware:** Xilinx Alveo U280 or U55C (HBM-equipped FPGA, ~$5K used)

**Base core:** Start with an existing open RISC-V core:
- **CVA6 (Ariane)** from ETH Zurich -- 6-stage in-order, Linux-capable, well-verified
- **Rocket** from UC Berkeley -- simple, proven, configurable
- **Snitch** from ETH Zurich -- tiny core designed for many-core, has FPU, proven in the Occamy 432-core tapeout

**Step 1: Add hardware multithreading to a single core.**
Take CVA6 or Snitch, duplicate the register file and PC 4-8 times, add a thread scheduler that round-robins or picks the oldest ready thread. This is a focused RTL project -- you're not designing a core from scratch, you're adding a barrel-processor wrapper. OpenSPARC T1's thread scheduling logic is open-source (GPL, but you're learning from it, not copying it).

**Step 2: Tile and replicate.**
Use an open NoC generator:
- **OpenPiton** (Princeton) -- literally designed for this, started with OpenSPARC T1 cores, now supports RISC-V. It provides the mesh interconnect, cache coherence protocol, and memory controller integration.
- **ESP** (Columbia) -- similar tile-based SoC generator with RISC-V support.

Instantiate 16-64 cores on the FPGA. Connect via mesh. Boot Linux (or illumos, if you're feeling adventurous).

**Step 3: Run your workloads.**
Port a minimal WayRay compositor pipeline (headless, software rendering, H.264 encode via x264, zstd, dummy QUIC). Benchmark against:
- Single beefy x86 core
- ARM cluster (e.g., Ampere Altra)
- GPU via PCIe (for the encode step)

Measure: frames/second, latency per frame, power consumption.

**Expected outcome:** At FPGA speeds (~100-200 MHz), absolute performance will be terrible. But you can measure *scaling behavior* and the UMA advantage. If 64 cores at 100 MHz shows favorable scaling curves, you have your architectural validation.

#### Level 2: Simulation at Scale (Months, Compute Cost)

**gem5 simulator:** The gold standard for computer architecture research. gem5 has RISC-V support and can model thousands of cores (slowly). You can simulate the full 2,048-core design with realistic memory hierarchy, measure cache behavior, bandwidth utilization, and thread scheduling effectiveness.

**FireSim:** FPGA-accelerated simulation from UC Berkeley. Runs on AWS F1 instances (FPGA cloud). Can simulate hundreds of RISC-V cores at near-real-time speeds. Better than gem5 for large-scale exploration.

**What to measure:**
- Memory bandwidth utilization efficiency (are 2K cores actually keeping HBM busy, or do they saturate?)
- Thread scheduling effectiveness (how much latency does 8-way threading actually hide for graph traversal workloads?)
- NoC congestion (does the mesh become a bottleneck before cores do?)
- Comparison with GPU for the mixed workload profile (not just one kernel, but the full pipeline)

#### Level 3: Chiplet Prototype (Years, $$$)

If levels 1 and 2 validate the concept:

**Route 1: Academic tapeout**
- TSMC/Samsung shuttle runs via Europractice, MOSIS, or the CHIPS Alliance
- A 64-128 core chiplet in 22nm or 12nm costs $200K-$1M on a shuttle
- Won't have HBM, but can demonstrate the core + NoC + thread scheduling

**Route 2: Ride Esperanto/Tenstorrent's coattails**
- If Esperanto's ET-SoC-1 (1,088 RISC-V cores) or Tenstorrent's RISC-V chips become available as dev platforms, you can benchmark your software stack on their silicon. The architecture is close enough to validate the thesis without custom silicon.
- Tenstorrent in particular is building RISC-V many-core with matrix units and mesh NoC -- very close to the spec described here.

**Route 3: Open-source ASIC via Google/Skywater**
- Google's open-source PDK and shuttle program (SKY130, GF180) enables free tapeouts. Resolution is low (130nm/180nm), so you'd only get 4-16 cores, but it's free and proves you can go from RTL to silicon.

#### Specific Hacking Projects

**1. OpenSPARC-to-RISC-V Thread Scheduler Port**

The most immediately valuable project. OpenSPARC T1's thread scheduling logic is ~2,000 lines of Verilog (`sparc/tlu/` in the OpenSPARC source tree). Study it, understand the fine-grained round-robin with stall detection, and reimplement the concept as a wrapper around a RISC-V core.

Key files to study in OpenSPARC T1:
- Thread selection unit (TSU)
- Trap logic unit (TLU) -- handles thread-level traps and scheduling
- The crossbar switch (CCX) -- how cores arbitrate for cache access

**Licensing note:** OpenSPARC is GPL v2. You can study the *ideas* freely. If you rewrite the implementation from scratch targeting a RISC-V core, you're in the clear. If you copy-paste Verilog, the result is GPL. For a FLOSS project this might be fine; for commercial use, rewrite.

**2. UMA Compositor Benchmark**

Build a benchmark that simulates the WayRay pipeline and measures the UMA advantage directly:

- Use an AMD APU (Ryzen 7 8845HS) or Apple M-series as a UMA baseline
- Compare against the same AMD/Intel CPU with a discrete NVIDIA GPU
- Workload: Render N Wayland surfaces -> composite -> H.264 encode -> zstd -> measure throughput and latency
- Vary N from 1 to 50 (thin-client server scenario)
- Plot the crossover point where PCIe becomes the bottleneck

This benchmark doesn't need custom silicon -- it validates the *motivation* for the architecture on existing hardware.

**3. Graph Traversal Microbenchmark: Many-Thread vs GPU**

Implement a knowledge graph traversal (BFS/DFS over a realistic RDF graph) on:
- x86 with 1, 8, 32, 128 threads (Threadripper/EPYC)
- GPU (CUDA, using Gunrock or similar graph library)
- RISC-V many-core in simulation (gem5 or FPGA)

Measure: traversals per second, latency per query, energy per query.

Hypothesis: GPU will win on simple BFS (regular pattern). Many-core will win on complex SPARQL-style queries with filters, optional paths, and property lookups (irregular pattern). The gap will widen as query complexity increases.

**4. illumos Thread Scheduler for Hardware MT**

illumos already has sophisticated thread scheduling (processor sets, lgroups, FSS scheduler) inherited from Solaris, which was tuned for SPARC T-series hardware threads. If someone builds RISC-V hardware with SPARC-style multithreading, illumos is arguably the best OS to run on it.

Hacking project: Study illumos's `cmt.c` and `pg.c` (processor group) code. Understand how it distinguishes hardware threads from cores from sockets. Prototype a RISC-V port that exposes the hardware thread topology to the scheduler.

**5. RISC-V RVV for Mixed Workloads**

Write a single Rust binary that does the full pipeline: software composite (integer blending) -> H.264 encode (integer + DCT) -> zstd compress (integer) -> AES-GCM encrypt (integer). Use RISC-V vector intrinsics (via `core::arch::riscv64`) to accelerate each stage.

Measure what fraction of the pipeline benefits from vector vs scalar, and what the ideal vector length would be for each stage. This directly informs the per-core vector unit width in the architecture spec.

---

## Part 7: OpenSPARC vs RISC-V -- The Honest Verdict

### What to Take from SPARC

The valuable innovations from SPARC T-series are **microarchitectural, not ISA-level:**

| SPARC Innovation | ISA-dependent? | Port to RISC-V? |
|-----------------|----------------|-----------------|
| Fine-grained hardware multithreading | No -- it's microarchitecture | Yes, straightforward |
| Crossbar/mesh memory interconnect | No -- it's physical design | Yes, OpenPiton already does this |
| In-order cores trading single-thread for throughput | No -- design choice | Yes, Snitch/Rocket are already this |
| Zero-cycle thread switching | No -- register file duplication | Yes, duplicate RISC-V register file |
| Per-core crypto engines | No -- can be custom extension | Yes, RISC-V Zbk* crypto extensions |
| Solaris/illumos thread-aware scheduling | Partially (thread topology) | Portable -- illumos already understands CMT |

### What NOT to Take from SPARC

| SPARC Feature | Verdict |
|---------------|---------|
| Register windows | **Drop it.** Was for fast function calls in an era without fast caches. Wastes die area, complicates context switch, no benefit with modern L1 caches. |
| The SPARC ISA itself | **Drop it.** RISC-V has better toolchains, ecosystem, and extensibility. |
| SPARC VIS (vector) | **Drop it.** RVV 1.0 is strictly superior -- scalable vector length, richer operations. |
| GPL license | **Avoid.** RISC-V's BSD license enables both FLOSS and commercial use. |
| OpenSPARC RTL | **Study, don't fork.** Learn from the thread scheduling and crossbar design. Rewrite from scratch on RISC-V. |

### The Ecosystem Gap

| Aspect | OpenSPARC | RISC-V |
|--------|-----------|--------|
| License | GPL v2 (copyleft) | BSD (permissive) |
| GCC support | Stale | First-class |
| LLVM support | Incomplete | First-class |
| Rust support | Barely | Tier 2 (improving) |
| OS support | illumos, legacy Linux | Linux, FreeBSD, illumos (WIP), everything |
| Vector extensions | SPARC VIS (ancient) | RVV 1.0 (modern, scalable) |
| Custom extensions | Possible but no framework | First-class mechanism (X/Z prefix) |
| Community | Essentially dead | Massive, funded, active |
| Tape-outs | None recent | Hundreds, including production silicon |
| Many-core implementations | OpenPiton (academic) | Esperanto, Tenstorrent, Occamy, Celerity, EPI |

RISC-V wins on every practical dimension. The only reason to touch OpenSPARC RTL is to study the thread scheduling microarchitecture.

---

## Part 8: Who's Already Building This?

You're not alone in this line of thinking. Several efforts are converging:

### Esperanto Technologies (ET-SoC-1)
- **1,088 RISC-V cores** (1,088 ET-Minion + 4 ET-Maxion) on TSMC 7nm
- Founded by **Dave Ditzel, former Sun Microsystems chief SPARC architect**
- Explicitly inspired by SPARC throughput-computing philosophy
- Target: AI inference at competitive performance-per-watt
- ET-Minion cores have custom vector/tensor extensions
- This is literally the spiritual successor to SPARC Niagara, rebuilt on RISC-V

### Tenstorrent (Jim Keller)
- RISC-V-based AI accelerator with many "Tensix" cores
- Each Tensix core contains 5 RISC-V processors (2 compute + 3 data movement)
- Mesh NoC interconnect
- Jim Keller (AMD Zen architect, Apple A-series, Tesla FSD) leading the design
- Closest to commercial viability of any RISC-V many-core

### ETH Zurich -- Occamy
- **432 RISC-V cores** (Snitch cores) fabricated in GlobalFoundries 12nm
- Demonstrated competitive HPC performance-per-watt
- Open-source RTL
- Academic proof that RISC-V many-core can tape out and work

### Princeton -- OpenPiton
- Started with **OpenSPARC T1 cores**, now also supports RISC-V (CVA6)
- Open-source many-core framework with mesh NoC and cache coherence
- The most direct bridge between SPARC many-core and RISC-V many-core
- Demonstrated 500M+ transistor designs on FPGAs
- **This is your starting point if you want to hack on this.**

### Cerebras WSE-3
- 900,000 cores on a wafer-scale chip
- Proves massive parallelism works for ML
- Not general-purpose, but validates the "many simple cores" thesis at extreme scale

---

## Part 9: What About CXL? Does It Make This Unnecessary?

CXL (Compute Express Link) 3.0/3.1 enables cache-coherent shared memory between discrete devices over PCIe 5.0/6.0 physical layer.

**CXL bandwidth:** ~64-128 GB/s (PCIe 5.0/6.0 x16)
**HBM3E bandwidth:** ~3+ TB/s
**Apple UMA bandwidth:** ~800 GB/s
**NVLink-C2C:** 900 GB/s

CXL is **25-50x slower** than on-die UMA or high-bandwidth chip-to-chip links. It solves the **memory capacity** problem (pool terabytes across a rack) but not the **memory bandwidth** problem.

For WayRay's frame pipeline (bandwidth-sensitive, latency-sensitive per-frame), CXL doesn't cut it. For akh-medu's graph traversal (latency-sensitive per-hop), CXL's 150-300ns access latency is 2-3x worse than local DRAM.

CXL is a complement, not an alternative. You might use CXL for capacity expansion (storing cold model weights, session state databases) while the hot path runs on the UMA many-core.

---

## Part 10: Feasibility Verdict

### How Wild Is This Really?

| Dimension | Assessment |
|-----------|-----------|
| Architectural soundness | **Proven.** SPARC T-series validated the thesis. Esperanto, Tenstorrent, and Occamy prove it works on RISC-V. |
| UMA advantage for mixed workloads | **Proven.** Apple M-series, AMD MI300A, and NVIDIA Grace Hopper all confirm UMA/near-UMA wins for mixed CPU+GPU pipelines. |
| Benefit for neuro-symbolic AI | **Strong theoretical case.** No silicon proof yet, but the compute profile analysis is clear: GPU-hostile workloads benefit from CPU-style cores with GPU-scale parallelism. |
| FPGA prototyping feasibility | **Realistic.** OpenPiton + RISC-V + HBM FPGA boards exist today. A 64-core prototype is a focused engineering project. |
| ASIC production | **Hard.** 2K+ cores in 5nm with HBM is a $300M+ tape-out. Needs serious funding. But smaller-scale (64-256 cores) on older nodes is accessible via shuttle programs. |
| Software ecosystem | **The real challenge.** Compiler optimization for 2K in-order cores, OS scheduler support, and developer tooling are multi-year efforts. illumos has a head start on the scheduler side. |

### The Realistic Path

1. **Study** OpenSPARC T1/T2 thread scheduling and crossbar microarchitecture
2. **Prototype** hardware multithreading on a RISC-V core (CVA6 or Snitch)
3. **Scale** to 16-64 cores using OpenPiton on an HBM-equipped FPGA
4. **Benchmark** against GPU for the WayRay pipeline and graph traversal workloads
5. **Publish** results. If the numbers work, this becomes a fundable research direction.
6. **Watch** Esperanto and Tenstorrent. If their silicon ships and performs, you may not need custom hardware -- just adapt your software stack.

### The Bottom Line

Your gut feeling about OpenSPARC having something to bring to the table is architecturally sound. The *something* is the **design philosophy** -- throughput computing via massive hardware threading with unified memory -- not the ISA or implementation. That philosophy is being reborn in RISC-V many-core designs right now.

The combination of WayRay (compositor + encode + compress + network) and akh-medu (LLM inference + graph traversal + symbolic reasoning) is one of the most natural workloads for this kind of architecture. Both involve mixed compute profiles that cross the CPU-GPU boundary repeatedly, and both suffer from the heterogeneous programming model split.

A 2,048-4,096 core RISC-V chip with SPARC-inspired hardware multithreading, RVV vector units, and HBM-backed UMA would be a genuine architectural contribution. Not a GPU killer. Not a CPU killer. Something new: a **unified throughput processor** that makes the CPU/GPU distinction irrelevant for the workloads that need both.

Spicy? Yes. Impossible? No. The ingredients are all on the shelf. Someone just needs to cook.

---

*Written from a research session combining architectural analysis, historical knowledge of SPARC T-series, survey of current RISC-V many-core efforts, and workload profiling of the WayRay thin-client compositor and neuro-symbolic AI pipelines. All performance numbers are theoretical projections or cited from public specifications -- no silicon was harmed in the making of this document.*
