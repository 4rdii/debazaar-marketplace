import React, { useState, useRef, useEffect } from 'react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  className?: string;
  thumbColors?: [string, string];
}

export function DualRangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  formatValue,
  className = '',
  thumbColors = ['#1D9BF0', '#22D3EE'],
}: DualRangeSliderProps) {
  const [isDraggingMin, setIsDraggingMin] = useState(false);
  const [isDraggingMax, setIsDraggingMax] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const minValue = value[0];
  const maxValue = value[1];

  const formatDisplayValue = (val: number) => {
    if (formatValue) return formatValue(val);
    return val.toString();
  };

  const getPercentage = (val: number) => {
    return ((val - min) / (max - min)) * 100;
  };

  const getValueFromPosition = (clientX: number) => {
    if (!trackRef.current) return min;
    
    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const rawValue = (percentage / 100) * (max - min) + min;
    return Math.round(rawValue / step) * step;
  };

  const handleMouseMove = (e: MouseEvent) => {
    const newValue = getValueFromPosition(e.clientX);
    
    if (isDraggingMin) {
      onChange([Math.min(newValue, maxValue), maxValue]);
    } else if (isDraggingMax) {
      onChange([minValue, Math.max(newValue, minValue)]);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingMin(false);
    setIsDraggingMax(false);
  };

  useEffect(() => {
    if (isDraggingMin || isDraggingMax) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingMin, isDraggingMax, minValue, maxValue]);

  const minPercentage = getPercentage(minValue);
  const maxPercentage = getPercentage(maxValue);

  return (
    <div className={className}>
      {/* Slider Track */}
      <div className="relative" ref={trackRef}>
        {/* Background Track */}
        <div className="h-2 bg-white/10 rounded-full relative">
          {/* Active Range */}
          <div
            className="absolute h-full bg-gradient-to-r from-[#1D9BF0] to-[#22D3EE] rounded-full"
            style={{
              left: `${minPercentage}%`,
              right: `${100 - maxPercentage}%`,
            }}
          />
        </div>

        {/* Min Handle */}
        <button
          className="absolute top-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B1220]"
          style={{ 
            left: `${minPercentage}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: thumbColors[0],
            focusRingColor: thumbColors[0]
          }}
          onMouseDown={() => setIsDraggingMin(true)}
          aria-label="Minimum value"
        />

        {/* Max Handle */}
        <button
          className="absolute top-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B1220]"
          style={{
            left: `${maxPercentage}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: thumbColors[1],
            focusRingColor: thumbColors[1]
          }}
          onMouseDown={() => setIsDraggingMax(true)}
          aria-label="Maximum value"
        />
      </div>
    </div>
  );
}