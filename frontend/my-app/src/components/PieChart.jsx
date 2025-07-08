import React, { PureComponent } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default class CustomPieChart extends PureComponent {

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
      <ResponsiveContainer width="100%" height="100%">
        <PieChart width={400} height={400}>
          <Pie
            data={chartData}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || '#ccc'} />
            ))} 
          </Pie>  
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }
}
