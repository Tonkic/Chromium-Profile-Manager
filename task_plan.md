# Task Plan: Tauri 壳层 Profile Manager

## Goal
为当前项目设计一个基于 Tauri + Vue 3 + TypeScript 的桌面 GUI 壳层，用于管理 fingerprint-chromium 的 profile、启动参数、扩展、书签与运行状态，并形成可执行的实施分阶段方案。

## Current Phase
Phase 9

## Phases

### Phase 1: Requirements & Discovery
- [x] 理解用户目标与优先级
- [x] 识别产品边界：重点是 profile/启动/扩展/书签/日志，不是重写 Chromium UI
- [x] 记录首轮发现到 findings.md
- **Status:** complete

### Phase 2: Solution Architecture
- [x] 确定 Tauri 主进程与 Vue 前端职责边界
- [x] 定义数据模型、目录结构、运行时状态模型
- [x] 定义浏览器启动与进程跟踪方案
- **Status:** complete

### Phase 3: MVP Scope Definition
- [x] 拆分第一阶段必须实现的功能
- [x] 识别延后功能与非目标
- [x] 定义最小可用交付顺序
- **Status:** complete

### Phase 4: Implementation Roadmap
- [x] 按模块给出实施顺序
- [x] 标注关键风险、依赖与验证点
- [x] 定义每阶段验收标准
- **Status:** complete

### Phase 5: User Alignment
- [x] 输出清晰的实施建议
- [x] 标注推荐的起步版本边界
- [ ] 等待用户确认后进入实现
- **Status:** in_progress

### Phase 6: Implementation Blueprint
- [x] 细化目录初始化方案
- [x] 定义前后端模块清单
- [x] 定义首批文件与接口草案
- **Status:** complete

### Phase 7: Logs Domain
- [x] 先写日志域测试
- [x] 实现后端日志存储与读取命令
- [x] 实现前端日志展示面板
- **Status:** complete

### Phase 8: Extension Import
- [x] 先写扩展导入测试
- [x] 实现解压扩展目录导入
- [x] 实现本地 CRX 导入
- [x] 接入前端 profile 扩展选择
- **Status:** complete

### Phase 9: Bookmark Import
- [x] 先写书签导入测试
- [x] 实现 JSON/HTML 书签导入
- [x] 实现 profile 绑定与快捷链接展示
- **Status:** complete

### Phase 10: End-to-End Verification and Docs
- [x] 验证浏览器启动主链路
- [x] 完善测试与构建校验
- [ ] 收口 app 层命令与文档
- **Status:** in_progress

## Key Questions
1. 首版是否只做本地 profile 管理与启动，不做远程同步/账号体系？
2. 扩展与书签数据是直接复用 Chromium 原生文件格式，还是引入一层管理元数据？
3. 浏览器运行状态是否以“本进程启动的实例”为准，而不尝试接管外部手动启动实例？
4. 首版 UI 是否先聚焦桌面 Windows 路径与启动流程？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 以 Tauri + Vue 3 + TypeScript 作为壳层方向 | 用户已明确技术路线，适合做桌面本地管理器 |
| 产品重点放在 profile 管理、稳定启动、扩展与书签 | 这是该产品的核心价值，明确排除“重写 Chromium UI” |
| 启动器应作为后端能力中心设计 | 启动命令拼装、PID 跟踪、状态回传、错误日志都依赖统一后端控制 |
| 扩展首版仅支持导入解压目录和本地 CRX | 避免过早接入 Web Store 带来的额外复杂度 |
| 书签采用每个 profile 绑定独立书签集 | 与 profile 隔离模型一致，便于迁移和管理 |
| GUI 新增为独立应用层，不直接侵入现有 Python 工具职责 | 当前仓库本体是构建/补丁工具层，桌面管理器应独立演进 |
| Tauri 后端负责文件系统、进程管理、日志与事件推送 | 这些能力需要原生侧统一控制，前端只做展示与交互 |
| Vue 前端负责 profile 编辑、列表页、运行状态和导入向导 | 保持 UI 层纯粹，降低与系统 API 的耦合 |
| 首版运行状态只追踪由管理器启动的浏览器实例 | 实现简单可靠，避免接管外部进程带来的歧义 |
| 建议采用 profile 配置、书签数据、运行日志三类存储分离 | 静态配置、用户内容、运行态日志生命周期不同 |
| 首版优先支持 Windows 路径与启动模型 | 用户示例是 Windows 浏览器路径，且最容易先打通 |
| 实现阶段可采用 TDD，并新增独立 `test/` 目录 | 先写测试再补实现，有利于把启动器、存储层和命令构造做稳 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| 暂无 | 1 | 无需处理 |

## Notes
- 优先定义“浏览器启动层”的边界与数据流。
- 任何与 Chromium 内部 UI 深度耦合的方案都不作为首版路线。
- 进入具体实现前，需要先确认 MVP 边界与目录布局。 
