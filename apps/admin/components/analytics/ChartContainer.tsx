"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LineConfig {
  type: "line";
  data: any[];
  xKey: string;
  lines: Array<{
    dataKey: string;
    stroke: string;
    name: string;
  }>;
}

interface BarConfig {
  type: "bar";
  data: any[];
  xKey: string;
  bars: Array<{
    dataKey: string;
    fill: string;
    name: string;
  }>;
}

interface PieConfig {
  type: "pie";
  data: any[];
  dataKey: string;
  nameKey: string;
}

type ChartConfig = LineConfig | BarConfig | PieConfig;

interface ChartContainerProps {
  title: string;
  description?: string;
  config: ChartConfig;
  height?: number;
}

export default function ChartContainer({
  title,
  description,
  config,
  height = 350,
}: ChartContainerProps) {
  const renderChart = () => {
    switch (config.type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={config.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={config.xKey} stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {config.lines.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.stroke}
                  name={line.name}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={config.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={config.xKey} stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              {config.bars.map((bar) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  fill={bar.fill}
                  name={bar.name}
                  radius={[8, 8, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={config.data}
                dataKey={config.dataKey}
                nameKey={config.nameKey}
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry) => `${entry[config.nameKey]}: ${entry[config.dataKey]}`}
                labelLine={true}
              >
                {config.data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || `hsl(${index * 45}, 70%, 50%)`}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  );
}