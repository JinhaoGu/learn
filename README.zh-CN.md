# learn

[English](README.md) | 简体中文

[![视频](assets/thumbnail.png)](https://www.youtube.com/watch?v=kzcI5F4tGiU)

一个 AI 学习系统，教学思路来自视频 [How I Use AI to Learn Things](https://www.youtube.com/watch?v=kzcI5F4tGiU)。

目前教学行为已经实现 **harness 无关**。两个核心 skill 描述的是能力，而不是 Pi 专属的工具名称、路径、UI 组件、模型供应商或笔记格式。当 agent harness 提供相应能力时，它们会使用完整集成；缺少这些能力时，则自动降级为普通对话和 Markdown。

## 可移植核心

- `skills/teach/` — 探测学习者当前的认知边界，规划知识依赖图，并从无条件真理出发，通过有动机的推导进行教学。
- `skills/visualize/` — 当结构或几何关系更适合用图像表达时，添加一张最小且必要的图示。

两者都是标准的 `SKILL.md` 目录。你可以把任意一个目录复制到当前 harness 支持的 skill 位置，也可以让 harness 直接读取本仓库的 `skills/` 目录。不同 harness 的发现路径并不相同，请参考对应宿主的 skill 加载文档。

```bash
git clone https://github.com/JinhaoGu/learn.git
# 将 learn/skills/teach 和 learn/skills/visualize 安装或链接到
# 当前 harness 的 skill 目录。
```

## 能力降级

通用 skill 会发现并使用当前 harness 实际提供的能力：

| 能力 | 完整集成 | 通用降级方案 |
| --- | --- | --- |
| 提问 | 结构化用户输入 UI | 在对话中提出一个简洁的问题 |
| 知识检查 | 可交互的评分测验 | 在对话中给出选项，收到回答后再评分 |
| 事实核验 | 搜索工具或研究子代理 | 直接搜索；无法浏览时明确说明不确定性 |
| 可视化 | 图表或图像工具，并检查渲染结果 | Mermaid 源码、SVG 或紧凑的文本表示 |
| 课程笔记 | 已配置的笔记写入工具 | 经用户授权的 Markdown 文件，或仅保留在对话中 |
| 任务委派 | 专用子代理 | 由主代理直接完成 |

缺少任何可选能力都不会阻止核心教学流程运行。

## 可选 Pi 适配层

本仓库最初是一个 Pi 项目配置，因此以下文件仍作为可选的增强适配层保留：

- `extensions/ask-user-question.ts` — 用于偏好和方向选择的结构化提问
- `extensions/quiz.ts` — 提供即时反馈的评分测验
- `extensions/md-log.ts` — 整理后的 Markdown/Obsidian 课程笔记
- `extensions/skill-stats.ts` — 持久化统计 skill 调用次数
- `extensions/visual-tools/` — Mermaid 和 SVG 的创作及渲染工具
- `agents/` — Pi 专用的研究与可视化 agent 定义

如需使用这套适配层，请把仓库克隆为项目的 `.pi` 目录，并安装 Pi extension 所需的依赖：

```bash
git clone https://github.com/JinhaoGu/learn.git .pi
```

通用 skill 并不依赖这些 extension 或 agent 定义。其他 harness 可以用任意名称提供等价能力；skill 会根据实际可用的能力自行适配。

### Pi skill 调用统计

加载 Pi 适配层后，可以执行：

```text
/skill-stats
/skill-stats teach
```

统计器会记录显式的 `/skill:name` 命令和模型自动读取 `SKILL.md` 的行为。同一个 agent turn 中重复读取同一 skill 只计一次。统计从安装该 extension 后开始，数据保存在本机的 `~/.pi/agent/skill-usage.jsonl`；不会记录提示词或学习内容。

## 设计边界

教学理念可以跨 harness 移植，但 extension 的具体实现不行。TUI 弹窗、事件钩子和工具注册 API 必然属于特定宿主。与其假装这些 API 是通用的，本项目选择由 skill 定义行为与降级契约，再由每个 harness 提供自己的可选适配层。
