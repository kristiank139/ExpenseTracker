import React, { PureComponent } from 'react';
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis, LabelList } from 'recharts';

export default class CustomBarChart extends PureComponent {
  render() {
    const chartData = Object.entries(this.props.categoryElements).map(([category, value]) => ({
      name: category,
      value: Number(value.amount.toFixed(2)),
    }));
  console.log(chartData)

    const categoryColors = {
      "groceries": '#2A9D8F',
      "transport": '#E76F51',
      "eating out": '#F4A261',
      "items": '#72717a',
      "subscriptions": '#264653',
      "other": '#E9C46A',
    };

    return (
      <div align="center">
        <ResponsiveContainer width="85%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <Bar dataKey="value" barSize={90}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || "#ccc"} />
              ))}
              <LabelList dataKey="value" position="top" />
            </Bar>

          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
}
