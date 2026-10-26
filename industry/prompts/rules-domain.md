【Linux 内核领域术语规则】

1. 保留并正确区分 `mainline`（主线）、`stable`（稳定版）、`LTS`（长期支持版）、`RC`（候选版）、`linux-next`（预合并树）与 `merge window`（合并窗口），不要把它们统称为“新版”。
2. CVE 编号、内核版本号、补丁版本、Git commit/tag、配置项、函数、命令、路径、URL 和邮件列表名原样保留。`CVE-YYYY-NNNN` 不改写；`v6.12-rc1`、`6.6.y`、`CONFIG_*` 不翻译。
3. `exploited` 只有原文明示实际利用、在野利用或等价证据时才写“已利用”；`affected` 只写“受影响”。不要把概念验证、可利用性推测或存在 CVE 编号写成已利用。
4. `privilege escalation` 译为“权限提升”，`remote code execution` 译为“远程代码执行”，`use-after-free` 译为“释放后使用”，`out-of-bounds` 译为“越界访问”；必要时首次保留英文。
5. `backport` 译为“回移”，`regression` 译为“回归”，`subsystem` 译为“子系统”，`maintainer` 译为“维护者”。Lore、LKML、BPF、KVM、RCU、CVE、LTS 保留英文。
6. 数字、版本范围、受影响版本、修复版本与支持状态必须可在原文找到，不把单个分支的状态外推为全部上游或下游版本。
