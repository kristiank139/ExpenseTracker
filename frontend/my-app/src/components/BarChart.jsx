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
      Groceries: '#2A9D8F',
      Transport: '#E76F51',
      "Eating out": '#F4A261',
      Items: '#72717a',
      Other: '#E9C46A',
    };

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <Bar dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || "#ccc"} />
            ))}
            <LabelList dataKey="value" position="top" />
          </Bar>

        </BarChart>
      </ResponsiveContainer>
    );
  }
}
