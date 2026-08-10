# ⚡ EV Motor & Controller Loss Analyzer Dashboard

A fully configurable EV drivetrain simulation dashboard — switch between **3-phase** and **6-phase** motor/inverter systems, configure vehicle parameters (GVW, frontal area, drag coefficient, rolling friction), motor parameters (poles, torque, current, speed), and run loss analysis over real drive cycles.




## ✨ Features

| Feature | Detail |
|---|---|
| **3-Phase / 6-Phase switching** | Toggle motor + inverter topology instantly |
| **Vehicle presets** | City bus, mini bus, heavy truck, mining truck |
| **Full physics engine** | Forces, torques, RPM, all configurable |
| **4-region current formula** | Per your datasheet — region 1–4 with PF/multiplier |
| **Drive cycles** | WLTC, City Bus, Highway, Indian Bus, or custom |
| **Loss breakdown** | Copper, iron, mechanical, IGBT conduction, switching |
| **Interactive charts** | Motor RPM, torque, power, current, losses over time |
| **Road grade** | Simulate uphill/downhill driving |
| **Export table** | Full data table of every simulation point |

## 🛠️ Local Development

```bash
# Clone
git clone https://github.com/YOUR-USERNAME/ev-motor-controller-dashboard.git
cd ev-motor-controller-dashboard

# Install
npm install

# Run dev server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Tech Stack
- **React 19** + TypeScript
- **Vite 7** (build tool)
- **Tailwind CSS 4**
- **Recharts** (charts)
- **Lucide React** (icons)

## 🔧 Project Structure
```
src/
├── App.tsx                    # Main app, all vehicle/motor/inverter config UI
├── utils/
│   └── motorPhysics.ts        # Physics engine — all calculations live here
└── components/
    ├── VehicleParams.tsx       # Specs panel
    ├── FormulaEditor.tsx       # Tune formula constants from UI
    ├── AnalysisCharts.tsx      # Recharts graphs
    ├── KPICards.tsx            # Summary stat cards
    ├── DataTable.tsx           # Row-by-row simulation data
    ├── LossPieChart.tsx        # Loss breakdown pie
    ├── DriveCycleEditor.tsx    # Drive cycle input
    └── CyclePreview.tsx        # Cycle speed preview chart
```

## 📐 Physics Reference

**Motor Current — 4 Regions:**
| Region | Condition | Formula |
|---|---|---|
| 1 | Power < 144kW AND rpm < 1600 | `((T/4.7)/1.414) × 0.84` |
| 2 | Power > 144kW AND rpm > 1600 | `Power_kW × 0.63` |
| 3 | Power < 144kW AND rpm > 1600 | `Power_kW × 1.05` |
| 4a | Power > 144kW AND rpm < 1600 AND torque > 1250 Nm | `((T/4.7)/1.414) × 0.725` |
| 4b | Power > 144kW AND rpm < 1600 AND torque ≤ 1250 Nm | `((T/4.7)/1.414) × 0.9` |

All formula constants are editable via the **Formulas** tab in the dashboard.

## 📄 License
MIT — free to use and modify.
