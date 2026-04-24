# Findings & Decisions

## Requirements
- 目标是在当前项目外层增加一个 Tauri + Vue 3 + TypeScript 桌面 GUI。
- GUI 主要负责管理 fingerprint-chromium 的 profile，而不是修改 Chromium UI。
- 每个 profile 至少包含：名称、备注、browserPath、userDataDir、代理、语言、时区、窗口大小、扩展列表、启动参数。
- 启动器必须完成：读取 profile、拼接命令行、启动本地浏览器、记录 PID/状态、向前端显示“运行中”。
- 扩展管理首版只需支持两种导入：解压扩展目录、本地 CRX。
- 书签管理应支持导入 Chrome 书签 JSON、导入 HTML 书签文件、每个 profile 绑定独立书签集、常用网址快捷启动。
- 日志与状态至少展示：启动命令、运行状态、退出码、错误信息。

## Research Findings
- 当前仓库本体是 ungoogled-chromium 的共享配置/补丁/工具层，不是现成桌面 GUI 项目。
- 现有代码主要围绕 Chromium 源码下载、裁剪、补丁、域名替换与构建辅助；新增 GUI 基本属于新子系统接入。
- 产品核心能力更接近“本地浏览器实例编排器”：持久化 profile 配置、构造启动参数、启动与跟踪进程、围绕 profile 管理扩展/书签。
- 启动器层是最关键后端能力，其他 GUI 模块都围绕它建立。
- 这类产品的第一性原理不是“浏览器壳有多花”，而是“配置是否稳定落盘、启动是否稳定、运行状态是否可观测”。
- 书签与扩展都适合围绕 profile 做隔离绑定，而不是做全局共享默认态。
- 首版范围需要刻意收缩，否则容易被 CRX 在线安装、浏览器深度控制、外部实例接管等问题拖慢。

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 建议采用“前端 UI + Tauri 命令层 + 本地文件存储 + 进程管理器”四层结构 | 便于隔离展示层、业务层与 OS 能力 |
| Profile 配置使用 JSON 持久化 | 与用户给出的示例一致，便于导入导出与调试 |
| 运行状态单独维护内存态 + 日志文件 | profile 配置是静态数据，进程状态是动态数据，应该分离 |
| 扩展与书签先做导入/绑定，不做在线安装市场 | 更符合 MVP，复杂度可控 |
| 书签管理建议使用“管理器自己的书签元数据 + 导出到 profile”思路 | 便于支持 JSON/HTML 导入和快捷网址能力 |
| Tauri 后端作为浏览器编排层 | 启动命令拼接、PID 跟踪、日志采集、文件写入都应集中在原生侧 |
| Vue 前端作为 profile 工作台 | 负责增删改查、导入、展示状态，不直接接触系统进程 |
| 推荐将 GUI 放在独立 app 子目录 | 避免与现有 ungoogled-chromium 工具脚本混杂 |
| 首版只管理由应用启动的实例 | 可避免外部启动实例的状态一致性问题 |
| 首版主打本地单机使用 | 当前需求未涉及同步、多用户、远程协同 |
| 前端状态管理应围绕 profiles、runtime、logs 三个 store 展开 | 正好对应静态配置、动态运行态、观测信息三大域 |
| Tauri 命令按领域拆成 profile/launcher/extensions/bookmarks/logs 五组 | 与需求域一致，后续维护清晰 |
| 首批实现应先打通纵向主链路，再补横向能力 | 先保证“创建 profile → 启动 → 看到状态”闭环 |
| 推荐使用 TDD 推进首版 | 启动器、参数构造、持久化仓库都很适合先写测试锁行为 |
| 测试代码放在独立 `test/` 目录 | 与 app 源码层分离，便于后续按前端/后端分类组织 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| 当前仓库没有现成前端或 Tauri 结构 | 规划上应将 GUI 视为新增应用层，而不是在现有 Python 工具中硬塞 UI |
| npm 在仓库根目录运行失败 | 前端命令必须在 `app/` 目录下执行 |

## Latest Implementation Findings
- Tauri 命令层已成功接入当前后端核心，`cargo test --manifest-path app/src-tauri/Cargo.toml` 继续通过。
- 前端 `ProfilesPage` 已在挂载时拉取 profile 列表并逐个刷新 runtime state。
- 当前前端测试覆盖了 `ProfileForm` 提交归一化和 `ProfilesPage` 初始加载/状态刷新。
- 当前主链路已经具备：profile 列表加载、表单保存、运行状态读取、启动/停止按钮联动的基础壳层。
- 后续实现顺序已固定为：日志域 → 扩展导入 → 书签导入 → 端到端启动验证与文档收口。
- 当前后端尚未有独立日志存储模块；`launch_profile` 只更新内存态，没有把启动命令、错误、退出状态写入 `data/logs`。
- `app/src-tauri/src/lib.rs` 已改为基于项目根创建 `data/profiles`、`data/logs`、`data/extensions`，避免写入 `app/src-tauri/data` 触发 dev watcher 重建。
- 当前 `RuntimeStateStore` 已保留 `last_command`、`last_error`、`exit_code`，日志面板可以直接和现有 runtime 字段对齐展示。
- 当前前端还没有 logs store 或日志面板组件，需要新增独立服务/状态层来读取后端日志。
- 已新增 `LogStore`，日志按 `data/logs/<profile-id>.log` 以 JSON Lines 持久化。
- `launch_profile` / `stop_profile` 现已写入日志，前端 `ProfileLogsPanel` 能展示 level、message、command 和 exit code。
- 当前 profile 扩展引用模型只有 `{ id, enabled }`，前端表单也还没有扩展选择 UI，因此扩展导入需要补一个独立的扩展仓储与列表命令。
- 当前 launcher 通过 `./data/extensions/{id}` 解析扩展路径，天然更适合先支持“解压目录导入”；本地 CRX 可先作为受管文件导入到扩展目录中。
- 已新增 `ExtensionStore`、`list_extensions`、`import_extension_dir`、`import_extension_crx`，并在前端接入扩展导入按钮与 profile 扩展勾选。
- 当前项目根目录下尚无 `runtime/` 目录，说明现在无法直接验证新版 ungoogled-chromium Windows runtime 的真实文件布局；适配应先保持 `browserPath` 可配置，并把路径/启动错误充分写入日志。
- 已新增书签与快捷链接存储/命令/前端面板，当前 app 层的 profile、launch、logs、extensions、bookmarks 主链路已具备。
- 已下载并解压 `ungoogled-chromium_146.0.7680.177-1.1_windows_x64.zip` 到 `runtime/ungoogled-chromium-146/`；实际可执行文件路径为 `runtime/ungoogled-chromium-146/ungoogled-chromium_146.0.7680.177-1.1_windows_x64/chrome.exe`。
- launcher 现在会在 `app/src-tauri/src/commands/launcher.rs` 中把 `browserPath`、`userDataDir` 和扩展路径统一解析到项目根，再调用 `Command::new`，并把解析后的路径一起写入日志，便于定位启动问题。
- 真实启动探测显示该版本可被当前启动参数模型拉起，并能生成 `user-data-dir` 下的 Chromium 配置文件；探测脚本手动终止进程后返回码为 1，这不是启动失败证据。
- 前端 `app/src/pages/ProfilesPage.vue` 与 `app/src/components/profile/ProfileLogsPanel.vue` 已完成一轮低风险 UI polish：扩展导入改为表单、运行态改为卡片视图、日志改为分层卡片展示。

## Resources
- `docs/design.md` — 当前仓库在 ungoogled-chromium 体系中的职责
- `docs/building.md` — Chromium 变体构建流程参考
- `CLAUDE.md` — 已整理的仓库结构与常用命令说明

## Visual/Browser Findings
- 暂无

---
*Update this file after every 2 view/browser/search operations*
*This prevents visual information from being lost*
