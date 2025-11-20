import React from 'react';

const PieChart = ({ data, title, colors, onSliceClick }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No data available
      </div>
    );
  }

  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No data available
      </div>
    );
  }

  // Calculate angles for pie slices
  let currentAngle = -90; // Start from top
  const slices = entries.map(([label, value], index) => {
    const percentage = (value / total) * 100;
    const angle = (value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate path for pie slice
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = 100 + 90 * Math.cos(startRad);
    const y1 = 100 + 90 * Math.sin(startRad);
    const x2 = 100 + 90 * Math.cos(endRad);
    const y2 = 100 + 90 * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M 100 100`,
      `L ${x1} ${y1}`,
      `A 90 90 0 ${largeArc} 1 ${x2} ${y2}`,
      `Z`
    ].join(' ');

    const color = colors[index % colors.length];

    return {
      label,
      value,
      percentage: percentage.toFixed(1),
      pathData,
      color
    };
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">{title}</h3>
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        {/* Pie Chart SVG with 3D Effect */}
        <div className="relative" style={{ perspective: '1000px' }}>
          <svg 
            viewBox="0 0 200 220" 
            className="w-64 h-64"
            style={{
              filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.15))',
              transform: 'rotateX(15deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* 3D Shadow/Depth slices */}
            {slices.map((slice, index) => (
              <g key={`shadow-${index}`}>
                <path
                  d={slice.pathData.replace(/M 100 100/g, 'M 100 110')}
                  fill={slice.color}
                  opacity="0.3"
                  filter="blur(2px)"
                />
              </g>
            ))}
            
            {/* Main slices with gradient */}
            {slices.map((slice, index) => {
              const gradientId = `gradient-${index}`;
              return (
                <g key={index}>
                  <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: slice.color, stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: slice.color, stopOpacity: 0.7 }} />
                    </linearGradient>
                  </defs>
                  <path
                    d={slice.pathData}
                    fill={`url(#${gradientId})`}
                    stroke="white"
                    strokeWidth="3"
                    className="hover:opacity-90 transition-all cursor-pointer hover:scale-105"
                    onClick={() => onSliceClick && onSliceClick(slice.label)}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                      transformOrigin: 'center',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <title>{`${slice.label}: ₹${slice.value.toLocaleString()} (${slice.percentage}%)`}</title>
                  </path>
                </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="space-y-2">
          {slices.map((slice, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
              onClick={() => onSliceClick && onSliceClick(slice.label)}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: slice.color }}
              ></div>
              <span className="flex-1">{slice.label}</span>
              <span className="font-semibold">${slice.value.toLocaleString()}</span>
              <span className="text-gray-500">({slice.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PieChart;
