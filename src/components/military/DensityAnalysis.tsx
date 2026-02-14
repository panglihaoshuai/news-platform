/**
 * Military Density Analysis Component
 * 
 * Displays global military asset distribution and density analysis
 * 
 * @module src/components/military/DensityAnalysis
 */

'use client';

import React from 'react';
import { MilitaryVessel, USBase } from '@/lib/military/types';
import { 
  calculateDensityByRegion, 
  getGlobalDistribution,
  findNearestBase 
} from '@/lib/military/trajectory';

interface DensityAnalysisProps {
  vessels: MilitaryVessel[];
  bases: USBase[];
  className?: string;
}

interface RegionData {
  name: string;
  nameCn: string;
  vessels: number;
  bases: number;
  density: number;
}

const REGION_NAMES: Record<string, { en: string; cn: string }> = {
  pacific: { en: 'Pacific', cn: '太平洋' },
  middleeast: { en: 'Middle East', cn: '中东' },
  europe: { en: 'Europe', cn: '欧洲' },
  india: { en: 'Indian Ocean', cn: '印度洋' },
  americas: { en: 'Americas', cn: '美洲' },
  africa: { en: 'Africa', cn: '非洲' },
};

export const DensityAnalysis: React.FC<DensityAnalysisProps> = ({
  vessels,
  bases,
  className = '',
}) => {
  // Calculate density data
  const densityData = calculateDensityByRegion(vessels, bases);
  const distribution = getGlobalDistribution(vessels);
  
  // Convert to array and sort by density
  const regions: RegionData[] = Object.entries(densityData)
    .map(([region, data]) => ({
      name: REGION_NAMES[region]?.en || region,
      nameCn: REGION_NAMES[region]?.cn || region,
      vessels: data.vessels,
      bases: data.bases,
      density: data.density,
    }))
    .sort((a, b) => b.density - a.density);
  
  const maxVessels = Math.max(...regions.map(r => r.vessels), 1);
  
  return (
    <div className={`bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-white mb-3">
        Global Distribution Density
      </h3>
      
      {/* Region Bars */}
      <div className="space-y-2 mb-4">
        {regions.map((region) => (
          <div key={region.name} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-20">{region.nameCn}</span>
            <div className="flex-1 h-4 bg-gray-800 rounded overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${(region.vessels / maxVessels) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-8 text-right">
              {region.vessels}
            </span>
          </div>
        ))}
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-800 rounded p-2">
          <div className="text-gray-400">Total Vessels</div>
          <div className="text-white font-semibold">{distribution.totalVessels}</div>
        </div>
        <div className="bg-gray-800 rounded p-2">
          <div className="text-gray-400">Total Bases</div>
          <div className="text-white font-semibold">{bases.length}</div>
        </div>
      </div>
      
      {/* Status Breakdown */}
      {Object.keys(distribution.byStatus).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">By Status</div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(distribution.byStatus).map(([status, count]) => (
              <span 
                key={status}
                className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded"
              >
                {status}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DensityAnalysis;
