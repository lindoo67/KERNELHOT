// Linux 内核行业的分类、标签与主体名录。类别 key 会出现在 URL 和公共接口中，上线后不要修改。

export const CATEGORIES = [
  { key: "security", tagColor: "red", label: "安全与修复", section: "安全与修复", guide: "内核漏洞、已利用风险、重大回归及其修复。只有 CVE 编号而没有影响或修复信息的内容不单独归入此类。" },
  { key: "release", tagColor: "blue", label: "版本与主线", section: "版本与主线", guide: "主线版本、RC、stable/LTS 发布、合并窗口和 linux-next 的重要进展。发行版自有内核更新归发行版内核。" },
  { key: "subsystem", tagColor: "indigo", label: "子系统进展", section: "子系统进展", guide: "调度、内存、文件系统、网络、BPF、虚拟化等内核子系统的重要设计与合并进展；单一硬件支持归硬件与驱动。" },
  { key: "driver", tagColor: "turquoise", label: "硬件与驱动", section: "硬件与驱动", guide: "新硬件支持、设备驱动、架构适配与固件接口变化。以通用子系统机制为核心的内容归子系统进展。" },
  { key: "performance", tagColor: "green", label: "性能与可靠性", section: "性能与可靠性", guide: "有方法和数据支持的性能、功耗、稳定性、可观测性变化，以及影响广泛的非安全回归。" },
  { key: "distro", tagColor: "orange", label: "发行版内核", section: "发行版内核", guide: "发行版内核的补丁、版本、支持周期、配置和上游协作，包括企业发行版与云厂商内核。" },
  { key: "community", tagColor: "purple", label: "社区与治理", section: "社区与治理", guide: "维护者变动、开发流程、行为准则、基金会与重要会议等内核社区治理动态。" },
  { key: "article", tagColor: "violet", label: "技术解读", section: "技术解读", guide: "有明确方法、证据或可复用知识的内核深度分析、教程与复盘；具体新闻本身应归入对应新闻类别。", commentary: true },
] as const satisfies ReadonlyArray<{ key: string; tagColor: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

export const RELEASE: { category: string; tag: string; unit: string } | null = { category: "release", tag: "内核发布", unit: "个内核版本" };
export const PLAIN_TERMS: readonly string[] = ["linux", "kernel", "cve", "rc", "lts", "stable", "linux-next", "lore", "lkml"];
export const ITEM_TYPES = ["kernel_release", "security_fix", "subsystem_change", "driver_update", "performance", "distro_kernel", "community_governance", "technical_article"] as const;

export const CATEGORY_TAGS = ["安全修复", "内核发布", "子系统变更", "驱动更新", "性能优化", "可靠性", "发行版内核", "社区治理", "技术解读", "其他"] as const;
export const TOPIC_TAGS = ["调度", "内存管理", "文件系统", "网络", "BPF", "虚拟化", "容器", "实时内核", "电源管理", "可观测性", "Rust for Linux", "x86", "Arm", "RISC-V", "GPU", "存储"] as const;
export const ENTITY_TAGS = ["Red Hat", "SUSE", "Canonical", "Google", "Intel", "AMD", "NVIDIA", "Arm", "IBM", "Oracle", "Microsoft", "AWS", "Meta", "华为", "阿里巴巴", "腾讯", "Linux Foundation"] as const;

export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  漏洞: "安全修复", 安全: "安全修复", 修复: "安全修复", CVE: "安全修复", 版本: "内核发布", 发布: "内核发布", 主线: "内核发布", LTS: "内核发布",
  子系统: "子系统变更", 驱动: "驱动更新", 硬件支持: "驱动更新", 性能: "性能优化", 回归: "可靠性", 稳定性: "可靠性",
  发行版: "发行版内核", 社区: "社区治理", 维护者: "社区治理", 教程: "技术解读", 分析: "技术解读", 文章: "技术解读",
};

type Entity = { name: string; displayTag: string | null; aliases: string[]; orgNames?: string[]; otherNames?: string[] };
export const ENTITIES: Record<string, Entity> = {
  "red-hat": { name: "Red Hat", displayTag: "Red Hat", aliases: ["Red Hat", "红帽"], orgNames: ["Red Hat", "红帽"] },
  suse: { name: "SUSE", displayTag: "SUSE", aliases: ["SUSE", "SUSE Labs"], orgNames: ["SUSE", "SUSE Labs"] },
  canonical: { name: "Canonical", displayTag: "Canonical", aliases: ["Canonical", "Ubuntu"], orgNames: ["Canonical", "Ubuntu Kernel Team"] },
  google: { name: "Google", displayTag: "Google", aliases: ["Google", "谷歌", "Android"], orgNames: ["Google", "Google Kernel Team", "Android"] },
  intel: { name: "Intel", displayTag: "Intel", aliases: ["Intel", "英特尔"], orgNames: ["Intel"] },
  amd: { name: "AMD", displayTag: "AMD", aliases: ["AMD", "Advanced Micro Devices", "超威"], orgNames: ["AMD"] },
  nvidia: { name: "NVIDIA", displayTag: "NVIDIA", aliases: ["NVIDIA", "英伟达"], orgNames: ["NVIDIA", "英伟达"] },
  arm: { name: "Arm", displayTag: "Arm", aliases: ["Arm", "ARM"], orgNames: ["Arm", "ARM"] },
  ibm: { name: "IBM", displayTag: "IBM", aliases: ["IBM", "International Business Machines"], orgNames: ["IBM", "IBM Linux Technology Center"] },
  oracle: { name: "Oracle", displayTag: "Oracle", aliases: ["Oracle", "甲骨文", "Oracle Linux"], orgNames: ["Oracle", "Oracle Linux"] },
  microsoft: { name: "Microsoft", displayTag: "Microsoft", aliases: ["Microsoft", "微软", "Azure Linux"], orgNames: ["Microsoft", "Microsoft Linux Systems Group"] },
  aws: { name: "AWS", displayTag: "AWS", aliases: ["AWS", "Amazon Web Services", "Amazon", "亚马逊云科技"], orgNames: ["AWS", "Amazon Web Services"], otherNames: ["Amazon Linux"] },
  meta: { name: "Meta", displayTag: "Meta", aliases: ["Meta", "Facebook"], orgNames: ["Meta", "Meta Open Source"] },
  huawei: { name: "华为", displayTag: "华为", aliases: ["华为", "Huawei"], orgNames: ["华为", "Huawei"] },
  alibaba: { name: "阿里巴巴", displayTag: "阿里巴巴", aliases: ["阿里巴巴", "阿里", "Alibaba", "Alibaba Cloud", "阿里云"], orgNames: ["阿里巴巴", "阿里云", "Alibaba Cloud"] },
  tencent: { name: "腾讯", displayTag: "腾讯", aliases: ["腾讯", "Tencent", "腾讯云"], orgNames: ["腾讯", "腾讯云", "Tencent Cloud"] },
  "linux-foundation": { name: "Linux Foundation", displayTag: "Linux Foundation", aliases: ["Linux Foundation", "Linux 基金会", "LF"], orgNames: ["Linux Foundation", "Linux 基金会"], otherNames: ["CNCF"] },
};

export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "red-hat", name: "Red Hat", patterns: [/red\s?hat|红帽/i] }, { id: "suse", name: "SUSE", patterns: [/\bsuse\b/i] },
  { id: "canonical", name: "Canonical", patterns: [/canonical|\bubuntu\b/i] }, { id: "google", name: "Google", patterns: [/google|谷歌|\bandroid\b/i] },
  { id: "intel", name: "Intel", patterns: [/intel|英特尔/i] }, { id: "amd", name: "AMD", patterns: [/\bamd\b|advanced micro devices|超威/i] },
  { id: "nvidia", name: "NVIDIA", patterns: [/nvidia|英伟达/i] }, { id: "arm", name: "Arm", patterns: [/\barm(?:64)?\b/i] },
  { id: "ibm", name: "IBM", patterns: [/\bibm\b/i] }, { id: "oracle", name: "Oracle", patterns: [/oracle|甲骨文/i] },
  { id: "microsoft", name: "Microsoft", patterns: [/microsoft|微软|azure linux/i] }, { id: "aws", name: "AWS", patterns: [/amazon web services|\baws\b|amazon linux|亚马逊云科技/i] },
  { id: "meta", name: "Meta", patterns: [/\bmeta\b|\bfacebook\b/i] }, { id: "huawei", name: "华为", patterns: [/huawei|华为/i] },
  { id: "alibaba", name: "阿里巴巴", patterns: [/alibaba|阿里巴巴|阿里云/i] }, { id: "tencent", name: "腾讯", patterns: [/tencent|腾讯/i] },
  { id: "linux-foundation", name: "Linux Foundation", patterns: [/linux foundation|linux 基金会/i] },
];

export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "red-hat", domains: ["redhat.com"] }, { entityId: "suse", domains: ["suse.com"] },
  { entityId: "canonical", domains: ["canonical.com", "ubuntu.com"] }, { entityId: "google", domains: ["google.com", "android.com"] },
  { entityId: "intel", domains: ["intel.com"] }, { entityId: "amd", domains: ["amd.com"] }, { entityId: "nvidia", domains: ["nvidia.com"] },
  { entityId: "arm", domains: ["arm.com"] }, { entityId: "ibm", domains: ["ibm.com"] }, { entityId: "oracle", domains: ["oracle.com"] },
  { entityId: "microsoft", domains: ["microsoft.com"] }, { entityId: "aws", domains: ["aws.amazon.com"] }, { entityId: "meta", domains: ["engineering.fb.com"] },
  { entityId: "huawei", domains: ["huawei.com"] }, { entityId: "alibaba", domains: ["alibabacloud.com"] }, { entityId: "tencent", domains: ["tencent.com"] },
  { entityId: "linux-foundation", domains: ["linuxfoundation.org"] },
];

export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "aws", pattern: /Amazon Linux/i }, { entityId: "canonical", pattern: /Ubuntu Kernel Team/i }, { entityId: "linux-foundation", pattern: /\bLF\b/ },
];
