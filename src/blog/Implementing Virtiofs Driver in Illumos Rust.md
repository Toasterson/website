---
title: Gemini DeepResearch document about a illumos Virtiofs driver in Rust
type: post
date: 2025-11-04
summary: A Gemini AI Generated Research Document about how to make a illumos Virtiofs driver in Rust
tags:
  - rust
  - illumos
  - virtiofs
  - kernel
  - driver
  - rust-kernel
  - rust-kernel-driver
  - rust-kernel-virtiofs 
layout: post.njk
---

# Prefix
In quite a few cases when I have a few specific questions about a topic, I find that a very specific guide has not been made by anyone for it. Like in this case where I wondered. So how actaually could you make a virtiofs driver for illumos in Rust. With Gemini DeepResearch mode I often found it made me such articles and that I enjoyed reading them. And since I enjoyed the read I figured other might aswell.

# **An Architectural and Implementation Blueprint for a virtiofs Kernel Driver in Rust on illumos**

## **Architectural Foundations: The virtiofs Device and FUSE Protocol**

This report provides a detailed architectural blueprint for the implementation of a VIRTIO Filesystem (virtiofs) kernel driver for the illumos operating system. The implementation is predicated on the use of the Rust programming language, introducing specific challenges and design patterns related to kernel-space programming, Foreign Function Interface (FFI) management, and operating system-specific integration.

### **Analysis of the VIRTIO v1.2 Specification**

The virtiofs device is a paravirtualized filesystem interface formally defined within the OASIS VIRTIO (Virtual I/O Device) 1.2 specification.1 The VIRTIO standard, in general, provides a "straightforward, efficient, standard and extensible mechanism for virtual devices".4 The virtiofs device, specifically, is designed to provide high-performance, local filesystem semantics for guest virtual machines to access a directory tree on the host.6  
The virtiofs device is identified by the VIRTIO Device ID 26\.9 Like all VIRTIO devices, it is transport-agnostic and can be exposed to the guest operating system over a virtual PCI bus 5 or via a Memory-Mapped I/O (MMIO) interface.10  
A critical architectural prerequisite for this project is the existing VIRTIO nexus framework within the illumos kernel, virtio(4D).11 This generic driver is not a device driver itself, but a nexus (bus) driver. Its documented purpose is to "provide a framework for other device drivers" and to manage "feature negotiation, virtqueue management, used and available rings, interrupts, and more".11  
Analysis of the illumos-gate source repository 12 confirms this structure; existing VIRTIO client drivers, such as vioblk.c for block devices 12 and vioif.c for network devices 12, are implemented as clients of this virtio(4D) framework.  
Therefore, the Rust virtiofs driver must not attempt to implement the raw PCI or MMIO transport-level logic. To do so would be redundant and architecturally incorrect, bypassing the established kernel framework. The correct design is to implement the Rust driver as a client of the virtio(4D) nexus. This significantly simplifies the project, abstracting away the low-level hardware interaction. The driver's FFI bridge will target the internal C-language API exposed by the virtio(4D) framework, not the lower-level DDI/DKI functions for PCI device management.

### **The FUSE-in-VIRTIO Protocol**

The fundamental design of virtiofs is the tunneling of the Linux FUSE (Filesystem in Userspace) protocol over the VIRTIO transport mechanism.7 This design dictates a specific set of roles:

* **Guest Driver (Our Rust Code):** Acts as the **FUSE client**.10  
* **Host-side Components (e.g., QEMU \+ virtiofsd):** Act as the **FUSE file system daemon**.6

The filesystem session is initiated by the driver, after VIRTIO initialization, by sending a FUSE\_INIT request message on one of the standard request virtqueues.10  
This architecture represents a "security inversion" from the traditional FUSE model. In a standard FUSE implementation (e.g., on Linux or FreeBSD) 17, the kernel driver is the trusted entity, and the userspace daemon that implements the filesystem logic is untrusted.6 In the virtiofs model, this is reversed: the guest kernel (and our driver) is the *untrusted client*.6 The host-side virtiofsd daemon is a hardened implementation that *must not trust the client*.6  
This security inversion has profound and beneficial implications for this project. The illumos driver is not responsible for complex filesystem logic, data integrity, or permission checks. That entire logical burden is offloaded to the host virtiofsd daemon.6 The driver's sole responsibility is to be a correct *protocol translator*, converting illumos VFS (Virtual File System) requests into FUSE protocol opcodes 20 and VIRTIO transport messages. This constrained responsibility and minimal attack surface make virtiofs an ideal candidate for a novel implementation in Rust, as the most complex and potentially unsafe logic is handled externally by the host.

### **Virtqueue Structure and Operation**

All communication between the driver (client) and the device (daemon) occurs via virtqueues.1 This is a standard VIRTIO mechanism based on shared memory rings. The driver places descriptors in an "available" ring for the device to consume and asynchronously processes "used" descriptors that the device writes back after completing a request.10  
The virtiofs specification defines a specific set of virtqueues 9:

* **Virtqueue 0:** hiprio (a high-priority request queue)  
* **Virtqueue 1:** notification queue  
* **Virtqueues 2..n:** request queues (standard FUSE requests)

The notification queue (vq 1\) exists only if the device offers, and the driver negotiates, the VIRTIO\_FS\_F\_NOTIFICATION feature bit.10 If this feature is active, the driver *must* populate this queue with empty buffers to receive asynchronous FUSE notify messages from the host, such as a "file changed" event.

### **The High-Priority Queue (hiprio)**

The hiprio queue is an essential mechanism designed to solve a fundamental semantic mismatch between FUSE and VIRTIO.

* **The Problem:** The standard FUSE interface (via /dev/fuse) allows a client to select which request to transfer, enabling prioritization of critical requests.8 VIRTIO virtqueues, however, are strictly FIFO (First-In, First-Out) structures.25  
* **The Deadlock:** This mismatch can lead to a kernel deadlock. For example, if a standard request queue (e.g., vq 2\) is full of large, slow FUSE\_READ operations, the VFS may need to reclaim a vnode. To do this, it must send a FUSE\_FORGET message. If this message is enqueued on the *same* full request queue, it will be stuck behind the data operations. The vnode will never be reclaimed, and the system will deadlock. A similar priority-inversion problem occurs with FUSE\_INTERRUPT (e.g., from a user pressing Ctrl+C).  
* **The Solution:** The hiprio queue (vq 0\) provides an out-of-band, high-priority channel specifically for these non-data-path critical messages.8 The driver *MUST* submit FUSE\_INTERRUPT, FUSE\_FORGET, and FUSE\_BATCH\_FORGET requests *only* on the hiprio queue.21

The Linux kernel's virtiofs driver implements its hiprio queue with a polling mechanism for responses, rather than relying on interrupts. This is justified by the specification, which notes these messages are "high importance and low bandwidth".21 This suggests that a complex, interrupt-driven state machine for this queue is unnecessary.  
Consequently, the Rust driver should be designed with two distinct request-processing pipelines:

1. An asynchronous, interrupt-driven, high-throughput pipeline for the main request queues (vq 2+).  
2. A simpler, potentially synchronous or polling-based pipeline for the hiprio queue (vq 0). This isolates the critical cache-management and cancellation logic from the bulk data path, simplifying the implementation of both.

## **The Target Environment: illumos DDI/DKI and VFS**

The Rust driver must integrate natively with the illumos kernel, satisfying the interfaces defined by the DDI/DKI (Device Driver Interface / Driver-Kernel Interface) and the VFS.

### **The illumos Driver Lifecycle (DDI/DKI)**

The illumos DDI/DKI provides a set of stable, long-term kernel ABIs.26 This stability is what makes out-of-tree driver development feasible, as a driver written against the DDI/DKI will continue to function across kernel updates.29  
As a loadable kernel module, the driver must export three standard C-linkage symbols 31:

1. \_init(void): Called when the module is loaded. Its primary responsibility is to call mod\_install(9F).33  
2. \_fini(void): Called when the module is to be unloaded. It must call mod\_remove(9F).33  
3. \_info(struct modinfo \*): Called by the system to retrieve information about the module.31

These functions are bundled into a struct modlinkage.34 For a device driver, this modlinkage structure points to a struct modldrv, which in turn contains a struct dev\_ops holding the driver's autoconfiguration entry points.

### **Device Discovery and Attachment**

As established, the virtiofs driver will be a client of the virtio(4D) nexus. The dev\_ops structure will define the driver's implementation of the DDI autoconfiguration routines, most importantly the attach(9E) entry point.35  
When the virtio(4D) nexus driver probes a VIRTIO device and identifies it as a virtiofs device (ID 26), it will invoke this driver's attach function. This function receives a dev\_info\_t \*dip (device info pointer).35 This dip is the opaque handle that the Rust FFI layer will use for all subsequent interactions with the DDI, and specifically with the virtio(4D) framework.  
The implementation will require careful analysis of the attach routines in the C-based vioblk.c 13 and vioif.c 14 drivers within the illumos-gate repository. This analysis will reveal the *exact* internal virtio(4D) API functions (e.g., virtio\_queue\_setup, virtio\_feature\_negotiate) that must be bound via FFI to initialize the device.

### **VFS Integration**

In parallel with its role as a device driver, the module must also register itself as a new filesystem type with the VFS.

* **vfs\_switch Table:** The driver must define a static struct vfssw (VFS switch table).36 This C structure contains function pointers for VFS-level operations, most notably vsw\_mount, and a string name for the filesystem type (e.g., "virtiofs").  
* **Registration:** During the \_init routine, after mod\_install succeeds, the driver must call vfs\_add(9F) 36, passing a pointer to its vfssw struct. This kernel-wide registration is what enables the mount(2) system call, and thus the mount(8) command, to recognize "virtiofs" as a valid filesystem type.15

### **The vnodeops Interface: VFS-to-FUSE Translation**

This is the logical core of the driver. The VFS performs all operations on files and directories through vnode (virtual node) objects.37 Every vnode contains a v\_op function vector, which points to a struct vnodeops.39 The virtiofs driver must provide a complete implementation of this vnodeops structure.  
This implementation will consist of a table of Rust functions exposed with a C ABI. Each function will be a translator: it will receive VFS arguments (e.g., a uio(9S) structure for a read), translate them into the corresponding FUSE request message, dispatch that message on a request virtqueue, and then block until a response is received from the host.  
This VFS-to-FUSE translation is a solved problem and should not be re-engineered from first principles. The implementation must draw from two primary reference sources:

1. **illumos-fusefs:** This existing FUSE driver for illumos 42 contains the C-language fuse\_vfs.c and fuse\_vnode.c.44 These files provide the *exact* logic for translating illumos vnodeops into FUSE opcodes. This is the primary reference for the illumos VFS side of the bridge.  
2. **Linux virtiofs Driver:** The Linux kernel's virtiofs driver 8 and its source code (e.g., fs/fuse/virtio\_fs.c 47) provide the reference model for integrating FUSE client logic with the VIRTIO transport.

The following table defines the primary translation work-list, mapping illumos vnodeops to their virtiofs FUSE opcode counterparts.

| illumos vnodeops (VOP\_\*) | FUSE Opcode | Description & Implementation Notes |
| :---- | :---- | :---- |
| VOP\_LOOKUP | FUSE\_LOOKUP | Translate a pathname component to a vnode. Core path-walking operation. |
| VOP\_CREATE | FUSE\_CREATE | Create a new file. |
| VOP\_OPEN | FUSE\_OPEN | Open a file. Must receive a file handle (fh) from the host for use in subsequent I/O. |
| VOP\_CLOSE | FUSE\_RELEASE | Close a file. This operation precedes VOP\_INACTIVE. |
| VOP\_READ | FUSE\_READ | Read data. Translates the uio(9S) structure into a FUSE\_READ request. |
| VOP\_WRITE | FUSE\_WRITE | Write data. Translates the uio(9S) structure into a FUSE\_WRITE request. |
| VOP\_GETATTR | FUSE\_GETATTR | Get file attributes (e.g., for stat(2)). |
| VOP\_SETATTR | FUSE\_SETATTR | Set file attributes (e.g., for chmod(2), chown(2)). |
| VOP\_READDIR | FUSE\_READDIR | Read directory entries. |
| VOP\_MKDIR | FUSE\_MKDIR | Create a new directory. |
| VOP\_RMDIR | FUSE\_RMDIR | Remove a directory. |
| VOP\_REMOVE | FUSE\_UNLINK | Remove (unlink) a file. |
| VOP\_RENAME | FUSE\_RENAME | Rename a file or directory. |
| VOP\_FSYNC | FUSE\_FSYNC | Synchronize file data and metadata. |
| VOP\_INACTIVE | FUSE\_FORGET | Called by VFS when a vnode's reference count drops to zero. This *must* send a FUSE\_FORGET on the **hiprio** queue.21 |
| VOP\_MAP / segmap(9E) | FUSE\_SETUPMAPPING | (Advanced) Implements mmap(2) for DAX support.\[48, 49\] See Section 5.1. |

## **The Rust-in-Kernel Bridge: FFI and no\_std Implementation**

The primary challenge of this project is the use of Rust for kernel-space development. This requires a no\_std environment and a meticulously crafted FFI bridge.

### **The no\_std Kernel Environment**

The Rust standard library (std) cannot be used in kernel space, as it relies on OS-provided services (e.g., userspace memory allocation, threads) that are not available.50

* **Crate Structure:** The driver will be a Rust crate built with the \#\!\[no\_std\] attribute and a crate-type of \["cdylib", "rlib"\]. It will depend on the core library (for Rust primitives) and the alloc library (for dynamic memory structures like Box and Vec).  
* **Global Allocator:** The alloc crate requires a global allocator to be defined. The driver must provide an implementation of the GlobalAlloc trait that wraps the illumos kernel memory allocator: kmem\_alloc(9F).53

This allocator presents a significant and subtle safety challenge. The kmem\_alloc(9F) API is *context-dependent*, controlled by its flag parameter.53

* KM\_SLEEP: The call is allowed to block (sleep) if memory is not immediately available. This is safe to use from kernel thread context (e.g., a vnodeop entry point) but will panic the system if called from interrupt context.  
* KM\_NOSLEEP: The call must not block. It will return NULL if memory is not available. This is the *only* flag allowed in high-level interrupt context.53

The Rust GlobalAlloc trait is synchronous and has no concept of execution context. A naive implementation (e.g., one that *always* calls kmem\_alloc with KM\_SLEEP) will be unsafe and will panic the system if *any* part of the driver (e.g., an interrupt-handler callback) attempts to allocate memory. Conversely, a KM\_NOSLEEP-only allocator would be highly inefficient and prone to failure.  
This means a naive, global allocator is unusable. The driver's Rust code must be *explicitly* aware of its execution context. Standard Rust collections (e.g., Box, Vec, String) which rely on the GlobalAlloc can only be safely used from "thread context" (e.g., vnodeops, attach, taskq workers). Code running in "interrupt context" (e.g., the virtqueue "bottom half" handler) must be written to *not allocate* or to use a special, non-default KM\_NOSLEEP-based allocator. This is a fundamental design constraint for ensuring memory safety.

### **Creating the DDI/DKI FFI Layer**

A safe, idiomatic Rust driver must be built upon a set of unsafe FFI bindings to the illumos kernel.

* **bindgen:** The rust-bindgen tool 54 will be used to generate raw Rust bindings from the primary DDI/DKI C headers: \<sys/ddi.h\> 56, \<sys/sunddi.h\>, \<sys/modctl.h\> 33, \<sys/kmem.h\> 53, \<sys/vnode.h\> 57, \<sys/vfs.h\>, and the internal virtio.h header from the illumos-gate source.  
* **\#\[repr(C)\] Structs:** All C structs that are passed across the FFI boundary must be mirrored in Rust using the \#\[repr(C)\] attribute.58 This includes the top-level modlinkage 34, cb\_ops 60, vfssw 36, and vnodeops 41 structures. This requirement is recursive; any nested struct must also be \#\[repr(C)\].61

It is important to note that the existing illumos/rust-illumos crate 62 is intended for *userspace* development. Its dependent crates, such as doors 64, kstat-rs 65, and zone 66, wrap userspace libraries (libdoor, libkstat, etc.), not kernel-space DDI/DKI functions.  
The correct precedent for this project is the work done by Oxide Computer.30 Oxide's propolis VMM 67 contains internal crates, bhyve-api and viona-api 68, which are *exactly* what this project requires: no\_std Rust FFI bindings for illumos kernel ioctls and C data structures. The FFI layer for the virtiofs driver should be architected following this pattern.

### **The FFI Binding Crate Plan**

To manage complexity and promote safety, the raw unsafe bindings should be organized into logical Rust modules, which will then expose a safer, more idiomatic API to the main driver logic.

| Internal FFI Module | C Headers to Bind | Key Functions/Structs to Wrap | Purpose |
| :---- | :---- | :---- | :---- |
| illumos\_ffi::kmem | \<sys/kmem.h\> | kmem\_alloc, kmem\_free 53 | Foundation for the context-aware GlobalAlloc implementation. |
| illumos\_ffi::mod | \<sys/modctl.h\> | mod\_install, mod\_remove, mod\_info, modlinkage, modldrv 33 | Module lifecycle (\_init, \_fini) and DDI registration.\[31\] |
| illumos\_ffi::ddi | \<sys/ddi.h\>, \<sys/sunddi.h\> | dev\_info\_t, dev\_ops, cb\_ops 60, attach(9E) 35, segmap(9E) \[49\], ddi\_devmap\_segmap 69 | Core DDI/DKI framework for device attachment and resource mapping. |
| illumos\_ffi::virtio | uts/common/io/virtio/virtio.h (from gate) | virtio\_devi\_t, virtio\_queue\_setup, virtio\_queue\_notify, virtio\_dma\_alloc | The *essential* API from the virtio(4D) nexus driver.11 |
| illumos\_ffi::vfs | \<sys/vfs.h\>, \<sys/vnode.h\> | vfs\_add, vfssw 36, vnodeops 41, vnode\_t, VOP\_\* macros | The VFS/vnode subsystem interface for filesystem registration. |
| illumos\_ffi::sync | \<sys/mutex.h\>, \<sys/condvar.h\> | mutex\_t, kcondvar\_t, mutex\_enter, cv\_wait, cv\_signal | Kernel synchronization primitives for blocking and I/O coordination. |
| illumos\_ffi::taskq | \<sys/taskq.h\> | taskq\_t, taskq\_dispatch | illumos-native workqueue for deferring work from interrupt context. |

## **Implementation Blueprint: A virtiofs Driver in Rust**

This implementation plan synthesizes the VIRTIO contract, the illumos DDI/VFS interfaces, and the Rust FFI bridge into a cohesive, phased driver implementation.

### **Phase 1: Driver Loading and VIRTIO Initialization (Rust attach)**

1. **\_init:** The driver's lib.rs will export a \#\[no\_mangle\] pub extern "C" function named \_init.  
2. **mod\_install:** This \_init function will, via FFI, call mod\_install with a pointer to a \#\[repr(C)\] static modldrv struct. This struct will point to the driver's dev\_ops.  
3. **vfs\_add:** The \_init function will also call vfs\_add with a pointer to a \#\[repr(C)\] static vfssw struct, registering "virtiofs" as a filesystem.  
4. attach: The kernel will invoke the attach function (also \#\[no\_mangle\] pub extern "C") defined in the dev\_ops. This Rust function will:  
   a. Receive the dev\_info\_t\* dip.  
   b. Use this dip to call into the illumos\_ffi::virtio wrapper.  
   c. The wrapper's unsafe Rust code will call the C virtio(4D) framework functions to perform feature negotiation. It will assert that the host offers VIRTIO\_F\_VERSION\_1 and request critical features like VIRTIO\_FS\_F\_NOTIFICATION.10  
   d. It will then initialize all required virtqueues (hiprio, notification, and one or more request queues) using the virtio\_queue\_setup FFI function.  
   e. Upon success, it will instantiate the primary VirtioFsDriver Rust struct, populate it with the virtqueue handles and device state, and store it as the driver's private data.

### **Phase 2: VFS Mounting and FUSE Session (Rust vsw\_mount)**

1. A user process executes mount \-t virtiofs....15  
2. The kernel VFS layer follows the vfssw pointer and invokes the driver's vsw\_mount Rust function.  
3. This function is responsible for initiating the FUSE session by sending the FUSE\_INIT message.10  
4. It constructs the FUSE\_INIT request, allocates a DMA-capable buffer using a wrapped virtio\_dma\_alloc or similar function from the virtio(4D) API, and places it on request vq 2\.  
5. It notifies the device via virtio\_queue\_notify and then *blocks*.  
6. The block will be implemented by an FFI call to cv\_wait on a kcondvar\_t specific to this FUSE\_INIT request.  
7. The interrupt handler (Phase 3\) will process the FUSE\_INIT response and call cv\_signal to wake this thread.  
8. The vsw\_mount function wakes up, validates the FUSE\_INIT reply, creates the root vnode for the new filesystem, and returns success to the VFS.

### **Phase 3: The vnodeops Request-Response Engine (Rust VOP\_READ)**

This is the steady-state operation of the driver. VOP\_READ is used as the canonical example for all I/O vnodeops.

1. A user process calls read(2) on a virtiofs file. The kernel traces this call through the vnode's v\_op vector to the driver's vop\_read Rust function.  
2. Request State: The vop\_read function (running in kernel thread context) executes:  
   a. It generates a unique, 64-bit request ID.  
   b. It creates a "waiter" struct. This struct contains a kcondvar\_t, a pointer to the response buffer, and a status field.  
   c. It inserts this waiter struct into a global, concurrent hash map (e.g., DashMap or a Mutex-guarded HashMap) keyed by the request ID.  
   d. It serializes the FUSE\_READ request, acquires a virtqueue descriptor, and enqueues the request on a request virtqueue.  
   e. It calls virtio\_queue\_notify.  
   f. It calls cv\_wait (via FFI) on the kcondvar\_t inside its waiter struct, putting the user thread to sleep.  
3. The Interrupt Handler (Bottom Half):  
   a. The host virtiofsd processes the request, places the response (the file data) in the used ring, and raises a virtual interrupt.22  
   b. The illumos virtio(4D) framework routes this to the driver's registered interrupt handler—a Rust function.  
   c. This handler executes in high-priority interrupt context. It must not sleep or perform KM\_SLEEP allocations.53  
4. The Interrupt-to-Taskq Pipeline:  
   a. The interrupt handler's only job is to iterate the "used" ring, find the response descriptor, and extract the request ID from it.  
   b. It must not perform the hash map lookup or cv\_signal itself, as these operations are too complex and may block (on a mutex) for an interrupt context.  
   c. Instead, the handler dispatches a "work item" (containing the response buffer and its request ID) to a kernel taskq(9F). This is done via a taskq\_dispatch FFI call, which safely defers the work to a lower-priority kernel thread.  
5. The taskq Worker (Middle Half):  
   a. A generic kernel worker thread (in a safe, sleep-able context) picks up the work item.  
   b. This Rust function (the taskq callback) performs the hash map lookup using the request ID.  
   c. It finds the corresponding "waiter" struct, copies the response data into the waiter's buffer, and sets the status to "success."  
   d. It calls cv\_signal (via FFI) on the waiter's kcondvar\_t.  
6. VOP\_READ Completion:  
   a. Back in the vop\_read function, the cv\_wait call returns. The thread is now awake.  
   b. It sees the status is "success" and its response buffer is populated.  
   c. It uses an FFI call to uiomove to copy the data from the kernel response buffer into the user-space uio\_t provided by the VFS.  
   d. It removes the waiter from the DashMap and returns 0 (success) to the VFS.

## **Advanced Feature Implementation and Strategic Recommendations**

### **Implementing DAX: The segmap Entry Point**

The virtiofs Direct Access (DAX) feature is its primary performance advantage.6 It allows a guest to mmap(2) a file and map its contents *directly* from the host's page cache, eliminating the guest page cache and all FUSE\_READ message overhead.71  
This requires a highly specific implementation in illumos, bridging the VFS mmap path with the DDI device-mapping path.

1. **The DAX Window:** The virtiofs device exposes the DAX-capable memory as a shared memory region, typically a PCI BAR.6  
2. **The illumos API:** The DDI/DKI entry point for mapping device memory (like a PCI BAR) into a user process's address space is segmap(9E).49  
3. **The Protocol:** The Linux virtiofs driver (which pioneered DAX) extended the FUSE protocol with FUSE\_SETUPMAPPING and FUSE\_REMOVEMAPPING opcodes.48 The illumos driver must implement this part of the protocol.

**Implementation Blueprint:**

1. The driver's dev\_ops structure will point to a cb\_ops (char/block ops) structure 60, which will provide a function pointer for the segmap entry point.  
2. A user process calls mmap(2) 75 on a virtiofs file.  
3. The VFS determines this is a device-mapped file and calls the driver's segmap Rust function.  
4. This segmap function (like vop\_read) sends a FUSE\_SETUPMAPPING request on a request virtqueue and blocks, awaiting the response.  
5. The host virtiofsd performs the mapping on its side and returns a reply containing the *offset* and *length* of the file's data *within the DAX Window (PCI BAR)*.6  
6. The segmap function's interrupt/taskq handler populates the response. The segmap thread wakes up.  
7. Now holding the device-relative offset and length, the segmap function makes a final FFI call to ddi\_devmap\_segmap(9F) 69 or devmap\_setup(9F).73  
8. This DDI function performs the final, critical step: it takes the physical address (PCI BAR base \+ DAX offset) and instructs the kernel to map those physical pages directly into the user process's address space (struct as\*).  
9. The mmap(2) call returns a pointer to the user. Subsequent memory access to that pointer goes directly to the host's memory, requiring zero driver intervention or VM exits.

### **Build and Test Strategy**

This driver cannot be built with a simple cargo build. It must be integrated into the illumos-gate build system.  
The only proven model for building Rust kernel modules for illumos is the one pioneered by Oxide Computer.30 cargo is not the primary build tool; it is a *subprocess* invoked by make.

1. **Build System:** The illumos-gate Makefile system 78 will be modified.  
2. **Rust Compilation:** A Makefile rule will be added to invoke cargo build \--release on the Rust crate, configured to produce a *static library* (e.g., libvirtiofs.a).  
3. **C Stub:** A minimal C stub file (virtiofs\_mod.c) will be created. This file will contain *only* the modlinkage boilerplate 34 and will reference the external Rust functions (e.g., virtiofs\_attach, virtiofs\_vop\_read, etc.).  
4. **Linking:** The illumos build system's linker 79 will be invoked to link the compiled C stub object (virtiofs\_mod.o) against the Rust static library (libvirtiofs.a) to produce the final virtiofs loadable kernel module.

**Testing and Debugging:**

1. **Host Environment:** A QEMU 80 or bhyve 67 VM must be configured to run an illumos guest. The hypervisor must be configured to pass through a virtio-fs device and run the virtiofsd daemon on the host, sharing a directory.7  
2. **Guest Environment:** The compiled virtiofs module must be loaded into the guest kernel, e.g., via add\_drv(1M).83  
3. **Debugging:** The primary illumos debugging tools, mdb(1) (Modular Debugger) 84 and DTrace, will be essential. mdb \-K 85 allows for live debugging of the kernel. For initial driver loading, QEMU's GDB stub (-s \-S) 86 can be used to connect GDB at boot and step through the \_init and attach routines.

## **Conclusions and Recommendations**

The implementation of a virtiofs kernel driver in Rust for illumos is a complex but highly feasible and valuable project. The core complexity is not in the virtiofs protocol itself (which is a straightforward translation task), but rather in the creation of a safe, robust, and context-aware FFI bridge between the Rust no\_std environment and the illumos DDI/DKI.  
**Key Recommendations:**

1. **Adopt the Oxide Precedent:** The project *must* use the work from Oxide Computer (e.g., propolis, helios, and their networking stack drivers) as the primary and foundational reference.30 Their solutions for FFI, no\_std builds, and C-stub-plus-Rust-archive linking 30 are the only proven models for this environment.  
2. **Build a HAL, Not Just a Driver:** The project should be architecturally partitioned. The primary deliverable is not just the virtiofs driver, but a reusable "illumos-hal" crate.  
   * **illumos\_ffi crate:** An unsafe crate containing raw, bindgen-generated bindings.  
   * **illumos\_hal crate:** A safe, idiomatic, no\_std Rust crate that wraps the FFI layer. It would provide safe abstractions for kernel-space Mutex, Condvar, Taskq, and a context-aware kmem\_alloc API.  
   * **virtiofs\_driver crate:** The virtiofs driver itself, written in pure, safe Rust against the illumos\_hal API.  
3. **Prioritize FFI and Concurrency:** The most difficult design challenges are the context-aware kmem\_alloc wrapper (Insight 3.1.1) and the interrupt-to-taskq request-response pipeline (Insight 4.3.2). These concurrency and safety primitives must be designed and validated *before* FUSE logic is written.  
4. **Reference C Implementations:** The logic for the VFS-to-FUSE translation *must* be ported from the existing illumos-fusefs C implementation 42 to ensure illumos-specific VFS semantics are preserved. The logic for the FUSE-to-VIRTIO transport *must* be ported from the Linux kernel virtiofs driver 47 to ensure protocol-level correctness.

By correctly leveraging the existing virtio(4D) nexus and the security-inversion model of FUSE, the driver's logic is simplified to that of a protocol translator. This bounded scope, combined with the memory safety guarantees of Rust, makes this an ideal project for demonstrating and hardening the use of Rust for kernel-space development on illumos.

#### **Works cited**

1. Virtio 1.2 is Coming\! \- Alibaba Cloud Community, accessed on November 4, 2025, [https://www.alibabacloud.com/blog/virtio-1-2-is-coming\_599615](https://www.alibabacloud.com/blog/virtio-1-2-is-coming_599615)  
2. VIRTIO 1.2 is out\! · KVM, QEMU, and more \- Red Hat People, accessed on November 4, 2025, [https://people.redhat.com/\~cohuck/2022/07/18/virtio-12-is-out.html](https://people.redhat.com/~cohuck/2022/07/18/virtio-12-is-out.html)  
3. What's coming in VIRTIO 1.2 \- Stefan Hajnoczi, accessed on November 4, 2025, [https://vmsplice.net/\~stefan/stefanha-fosdem-2022.pdf](https://vmsplice.net/~stefan/stefanha-fosdem-2022.pdf)  
4. oasis-tcs/virtio-docs: OASIS Virtual I/O Device TC: Development of formatted documents for the VIRTIO (Virtual I/O) Specification maintained by the OASIS VIRTIO Technical Committee \- GitHub, accessed on November 4, 2025, [https://github.com/oasis-tcs/virtio-docs](https://github.com/oasis-tcs/virtio-docs)  
5. oasis-tcs/virtio-spec: OASIS Virtual I/O Device TC \- GitHub, accessed on November 4, 2025, [https://github.com/oasis-tcs/virtio-spec](https://github.com/oasis-tcs/virtio-spec)  
6. Virtiofs Design Document, accessed on November 4, 2025, [https://virtio-fs.gitlab.io/design.html](https://virtio-fs.gitlab.io/design.html)  
7. Virtio-FS, accessed on November 4, 2025, [https://virtio-fs.gitlab.io/](https://virtio-fs.gitlab.io/)  
8. virtiofs: virtio-fs host\<-\>guest shared file system \- The Linux Kernel documentation, accessed on November 4, 2025, [https://docs.kernel.org/filesystems/virtiofs.html](https://docs.kernel.org/filesystems/virtiofs.html)  
9. Virtual I/O Device (VIRTIO) Version 1.2 \- OASIS Open, accessed on November 4, 2025, [https://docs.oasis-open.org/virtio/virtio/v1.2/csd01/virtio-v1.2-csd01.html](https://docs.oasis-open.org/virtio/virtio/v1.2/csd01/virtio-v1.2-csd01.html)  
10. Virtual I/O Device (VIRTIO) Version 1.2 \- Index of / \- OASIS Open, accessed on November 4, 2025, [https://docs.oasis-open.org/virtio/virtio/v1.2/cs01/virtio-v1.2-cs01.pdf](https://docs.oasis-open.org/virtio/virtio/v1.2/cs01/virtio-v1.2-cs01.pdf)  
11. illumos: manual page: virtio.4d \- SmartOS, accessed on November 4, 2025, [https://smartos.org/man/4D/virtio](https://smartos.org/man/4D/virtio)  
12. Illumos-gate \- GitHub, accessed on November 4, 2025, [https://github.com/illumos/illumos-gate](https://github.com/illumos/illumos-gate)  
13. illumos-gate \- Niksula, accessed on November 4, 2025, [https://www.niksula.hut.fi/\~ltirkkon/webrev/4330/](https://www.niksula.hut.fi/~ltirkkon/webrev/4330/)  
14. Package Catalogue \- OmniOS, accessed on November 4, 2025, [https://pkg.omniosce.org/r151022/core/en/catalog.shtml](https://pkg.omniosce.org/r151022/core/en/catalog.shtml)  
15. virtio-fs \- Stefan Hajnoczi, accessed on November 4, 2025, [https://vmsplice.net/\~stefan/virtio-fs\_%20A%20Shared%20File%20System%20for%20Virtual%20Machines%20%28FOSDEM%29.pdf](https://vmsplice.net/~stefan/virtio-fs_%20A%20Shared%20File%20System%20for%20Virtual%20Machines%20%28FOSDEM%29.pdf)  
16. virtiofs: virtio-fs host\<-\>guest shared file system \- The Linux Kernel Archives, accessed on November 4, 2025, [https://www.kernel.org/doc/html/v5.14/filesystems/virtiofs.html](https://www.kernel.org/doc/html/v5.14/filesystems/virtiofs.html)  
17. libfuse/libfuse: The reference implementation of the Linux FUSE (Filesystem in Userspace) interface \- GitHub, accessed on November 4, 2025, [https://github.com/libfuse/libfuse](https://github.com/libfuse/libfuse)  
18. Filesystem in Userspace \- Wikipedia, accessed on November 4, 2025, [https://en.wikipedia.org/wiki/Filesystem\_in\_Userspace](https://en.wikipedia.org/wiki/Filesystem_in_Userspace)  
19. FUSE — The Linux Kernel documentation, accessed on November 4, 2025, [https://www.kernel.org/doc/html/next/filesystems/fuse.html](https://www.kernel.org/doc/html/next/filesystems/fuse.html)  
20. DOCA SNAP Virtio-fs Application Guide \- NVIDIA Docs, accessed on November 4, 2025, [https://docs.nvidia.com/doca/sdk/doca+snap+virtio-fs+application+guide/index.html](https://docs.nvidia.com/doca/sdk/doca+snap+virtio-fs+application+guide/index.html)  
21. Virtual I/O Device (VIRTIO) Version 1.1 \- GitHub Pages, accessed on November 4, 2025, [https://stefanha.github.io/virtio/virtio-fs.html](https://stefanha.github.io/virtio/virtio-fs.html)  
22. Virtqueues and virtio ring: How the data travels \- Red Hat, accessed on November 4, 2025, [https://www.redhat.com/en/blog/virtqueues-and-virtio-ring-how-data-travels](https://www.redhat.com/en/blog/virtqueues-and-virtio-ring-how-data-travels)  
23. Improved Linux filesystem sharing for simulated devices with extended Virtio support in Renode, accessed on November 4, 2025, [https://renode.io/news/improved-filesystem-sharing-with-virtiofs-support-in-renode/](https://renode.io/news/improved-filesystem-sharing-with-virtiofs-support-in-renode/)  
24. DOCA DevEmu Virtio-FS \- NVIDIA Docs Hub, accessed on November 4, 2025, [https://docs.nvidia.com/doca/sdk/doca+devemu+virtio-fs/index.html](https://docs.nvidia.com/doca/sdk/doca+devemu+virtio-fs/index.html)  
25. virtiofs: virtio-fs host\<-\>guest shared file system — The Linux Kernel ..., accessed on November 4, 2025, [https://www.kernel.org/doc/html/v5.9/filesystems/virtiofs.html](https://www.kernel.org/doc/html/v5.9/filesystems/virtiofs.html)  
26. Development Titles \- OpenIndiana Docs, accessed on November 4, 2025, [https://docs.openindiana.org/books/develop/](https://docs.openindiana.org/books/develop/)  
27. illumos | Univrs, accessed on November 4, 2025, [https://book.univrs.io/](https://book.univrs.io/)  
28. illumos: manual page: intro.9e \- SmartOS, accessed on November 4, 2025, [https://smartos.org/man/9e/intro](https://smartos.org/man/9e/intro)  
29. Multi-Kernel Drifting \- Hacker News, accessed on November 4, 2025, [https://news.ycombinator.com/item?id=33337086](https://news.ycombinator.com/item?id=33337086)  
30. Rust in illumos \- Hacker News, accessed on November 4, 2025, [https://news.ycombinator.com/item?id=41505665](https://news.ycombinator.com/item?id=41505665)  
31. Device Driver Entry Points, accessed on November 4, 2025, [https://docs.oracle.com/cd/E23824\_01/html/819-3196/eqbqy.html](https://docs.oracle.com/cd/E23824_01/html/819-3196/eqbqy.html)  
32. Driver Module Entry Points (Writing Device Drivers), accessed on November 4, 2025, [https://docs.oracle.com/cd/E19683-01/806-5222/drvovr-fig-20/index.html](https://docs.oracle.com/cd/E19683-01/806-5222/drvovr-fig-20/index.html)  
33. \_fini \- man pages section 9: DDI and DKI Driver Entry Points, accessed on November 4, 2025, [https://docs.oracle.com/cd/E88353\_01/html/E37854/u-fini-9e.html](https://docs.oracle.com/cd/E88353_01/html/E37854/u-fini-9e.html)  
34. how to make loadable kernel module on solaris? no linux \- Stack Overflow, accessed on November 4, 2025, [https://stackoverflow.com/questions/50733459/how-to-make-loadable-kernel-module-on-solaris-no-linux](https://stackoverflow.com/questions/50733459/how-to-make-loadable-kernel-module-on-solaris-no-linux)  
35. ATTACH(9E) \- OmniOS, accessed on November 4, 2025, [https://man.omnios.org/man9e/attach](https://man.omnios.org/man9e/attach)  
36. Steps in developing your own File system in Solaris 10 \- Stack Overflow, accessed on November 4, 2025, [https://stackoverflow.com/questions/41115181/steps-in-developing-your-own-file-system-in-solaris-10](https://stackoverflow.com/questions/41115181/steps-in-developing-your-own-file-system-in-solaris-10)  
37. VFS \- OSDev Wiki, accessed on November 4, 2025, [http://wiki.osdev.org/VFS](http://wiki.osdev.org/VFS)  
38. Virtual File Systems \- IBM, accessed on November 4, 2025, [https://www.ibm.com/docs/en/aix/7.2.0?topic=concepts-virtual-file-systems](https://www.ibm.com/docs/en/aix/7.2.0?topic=concepts-virtual-file-systems)  
39. vnode(9) \- OpenBSD manual pages, accessed on November 4, 2025, [https://man.openbsd.org/vnode.9](https://man.openbsd.org/vnode.9)  
40. vnode(9), accessed on November 4, 2025, [https://www.daemon-systems.org/man/vnode.9.html](https://www.daemon-systems.org/man/vnode.9.html)  
41. vnodeops(9) \- NetBSD Manual Pages, accessed on November 4, 2025, [https://man.netbsd.org/vnodeops.9](https://man.netbsd.org/vnodeops.9)  
42. alhazred/illumos-sshfs: illumos FUSE driver and library \+ ... \- GitHub, accessed on November 4, 2025, [https://github.com/alhazred/illumos-sshfs](https://github.com/alhazred/illumos-sshfs)  
43. \[OmniOS-discuss\] FW: Re: Mount NTFS USB under OmniOS, accessed on November 4, 2025, [https://omnios.org/ml-archive/2013-January/000405.html](https://omnios.org/ml-archive/2013-January/000405.html)  
44. accessed on January 1, 1970, [https://github.com/jurikm/illumos-fusefs](https://github.com/jurikm/illumos-fusefs)  
45. accessed on January 1, 1970, [https://github.com/alhazred/illumos-sshfs/tree/master/kernel](https://github.com/alhazred/illumos-sshfs/tree/master/kernel)  
46. \[RFC\] virtio-fs: shared file system for virtual machines \- LWN.net, accessed on November 4, 2025, [https://lwn.net/Articles/774495/](https://lwn.net/Articles/774495/)  
47. fs/fuse/virtio\_fs.c \- kernel/common \- Git at Google \- Android GoogleSource, accessed on November 4, 2025, [https://android.googlesource.com/kernel/common/+/refs/heads/android12-5.4/fs/fuse/virtio\_fs.c](https://android.googlesource.com/kernel/common/+/refs/heads/android12-5.4/fs/fuse/virtio_fs.c)  
48. virtiofs: Add DAX support \- LWN.net, accessed on November 4, 2025, [https://lwn.net/Articles/813807/](https://lwn.net/Articles/813807/)  
49. illumos: manual page: segmap.9e \- SmartOS, accessed on November 4, 2025, [https://www.smartos.org/man/9E/segmap](https://www.smartos.org/man/9E/segmap)  
50. Rust Without the Standard Library A Deep Dive into no\_std Development | Leapcell, accessed on November 4, 2025, [https://leapcell.io/blog/rust-without-the-standard-library-a-deep-dive-into-no-std-development](https://leapcell.io/blog/rust-without-the-standard-library-a-deep-dive-into-no-std-development)  
51. Use cases for \`no\_std\` on tier 1 targets \- libs \- Rust Internals, accessed on November 4, 2025, [https://internals.rust-lang.org/t/use-cases-for-no-std-on-tier-1-targets/20592](https://internals.rust-lang.org/t/use-cases-for-no-std-on-tier-1-targets/20592)  
52. Writing FreeBSD Kernel Modules in Rust | NCC Group, accessed on November 4, 2025, [https://www.nccgroup.com/research-blog/writing-freebsd-kernel-modules-in-rust/](https://www.nccgroup.com/research-blog/writing-freebsd-kernel-modules-in-rust/)  
53. illumos: manual page: kmem\_alloc.9f \- SmartOS, accessed on November 4, 2025, [https://www.smartos.org/man/9F/kmem\_alloc](https://www.smartos.org/man/9F/kmem_alloc)  
54. Binding a Linux API library : r/rust \- Reddit, accessed on November 4, 2025, [https://www.reddit.com/r/rust/comments/gt0j0q/binding\_a\_linux\_api\_library/](https://www.reddit.com/r/rust/comments/gt0j0q/binding_a_linux_api_library/)  
55. Bridging Rust and C Generating C Bindings and Headers with Cbindgen and Cargo-c, accessed on November 4, 2025, [https://leapcell.io/blog/bridging-rust-and-c-generating-c-bindings-and-headers-with-cbindgen-and-cargo-c](https://leapcell.io/blog/bridging-rust-and-c-generating-c-bindings-and-headers-with-cbindgen-and-cargo-c)  
56. illumos: manual page: ddi\_flsll.9f \- SmartOS, accessed on November 4, 2025, [https://www.smartos.org/man/9f/ddi\_flsll](https://www.smartos.org/man/9f/ddi_flsll)  
57. NOTES.txt \- Z IN ASCII, accessed on November 4, 2025, [https://zinascii.com/pub/illumos/gate/1017/NOTES.txt](https://zinascii.com/pub/illumos/gate/1017/NOTES.txt)  
58. Other reprs \- The Rustonomicon \- Rust Documentation, accessed on November 4, 2025, [https://doc.rust-lang.org/nomicon/other-reprs.html](https://doc.rust-lang.org/nomicon/other-reprs.html)  
59. question on \`repr(C)\` guarantees : r/rust \- Reddit, accessed on November 4, 2025, [https://www.reddit.com/r/rust/comments/1ap47sj/question\_on\_reprc\_guarantees/](https://www.reddit.com/r/rust/comments/1ap47sj/question_on_reprc_guarantees/)  
60. CB\_OPS(9S) \- OmniOS, accessed on November 4, 2025, [https://man.omnios.org/man9s/cb\_ops](https://man.omnios.org/man9s/cb_ops)  
61. \`\#\[repr(C)\]\` on nested structs \- help \- The Rust Programming Language Forum, accessed on November 4, 2025, [https://users.rust-lang.org/t/repr-c-on-nested-structs/110654](https://users.rust-lang.org/t/repr-c-on-nested-structs/110654)  
62. Rust wrappers for various illumos-specific system libaries \- GitHub, accessed on November 4, 2025, [https://github.com/illumos/rust-illumos](https://github.com/illumos/rust-illumos)  
63. illumos repositories \- GitHub, accessed on November 4, 2025, [https://github.com/orgs/illumos/repositories](https://github.com/orgs/illumos/repositories)  
64. doors \- Rust \- Docs.rs, accessed on November 4, 2025, [https://docs.rs/doors](https://docs.rs/doors)  
65. kstat\_rs \- Rust \- Docs.rs, accessed on November 4, 2025, [https://docs.rs/kstat-rs](https://docs.rs/kstat-rs)  
66. zone \- Rust \- Docs.rs, accessed on November 4, 2025, [https://docs.rs/zone](https://docs.rs/zone)  
67. Operating System and Virtualization Engineer \- Oxide Computer, accessed on November 4, 2025, [https://oxide.computer/careers/sw-host-virt](https://oxide.computer/careers/sw-host-virt)  
68. oxidecomputer/propolis: VMM userspace for illumos bhyve \- GitHub, accessed on November 4, 2025, [https://github.com/oxidecomputer/propolis](https://github.com/oxidecomputer/propolis)  
69. illumos: manual page: ddi\_segmap\_setup.9f \- SmartOS, accessed on November 4, 2025, [https://www.smartos.org/man/9f/ddi\_segmap\_setup](https://www.smartos.org/man/9f/ddi_segmap_setup)  
70. Implementing a virtio-blk driver in my own operating system \- Stephen Brennan, accessed on November 4, 2025, [https://brennan.io/2020/03/22/sos-block-device/](https://brennan.io/2020/03/22/sos-block-device/)  
71. virtio-fs \- Stefan Hajnoczi, accessed on November 4, 2025, [https://vmsplice.net/\~stefan/virtio-fs\_%20A%20Shared%20File%20System%20for%20Virtual%20Machines.pdf](https://vmsplice.net/~stefan/virtio-fs_%20A%20Shared%20File%20System%20for%20Virtual%20Machines.pdf)  
72. Using virtio-fs on a unikernel \- QEMU, accessed on November 4, 2025, [https://www.qemu.org/2020/11/04/osv-virtio-fs/](https://www.qemu.org/2020/11/04/osv-virtio-fs/)  
73. Mapping Device Memory (Writing Device Drivers), accessed on November 4, 2025, [https://docs.oracle.com/cd/E19683-01/806-5222/character-27110/index.html](https://docs.oracle.com/cd/E19683-01/806-5222/character-27110/index.html)  
74. Mapping Device Memory \- Writing Device Drivers, accessed on November 4, 2025, [https://docs.oracle.com/cd/E18752\_01/html/816-4854/character-16543.html](https://docs.oracle.com/cd/E18752_01/html/816-4854/character-16543.html)  
75. manual page: mmap.2 \- illumos \- SmartOS, accessed on November 4, 2025, [https://www.smartos.org/man/2/mmap](https://www.smartos.org/man/2/mmap)  
76. I'm part of the illumos core team and I'm quite keen to use Rust in the base of ... \- Hacker News, accessed on November 4, 2025, [https://news.ycombinator.com/item?id=41506892](https://news.ycombinator.com/item?id=41506892)  
77. oxidecomputer/helios: Helios: Or, a Vision in a Dream. A Fragment. \- GitHub, accessed on November 4, 2025, [https://github.com/oxidecomputer/helios](https://github.com/oxidecomputer/helios)  
78. new/usr/src/cmd/intrd/Makefile \- illumos \- code review, accessed on November 4, 2025, [https://cr.illumos.org/\~webrev/0xffea/intrd-kernel-01/illumos-gate.pdf](https://cr.illumos.org/~webrev/0xffea/intrd-kernel-01/illumos-gate.pdf)  
79. So you want to cross compile illumos, accessed on November 4, 2025, [https://artemis.sh/2023/02/21/so-you-want-to-cross-compile-illumos.html](https://artemis.sh/2023/02/21/so-you-want-to-cross-compile-illumos.html)  
80. virtiofs \- shared file system for virtual machines / Standalone usage \- GitLab, accessed on November 4, 2025, [https://virtio-fs.gitlab.io/howto-qemu.html](https://virtio-fs.gitlab.io/howto-qemu.html)  
81. Host Operating System & Hypervisor / RFD / Oxide: 26, accessed on November 4, 2025, [https://26.rfd.oxide.computer/](https://26.rfd.oxide.computer/)  
82. Virtio-fs is amazing\! (plus how I set it up) : r/VFIO \- Reddit, accessed on November 4, 2025, [https://www.reddit.com/r/VFIO/comments/i12uyn/virtiofs\_is\_amazing\_plus\_how\_i\_set\_it\_up/](https://www.reddit.com/r/VFIO/comments/i12uyn/virtiofs_is_amazing_plus_how_i_set_it_up/)  
83. Device Driver Tutorial \- filibeto.org, accessed on November 4, 2025, [https://www.filibeto.org/aduritz/truetrue/solaris10/device-driver-819-3159.pdf](https://www.filibeto.org/aduritz/truetrue/solaris10/device-driver-819-3159.pdf)  
84. illumos tools for observing processes \- Dave Pacheco's Blog, accessed on November 4, 2025, [https://www.davepacheco.net/blog/post/2012-08-04-illumos-tools-for-observing-processes/](https://www.davepacheco.net/blog/post/2012-08-04-illumos-tools-for-observing-processes/)  
85. Illumos: Getting Started with MDB | Johann 'Myrkraverk' Oskarsson, accessed on November 4, 2025, [http://www.myrkraverk.com/blog/2014/04/illumos-getting-started-with-mdb/](http://www.myrkraverk.com/blog/2014/04/illumos-getting-started-with-mdb/)  
86. How to debug the Linux kernel with GDB and QEMU? \- Stack Overflow, accessed on November 4, 2025, [https://stackoverflow.com/questions/11408041/how-to-debug-the-linux-kernel-with-gdb-and-qemu](https://stackoverflow.com/questions/11408041/how-to-debug-the-linux-kernel-with-gdb-and-qemu)