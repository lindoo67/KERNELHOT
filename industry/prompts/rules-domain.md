【Linux 内核领域翻译规则 — 本平台内容聚焦 Linux 内核，严格遵守】

1. 术语按 Linux 内核语境处理：
   - CFS = CFS 进程调度器（Completely Fair Scheduler，中文称“完全公平调度器”）
   - scheduler = 调度器；结合上下文写明进程调度器、I/O 调度器等具体对象
   - driver = 驱动或设备驱动；namespace = 命名空间。不要把二者拼成不存在的固定术语
   - cgroup = cgroup（控制组），首次出现可补中文，后续保留英文
   - vCPU = 虚拟 CPU（KVM 等虚拟化语境）
   - page fault = 缺页异常
   - IOMMU / DMA / MMU = 保留英文缩写；需要时首次补充中文解释
   - PM QoS = PM QoS（电源管理服务质量），保留英文缩写
   - sysfs / procfs / debugfs = 保留英文
   - Kconfig / Makefile = 保留英文
   - initcall / subsys_initcall = 保留英文
   - RCU = RCU（Read-Copy-Update），保留英文缩写
   - lockless = 无锁
   - `mm_struct` 等代码标识符原样保留；描述其概念时可写“内存描述符”

2. 以下专有名词保留英文原文，不翻译、不擅自扩写：
   - 内核版本：v6.x / v7.x / 6.x / 7.x；版本号一字不改，不写成“第几代”
   - 子系统和列表名：netdev / bpf / linux-mm / linux-fsdevel / linux-block / linux-pm / dri-devel / kvm
   - 邮件与归档：LKML / Lore / lore.kernel.org
   - 架构：x86 / Arm / arm64 / RISC-V / s390 / PowerPC / LoongArch
   - 发行版：RHEL / SLES / Ubuntu / Fedora；确指其内核时可写 RHEL 内核、Ubuntu 内核
   - 技术缩写：CVE / PCI / PCIe / USB / ACPI / UEFI / BIOS
   - 内核机制和工具：BPF / eBPF / XDP / kprobe / kretprobe / uprobe / fprobe / perf / BPF map / cgroup v2
   - 通用技术：API / SDK / CLI / IDE / SaaS / CDN / SSO / OAuth / JWT / WebSocket / SSE / gRPC
   - Git 术语：commit / patch / branch / PR；upstream 按语境译“上游”，mainline 译“主线”或“主线内核”

3. 公司与项目名：
   - Red Hat / SUSE / Canonical / Google / Intel / AMD / NVIDIA / Arm / IBM / Oracle / Microsoft / AWS / Meta 保留官方英文写法
   - 华为 / 阿里巴巴 / 腾讯使用官方中文品牌名；原文只有英文名时可首次中英并列
   - 只把材料实际涉及的上游内核工作写进标题和摘要。NVIDIA 专有驱动与 CUDA 不属于上游 Linux 内核项目；上游 DRM 驱动需按原文区分 Nouveau、Nova 等项目

4. 代码、命令、URL 和数字单位一字不改：
   - 反引号代码 `code` 不翻译
   - git am、git send-email、make menuconfig 等命令不译
   - URL 原样保留
   - 数字与单位原样保留，例如 4K pages / 64-bit / 128GB RAM / 3.5x speedup / 99.9%
   - 金额、比例、区间和版本必须保留原文的阿拉伯数字和单位
