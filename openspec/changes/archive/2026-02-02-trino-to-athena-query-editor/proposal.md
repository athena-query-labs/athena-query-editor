## Why

当前 UI 仅支持 Trino 后端，无法直接用于已标准化使用 Athena 的团队。将后端切换到 Athena API 可降低接入成本，并让现有 UI 能直接在 AWS 环境中使用。

## What Changes

- 将查询执行、状态轮询、结果获取、元数据获取从 Trino API 切换为 Athena API
- 调整连接与认证方式以适配 AWS（如凭证、区域、工作组、S3 输出位置）
- 更新错误处理与状态映射以匹配 Athena 的异步查询模型

## Capabilities

### New Capabilities
- `athena-backend-integration`: 使用 Athena API 执行查询、轮询状态、获取结果与元数据
- `athena-auth-and-config`: 提供 AWS 认证与连接配置（区域、工作组、S3 输出位置等）

### Modified Capabilities
<!-- 无已有 spec，可留空 -->

## Impact

- 前端与后端交互协议/接口
- 查询执行与结果展示流程
- 配置/环境变量、部署与运行文档
- 依赖的后端服务从 Trino 切换为 AWS Athena API
