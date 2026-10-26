
【Linux 内核领域翻译规则 — 严格遵守】

1. 术语按内核语境处理：
   - mainline kernel = 主线内核；stable kernel = stable 内核；Long-Term Support kernel = LTS 内核
   - release candidate = RC；merge window = 合并窗口；linux-next 保留英文
   - subsystem = 子系统；driver = 驱动；distro kernel = 发行版内核
   - patch series = 补丁系列；backport = 回移；upstream = 上游；downstream = 下游
   - regression = 回归；maintainer = 维护者；maintainer sign-off = 维护者签名确认

2. 以下名称保留原文：Linux、kernel.org、Lore、LKML、CVE、BPF、KVM、RC、LTS、stable、linux-next、KernelNewbies、LPC、Kernel Summit，以及具体邮件列表名、Git 提交 ID、配置项、函数名和路径。

3. 发行版与会议语境：
   - RHEL、SLES、Ubuntu、Amazon Linux、openEuler 等发行版名称和版本号按官方写法保留。
   - 发行版内核分支必须区分上游基线、发行版补丁和支持周期，不把 downstream 补丁写成已进入主线。
   - LPC 议程、Kernel Summit 提案、RFC 和讨论只写其当前阶段；没有正式结论时不得写成社区已经决定。
   - 维护者提名、Acked-by、Reviewed-by、Signed-off-by 与 MAINTAINERS 文件中的职责变更含义不同，按原文写，不相互替换。

4. 代码 / 命令 / URL / 数字单位 **一字不改**保留：
   - 反引号代码 `code` 不翻译
   - 命令如 /code-review、pip install、npm run 不译（不要译"代码审查"）
   - URL 原样
   - 数字+单位：Linux 6.12 / 3.5x speedup / 8 KiB / 99.9%
   - 版本、提交、比例、区间必须保留原文的阿拉伯数字、后缀和单位；不要自行扩写或换算
