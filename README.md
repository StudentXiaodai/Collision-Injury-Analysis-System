# Collision Injury Analysis Demo

汽车碰撞人体伤害损失分析演示平台 — 基于物理与生物力学公式的乘员伤害评估工具。

## 项目简介

本项目是一个面向汽车安全工程的可视化原型系统，用于模拟和评估车辆碰撞过程中前排乘员受到的伤害风险。系统基于 FMVSS 208/214 等安全工程标准，通过输入碰撞场景参数、减速度脉冲曲线和乘员约束系统配置，计算出人体各部位的伤害指标（如 HIC15、Nij、VC 等）并给出风险等级评估。

### 核心功能

- **碰撞场景配置**：支持正面碰撞和侧面碰撞两种模式
- **减速度脉冲输入**：可自定义车辆碰撞减速度时序数据
- **乘员约束系统**：配置安全带、气囊、预紧器、限力器等参数
- **生物力学计算**：内置 HIC15、3ms 脉冲、Nij、VC 等标准伤害指标算法
- **伤害热力图**：可视化展示人体各部位（头、颈、胸、腹、骨盆、股骨）伤害风险
- **预设基准案例**：内置多种典型碰撞场景的 golden case 数据供快速测试

## 技术栈

| 类别    | 技术                    |
| ----- | --------------------- |
| 前端框架  | React 19 + TypeScript |
| 构建工具  | Vite 6                |
| 样式方案  | Tailwind CSS v4       |
| 后端服务  | Express.js            |
| 开发运行  | tsx (TypeScript 执行器)  |
| UI 图标 | Lucide React          |
| 动画库   | Motion                |

## 项目结构

```
collision-injury-analysis-demo/
├── src/
│   ├── components/          # 可复用 UI 组件
│   │   ├── CriteriaTable.tsx    # 伤害指标表格组件
│   │   ├── HeatmapBody.tsx      # 人体伤害热力图组件
│   │   ├── PulseChart.tsx       # 减速度脉冲曲线图组件
│   │   └── RiskSummary.tsx      # 风险汇总摘要组件
│   ├── domain/              # 核心业务逻辑（生物力学计算引擎）
│   │   ├── analysis/            # 分析流水线编排
│   │   ├── criteria/            # 伤害指标计算（HIC15/Nij/VC 等）
│   │   ├── proxy/               # 代理求解器（脉冲反推人体响应）
│   │   ├── pulse/               # 脉冲归一化处理
│   │   ├── risk/                # 风险曲线映射
│   │   └── types.ts             # TypeScript 类型定义
│   ├── shared/              # 共享工具（单位换算等）
│   ├── ui/
│   │   └── wizard/              # 向导式交互界面（5 步流程）
│   ├── App.tsx              # 应用主入口
│   ├── main.tsx             # React 挂载入口
│   └── index.css            # 全局样式
├── fixtures/
│   └── golden-cases/        # 预设基准碰撞场景数据
├── config/
│   └── biomechanics/        # 生物力学默认参数配置
├── server.ts                # Express 后端服务（含 API 路由）
├── vite.config.ts           # Vite 构建配置
├── tsconfig.json            # TypeScript 配置
├── package.json             # 项目依赖清单
└── index.html               # HTML 入口
```

## 快速开始

### 环境要求

- Node.js 18 或更高版本
- npm 或 pnpm 包管理器

### 安装与运行

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd collision-injury-analysis-demo
   ```
2. **安装依赖**
   ```bash
   npm install
   ```
3. **启动开发服务器**
   ```bash
   npm run dev
   ```
4. **访问应用**

   打开浏览器访问 `http://localhost:3000`

### 构建生产版本

```bash
npm run build    # 构建前端 + 打包后端
npm start        # 启动生产服务器
```

## 可用脚本

| 命令                | 说明                         |
| ----------------- | -------------------------- |
| `npm run dev`     | 启动开发模式（Express + Vite 热更新） |
| `npm run build`   | 构建生产版本                     |
| `npm start`       | 运行生产服务器                    |
| `npm run preview` | 预览构建结果                     |
| `npm run lint`    | TypeScript 类型检查            |

## API 接口

### 健康检查

```
GET /api/health
```

返回服务器状态和时间戳。

### 获取预设案例列表

```
GET /api/v1/golden-cases
```

返回所有内置基准碰撞场景的元数据。

### 获取特定案例详情

```
GET /api/v1/golden-cases/:id
```

返回指定案例的完整配置数据。

### 执行伤害分析

```
POST /api/v1/injury-analysis
```

**请求体示例：**

```json
{
  "mode": "vehicle_pulse_proxy",
  "occupant_model": "50th_percentile_male",
  "scenario": {
    "collision_type": "frontal",
    "vehicle_speed_kph": 50,
    "delta_v_kph": 40,
    "pdof_deg": 0
  },
  "signals": {
    "time_ms": [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    "accel_g": [0, -3, -8, -14, -24, -20, -13, -7, -3, -1, 0],
    "pulse_axis": "x"
  },
  "restraint": {
    "belted": true,
    "belt_type": "lap_shoulder",
    "frontal_airbag_deployed": true,
    "pretensioner": true,
    "load_limiter_kN": 4.0
  }
}
```

**响应体包含：** 各身体部位的风险评分、伤害等级（AIS）、判定指标值、置信度评估等。

## 伤害指标说明

| 指标          | 全称                           | 适用部位  | 说明                       |
| ----------- | ---------------------------- | ----- | ------------------------ |
| HIC15       | Head Injury Criterion (15ms) | 头部    | 头部伤害准则，评估 15ms 窗口内的最大伤害值 |
| 3ms Clip    | 3ms 加速度脉冲                    | 头部/胸部 | 持续超过 3ms 的加速度峰值          |
| Nij         | Neck Injury Criterion        | 颈部    | 颈部综合损伤指标，结合轴向力和弯矩        |
| VC          | Viscous Criterion            | 胸部    | 粘性准则，结合胸部压缩量和压缩速率        |
| Femur Force | 股骨轴向力                        | 股骨    | 股骨承受的轴向压缩力峰值             |

## 使用流程

1. **选择碰撞类型** — 正面碰撞或侧面碰撞
2. **配置冲击数据** — 输入车速、速度变化量（Delta-V）和减速度脉冲曲线
3. **设置乘员约束** — 配置安全带、气囊、预紧器等安全系统参数
4. **运行分析** — 系统基于生物力学模型计算伤害指标
5. **查看结果** — 展示各部位风险等级、伤害指标值和可视化热力图

## 内置基准案例

项目 `fixtures/golden-cases/` 目录下包含以下预设场景：

- `frontal-low-belted` — 正面低速碰撞（系安全带）
- `frontal-moderate-belted` — 正面中速碰撞（系安全带）
- `frontal-severe-unbelted` — 正面高速碰撞（未系安全带）
- `side-medium-intrusion` — 侧面中等侵入量碰撞
- `side-no-intrusion-low-confidence` — 侧面无侵入低置信度场景
- `criteria-direct-smoke` — 直接指标冒烟测试用例

## 注意事项

- 本软件为**可视化原型工具**，用于概念验证和设计参考
- 所有计算结果基于简化的物理模型和弹簧动力学方程
- **不可用于实际车辆安全认证或法规合规性判断**
- 专业碰撞分析请使用 LS-DYNA、MADYMO 等经过验证的工程软件

## License

MIT
