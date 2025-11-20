import React from 'react';

const LineChart = ({ data1, data2, label1, label2, title, color1 = '#3B82F6', color2 = '#10B981' }) => {
  if (!data1 && !data2) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No data available
      </div>
    );
  }

  // Combine all categories from both datasets
  const allCategories = new Set([
    ...Object.keys(data1 || {}),
    ...Object.keys(data2 || {})
  ]);
  
  const categories = Array.from(allCategories);
  
  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No data available
      </div>
    );
  }

  // Get values for each category
  const values1 = categories.map(cat => data1?.[cat] || 0);
  const values2 = categories.map(cat => data2?.[cat] || 0);
  
  // Find max value for scaling
  const maxValue = Math.max(...values1, ...values2, 100);
  const roundedMax = Math.ceil(maxValue / 100) * 100;
  
  // Chart dimensions
  const width = 800;
  const height = 400;
  const padding = { top: 40, right: 40, bottom: 100, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate positions
  const xStep = chartWidth / (categories.length > 1 ? categories.length - 1 : 1);
  
  const getYPosition = (value) => {
    return chartHeight - (value / roundedMax) * chartHeight;
  };
  
  const getXPosition = (index) => {
    if (categories.length === 1) return chartWidth / 2;
    return index * xStep;
  };
  
  // Create path for line 1
  const line1Path = values1.map((value, i) => {
    const x = getXPosition(i);
    const y = getYPosition(value);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  // Create path for line 2
  const line2Path = values2.map((value, i) => {
    const x = getXPosition(i);
    const y = getYPosition(value);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  // Y-axis labels
  const yLabels = [0, roundedMax / 4, roundedMax / 2, (3 * roundedMax) / 4, roundedMax];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">{title}</h3>
      
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '600px' }}>
          {/* Y-axis grid lines and labels */}
          {yLabels.map((label, i) => {
            const y = padding.top + getYPosition(label);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-600"
                >
                  ${label}
                </text>
              </g>
            );
          })}
          
          {/* X-axis */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            stroke="#9CA3AF"
            strokeWidth="2"
          />
          
          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="#9CA3AF"
            strokeWidth="2"
          />
          
          {/* X-axis labels */}
          {categories.map((category, i) => {
            const x = padding.left + getXPosition(i);
            const y = padding.top + chartHeight;
            return (
              <g key={i}>
                {/* Vertical grid line */}
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
                {/* Label */}
                <text
                  x={x}
                  y={y + 20}
                  textAnchor="end"
                  transform={`rotate(-45, ${x}, ${y + 20})`}
                  className="text-xs fill-gray-700"
                >
                  {category}
                </text>
              </g>
            );
          })}
          
          {/* Line 1 */}
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            <path
              d={line1Path}
              fill="none"
              stroke={color1}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Data points */}
            {values1.map((value, i) => (
              <circle
                key={i}
                cx={getXPosition(i)}
                cy={getYPosition(value)}
                r="5"
                fill={color1}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:r-7"
              >
                <title>{`${label1} - ${categories[i]}: $${value.toLocaleString()}`}</title>
              </circle>
            ))}
          </g>
          
          {/* Line 2 */}
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            <path
              d={line2Path}
              fill="none"
              stroke={color2}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Data points */}
            {values2.map((value, i) => (
              <circle
                key={i}
                cx={getXPosition(i)}
                cy={getYPosition(value)}
                r="5"
                fill={color2}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:r-7"
              >
                <title>{`${label2} - ${categories[i]}: $${value.toLocaleString()}`}</title>
              </circle>
            ))}
          </g>
          
          {/* Legend */}
          <g transform={`translate(${padding.left + 20}, 20)`}>
            <rect x="0" y="0" width="15" height="15" fill={color1} />
            <text x="20" y="12" className="text-sm fill-gray-700">{label1}</text>
            
            <rect x="150" y="0" width="15" height="15" fill={color2} />
            <text x="170" y="12" className="text-sm fill-gray-700">{label2}</text>
          </g>
        </svg>
      </div>
      
      {/* Data Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-4">Category</th>
              <th className="text-right py-2 px-4" style={{ color: color1 }}>{label1}</th>
              <th className="text-right py-2 px-4" style={{ color: color2 }}>{label2}</th>
              <th className="text-right py-2 px-4">Difference</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, i) => {
              const val1 = values1[i];
              const val2 = values2[i];
              const diff = val2 - val1;
              return (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 font-medium">{category}</td>
                  <td className="text-right py-2 px-4">${val1.toLocaleString()}</td>
                  <td className="text-right py-2 px-4">${val2.toLocaleString()}</td>
                  <td className={`text-right py-2 px-4 font-semibold ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {diff >= 0 ? '+' : ''}${diff.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LineChart;
