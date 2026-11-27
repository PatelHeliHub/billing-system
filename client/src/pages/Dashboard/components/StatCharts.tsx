import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface ChartDataItem {
  name: string;
  value: number;
}

interface LegendItem {
  label: string;
  value: string | number;
  color: string;
}

interface StatChartsProps {
  data: ChartDataItem[];
  colors: string[];
  totalLabel: string;
  totalValue: string | number;
}

export const DoughnutChart: React.FC<StatChartsProps> = ({ data, colors, totalLabel, totalValue }) => {
  const totalSum = data.reduce((acc, current) => acc + current.value, 0);
  const chartData = totalSum === 0 ? [{ name: 'Empty', value: 1 }] : data;
  const chartColors = totalSum === 0 ? ['#e2e8f0'] : colors;

  return (
    <div style={{ width: '180px', height: '180px', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
            <Label 
               value={totalValue} 
               position="center" 
               dy={-5}
               style={{ fontSize: '20px', fontWeight: '700', fill: '#1e293b' }}
            />
            <Label 
               value={totalLabel} 
               position="center" 
               dy={15}
               style={{ fontSize: '12px', fill: '#64748b' }}
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ChartLegend: React.FC<{ items: LegendItem[] }> = ({ items }) => {
  return (
    <div className="chart-legend">
      {items.map((item, index) => (
        <div key={index} className="legend-item">
          <div className="legend-color" style={{ backgroundColor: item.color }}></div>
          <div className="legend-info">
            <span className="legend-value">{item.value}</span>
            <span className="legend-label">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
