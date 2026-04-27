# Chromium Profile Manager

[English README](./README.md)

本仓库包含两个相关层：

1. **ungoogled-chromium 共享转换层**（仓库根目录）
   - 用于把上游 Chromium 转换为 ungoogled-chromium 的补丁/配置/工具链工作区。
   - 包含 `patches/`、`utils/`、`devutils/`、`flags.gn`、`downloads.ini`、`domain_*.list`、`pruning.list` 等。
2. **本地桌面应用**（`app/`）
   - 基于 Tauri + Vue 的桌面应用，用于管理和启动本地 Chromium Profile 配置。

> 本仓库不是完整的 Chromium 源码仓库。

## 致谢

本项目基于并参考了 [ungoogled-chromium](https://github.com/ungoogled-software/ungoogled-chromium)。

## 桌面应用（`app/`）功能

- Profile 列表与高频操作（启动 / 停止 / 设置 / 自动化）
- 在 Profile 卡片列表底部通过 `+` 新建 Profile
- Profile 设置弹窗（常规、启动信息、扩展、书签、日志）
- 运行状态与 PID 展示
- **浏览器进程退出后自动将状态回落为 stopped**
- 自动化脚本管理（`scripts/automation/*.py` 的启动/停止/列表/打开目录）
- 扩展管理（导入解压目录或 CRX，并按 Profile 启用）
- 每个 Profile 的书签与快捷链接持久化
- 软件级设置（字体、主色、背景色）
- 无边框窗口的自定义可拖拽标题栏

### 当前运行行为

- `launch_profile` 启动 Chromium 并记录 PID。
- 若 Chromium 被外部关闭，运行状态会自动更新为 `stopped`。
- `stop_profile` 目前仅更新应用内状态与日志，**不会主动 kill 系统浏览器进程**。

## 数据目录（`app`）

- `data/profiles/<profile-id>/profile.json`
- `data/profiles/<profile-id>/bookmarks.json`
- `data/profiles/<profile-id>/quick-links.json`
- `data/logs/<profile-id>.log`（JSONL）
- `data/extensions/<extension-id>/...` 或 `data/extensions/<extension-id>.crx`

## 快速开始（桌面应用）

### 环境要求

- Node.js + npm
- Rust + Cargo（Tauri 后端）
- `PATH` 中可用的 Python（自动化脚本通过 `python` 启动）
- 本地 Chromium runtime（新 Profile 默认指向 `./runtime/.../chrome.exe`）

### 安装与运行

```sh
npm --prefix app install
npm --prefix app run dev:tauri
```

### 构建与测试

```sh
npm --prefix app run build
npm --prefix app test -- --run
```

## 共享 ungoogled-chromium 层（根目录）

常用命令：

```sh
./devutils/check_all_code.sh
python3 devutils/validate_config.py
python3 devutils/validate_patches.py -r
```

完整构建与设计流程见：

- `docs/building.md`
- `docs/design.md`
- `docs/developing.md`
- `docs/platforms.md`

## 许可证

BSD-3-Clause（见 `LICENSE`）。
