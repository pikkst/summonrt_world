import React, { useState, useRef, useMemo } from 'react';
import { useGameStore } from '../stores/gameStore.ts';
import { getAllNodes, canUnlockNode } from '../data/careerTree/index';
import type { CareerNode, CareerCategory } from '../data/careerTree/types';

const NODE_RADIUS = 18;
const TREE_WIDTH = 1000;
const TREE_HEIGHT = 600;

const CATEGORIES: CareerCategory[] = ['Blacksmith', 'Explorer', 'Official', 'Shopkeeper', 'Broker', 'Summoner'];

const categoryOrder: Record<string, number> = {
  Blacksmith: 0,
  Explorer: 1,
  Official: 2,
  Shopkeeper: 3,
  Broker: 4,
  Summoner: 5,
  General: 6,
};

const typeOrder: Record<string, number> = {
  minor: 0,
  notable: 1,
  keystone: 2,
};

function getNodePosition(node: CareerNode, index: number): { x: number; y: number } {
  if (node.id === 'root_hub') {
    return { x: 500, y: 60 };
  }
  const catIdx = categoryOrder[node.career_category] ?? 0;
  const typeIdx = typeOrder[node.type] ?? 0;
  const categoryNodes = Object.values(getAllNodes()).filter((n) => n.career_category === node.career_category);
  const nodeInCategory = categoryNodes.findIndex((n) => n.id === node.id);

  return {
    x: 120 + catIdx * 150,
    y: 160 + typeIdx * 120 + nodeInCategory * 15,
  };
}

export const SkillTreePanel: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const unlockSkill = useGameStore((s) => (s as any).unlockSkill);
  const respecAllNodes = useGameStore((s) => (s as any).respecAllNodes);
  const setScreen = (scr: any) => useGameStore.setState({ screen: scr });
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CareerCategory | 'All'>('All');

  if (!player) return null;

  const treeData = getAllNodes();
  const unlockedNodeIds = player.unlocked_node_ids || [];
  const unspentPoints = player.unspent_passive_points || 0;

  const relevantCategories = useMemo(() => {
    const cats = new Set<CareerCategory>();
    for (const nodeId of unlockedNodeIds) {
      const node = treeData[nodeId];
      if (node && node.career_category !== 'General') {
        cats.add(node.career_category);
      }
    }
    return cats;
  }, [unlockedNodeIds, treeData]);

  const filteredNodeList = useMemo(() => {
    const nodes = Object.values(treeData);
    if (activeCategory === 'All') return nodes;
    return nodes.filter((n) => n.career_category === activeCategory || n.id === 'root_hub');
  }, [treeData, activeCategory]);

  const getNodeStatus = (node: CareerNode) => {
    const isUnlocked = unlockedNodeIds.includes(node.id);
    if (isUnlocked) return 'unlocked';

    const prereqMet = node.connections.some((id) => unlockedNodeIds.includes(id));
    if (prereqMet && unspentPoints >= 1) return 'available';
    return 'locked';
  };

  const handleNodeClick = (node: CareerNode) => {
    const status = getNodeStatus(node);
    if (status === 'available') {
      unlockSkill(node.id);
    }
  };

  const getNodeColor = (node: CareerNode) => {
    const status = getNodeStatus(node);
    if (status === 'unlocked') return { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]' };
    if (status === 'available') return { bg: 'bg-indigo-500', border: 'border-indigo-400', text: 'text-indigo-400', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.5)]' };
    return { bg: 'bg-gray-800', border: 'border-gray-700', text: 'text-gray-600', glow: '' };
  };

  const connections: React.ReactElement[] = [];
  const filteredIds = new Set(filteredNodeList.map((n) => n.id));
  for (const node of filteredNodeList) {
    const pos = getNodePosition(node, filteredNodeList.indexOf(node));
    for (const targetId of node.connections) {
      const target = treeData[targetId];
      if (target && filteredIds.has(targetId) && node.id < targetId) {
        const targetPos = getNodePosition(target, filteredNodeList.indexOf(target));
        const isUnlocked = unlockedNodeIds.includes(node.id) && unlockedNodeIds.includes(targetId);
        const isAvailable = getNodeStatus(node) !== 'locked' && getNodeStatus(target) !== 'locked';
        connections.push(
          <line
            key={`${node.id}-${targetId}`}
            x1={pos.x}
            y1={pos.y}
            x2={targetPos.x}
            y2={targetPos.y}
            stroke={isUnlocked ? '#10b981' : isAvailable ? '#6366f1' : '#374151'}
            strokeWidth={isUnlocked ? 3 : 2}
            strokeDasharray={isAvailable ? '0' : '5,5'}
            opacity={isUnlocked || isAvailable ? 0.8 : 0.3}
          />
        );
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] border border-gray-900 rounded-lg overflow-hidden font-serif">
      <div className="p-4 border-b border-gray-900 bg-black/40 shrink-0">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
              <span>✨</span> Career Tree
            </h2>
            <p className="text-xs text-gray-500 italic mt-0.5">Passive progression. Choose your path wisely.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 bg-yellow-500/5 border border-yellow-500/20 rounded-md text-center">
              <span className="text-[10px] uppercase font-black tracking-widest text-yellow-500 block">Points</span>
              <span className="text-lg font-bold text-yellow-400">{unspentPoints} ⭐</span>
            </div>
            <button
              onClick={() => respecAllNodes()}
              className="px-3 py-1 bg-red-900/30 hover:bg-red-900/50 border border-red-800 rounded text-xs font-black uppercase tracking-widest transition-colors text-red-400"
            >
              Respec
            </button>
            <button
              onClick={() => setScreen('explore')}
              className="px-3 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs font-black uppercase tracking-widest transition-colors text-white"
            >
              Close
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mr-1 shrink-0">Filter:</span>
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-3 py-1 rounded border text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
              activeCategory === 'All'
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                : 'bg-black/40 border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded border text-[10px] font-black uppercase tracking-widest transition-all shrink-0 relative ${
                activeCategory === cat
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                  : 'bg-black/40 border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              {cat}
              {relevantCategories.has(cat) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto bg-[#050505] relative cursor-grab active:cursor-grabbing">
        <div className="relative" style={{ width: TREE_WIDTH, height: TREE_HEIGHT, minWidth: '100%', minHeight: '100%' }}>
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            {connections}
          </svg>

          {filteredNodeList.map((node) => {
            const pos = getNodePosition(node, filteredNodeList.indexOf(node));
            const status = getNodeStatus(node);
            const colors = getNodeColor(node);
            const isHovered = hoveredNode === node.id;
            const isOrigin = node.id === 'root_hub';

            return (
              <div
                key={node.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                  status === 'locked' ? 'opacity-40' : 'opacity-100'
                }`}
                style={{ left: pos.x, top: pos.y }}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div
                  className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                    colors.bg.replace('bg-', 'bg-').replace('/500', '/20')
                  } ${colors.border} ${colors.text} ${isHovered ? 'scale-125 z-50' : 'z-10'} ${
                    status === 'available' ? 'animate-pulse' : ''
                  } ${colors.glow}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-tight px-1">
                    {node.name.split(' ').map((w) => w[0]).join('').slice(0, 3)}
                  </span>

                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-64 bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl z-50">
                      <div className="text-xs font-black text-white uppercase tracking-wider mb-1">{node.name}</div>
                      <div className="text-[10px] text-gray-400 leading-relaxed mb-2">
                        {node.type} | {node.career_category}
                      </div>
                      <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Cost: 1 Point</div>
                      <div className="text-[9px] text-emerald-400 uppercase tracking-widest">
                        {status === 'unlocked' ? '✓ Unlocked' : status === 'available' ? 'Click to unlock' : 'Locked'}
                      </div>
                    </div>
                  )}
                </div>

                {isOrigin && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[8px] font-black text-yellow-500 uppercase tracking-widest whitespace-nowrap">
                    ORIGIN
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t border-gray-900 bg-black/40 flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-gray-400">Unlocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <span className="text-gray-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-700"></div>
          <span className="text-gray-400">Locked</span>
        </div>
      </div>
    </div>
  );
};
