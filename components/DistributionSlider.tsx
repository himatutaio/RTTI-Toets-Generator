import React from 'react';

interface Props {
  label: string;
  value: number;
  color: string;
  onChange: (val: number) => void;
}

export const DistributionSlider: React.FC<Props> = ({ label, value, color, onChange }) => {
  return (
    <div className="flex flex-col gap-1 mb-2">
      <div className="flex justify-between text-sm font-medium text-gray-700">
        <span className={`flex items-center gap-2`}>
            <span className={`w-3 h-3 rounded-full ${color}`}></span>
            {label}
        </span>
        <span>{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
    </div>
  );
};
