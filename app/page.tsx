'use client';

import { useState } from 'react';
import AfisProgram from '@/components/AfisProgram';

export default function Home() {
  const [scale, setScale] = useState(1);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mb-4">
        <label htmlFor="scale" className="block text-sm font-medium mb-1">
          Méretarány: {Math.round(scale * 100)}%
        </label>
        <input
          id="scale"
          type="range"
          min="0.75"
          max="1.25"
          step="0.01"
          value={scale}
          onChange={(e) => setScale(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <AfisProgram />
      </div>
    </div>
  );
}