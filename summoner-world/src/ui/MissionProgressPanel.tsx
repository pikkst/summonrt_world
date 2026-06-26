import React, { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import type { ActiveMission, MissionStatus } from '../core/missionQueue';

const MISSION_TYPE_LABELS: Record<string, string> = {
  EXPLORE_TIER_1: 'Explore Sector',
  SCOUT_DUNGEON: 'Dungeon Scout',
  SMELT_ORE: 'Smelt Ore',
  CRAFT_ITEM: 'Craft Item',
  STORE_VISIT: 'Store Visit',
  TAX_EDICT: 'Tax Edict',
  CARAVAN_ROUTE: 'Caravan Route',
};

const STATUS_COLORS: Record<MissionStatus, string> = {
  PENDING: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  IN_PROGRESS: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  FAILED: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  CANCELLED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const STATUS_LABELS: Record<MissionStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export const MissionProgressPanel: React.FC = () => {
  const missions = useGameStore((s) => s.missions);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeMissions = missions.filter(m => m.status === 'IN_PROGRESS');
  const pendingMissions = missions.filter(m => m.status === 'PENDING');
  const completedMissions = missions.filter(m => m.status === 'COMPLETED');
  const failedMissions = missions.filter(m => m.status === 'FAILED');
  const cancelledMissions = missions.filter(m => m.status === 'CANCELLED');

  const getRemainingSeconds = (mission: ActiveMission): number => {
    return Math.max(0, Math.ceil((mission.end_time - currentTime) / 1000));
  };

  const getProgressPercent = (mission: ActiveMission): number => {
    const elapsed = currentTime - mission.start_time;
    const total = mission.duration_seconds * 1000;
    if (total <= 0) return 0;
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  if (missions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter mb-1">Mission Queue</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No active missions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-white italic tracking-tighter mb-1">Mission Queue</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
            {activeMissions.length} active · {pendingMissions.length} pending · {completedMissions.length} completed
          </p>
        </div>
        <div className="text-[9px] font-mono text-gray-600">
          Total: {missions.length}
        </div>
      </div>

      {activeMissions.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Missions</div>
          {activeMissions.map((mission) => {
            const remaining = getRemainingSeconds(mission);
            const progress = getProgressPercent(mission);
            return (
              <div key={mission.mission_id} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                      {MISSION_TYPE_LABELS[mission.type] || mission.type}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-bold">
                      World Layer {mission.world_layer}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-[9px] font-black uppercase rounded tracking-widest border ${STATUS_COLORS[mission.status]}`}>
                    {STATUS_LABELS[mission.status]}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-indigo-400 font-bold">Time Remaining</span>
                    <span className="text-white animate-pulse">{formatTimeRemaining(remaining)}</span>
                  </div>
                  <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden p-[1px] border border-gray-800">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {mission.assigned_creatures.length > 0 && (
                  <div className="text-[9px] text-gray-500 font-bold uppercase">
                    Assigned: {mission.assigned_creatures.length} creature(s)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pendingMissions.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</div>
          <div className="space-y-2">
            {pendingMissions.map((mission) => (
              <div key={mission.mission_id} className="flex justify-between items-center bg-gray-950/50 border border-gray-800 rounded-lg p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {MISSION_TYPE_LABELS[mission.type] || mission.type}
                </span>
                <span className={`px-2 py-1 text-[9px] font-black uppercase rounded tracking-widest border ${STATUS_COLORS[mission.status]}`}>
                  {STATUS_LABELS[mission.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedMissions.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Recently Completed</div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {completedMissions.slice(-5).map((mission) => (
              <div key={mission.mission_id} className="flex justify-between items-center bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">
                  {MISSION_TYPE_LABELS[mission.type] || mission.type}
                </span>
                <span className={`px-2 py-1 text-[9px] font-black uppercase rounded tracking-widest border ${STATUS_COLORS[mission.status]}`}>
                  {STATUS_LABELS[mission.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {failedMissions.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Failed</div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {failedMissions.slice(-5).map((mission) => (
              <div key={mission.mission_id} className="flex justify-between items-center bg-rose-500/5 border border-rose-500/20 rounded-lg p-3">
                <span className="text-[10px] font-bold text-rose-400 uppercase">
                  {MISSION_TYPE_LABELS[mission.type] || mission.type}
                </span>
                <span className={`px-2 py-1 text-[9px] font-black uppercase rounded tracking-widest border ${STATUS_COLORS[mission.status]}`}>
                  {STATUS_LABELS[mission.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cancelledMissions.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Cancelled</div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {cancelledMissions.slice(-5).map((mission) => (
              <div key={mission.mission_id} className="flex justify-between items-center bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                <span className="text-[10px] font-bold text-amber-400 uppercase">
                  {MISSION_TYPE_LABELS[mission.type] || mission.type}
                </span>
                <span className={`px-2 py-1 text-[9px] font-black uppercase rounded tracking-widest border ${STATUS_COLORS[mission.status]}`}>
                  {STATUS_LABELS[mission.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};