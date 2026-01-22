import React, { useState, useRef } from 'react';
import { CameraSettings, CameraPose } from '../types';

interface CameraControlsProps {
  cameras: CameraPose[];
  activeId: string;
  onSelect: (id: string) => void;
  onUpdate: (id: string, settings: CameraSettings) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  disabled: boolean;
  onGenerate: () => void;
}

// 定义常用 3D 相机预设数据
const CAMERA_PRESETS = [
  { name: '正面', azimuth: 0, elevation: 0, zoom: 1.0, fov: 70, icon: '⏹️', desc: '' },
  { name: '反视角', azimuth: 180, elevation: 0, zoom: 1.0, fov: 70, icon: '🔄', desc: '180-degree reverse shot showing the back of the scene and the background behind the original camera.' },
  { name: '俯视', azimuth: 0, elevation: 85, zoom: 1.2, fov: 60, icon: '⬇️', desc: 'High angle bird\'s eye view looking down at the entire layout.' },
  { name: '仰视', azimuth: 0, elevation: -25, zoom: 1.1, fov: 75, icon: '⬆️', desc: 'Dramatic low angle looking up at the subject.' },
  { name: '鸟瞰', azimuth: 45, elevation: 45, zoom: 1.6, fov: 65, icon: '🦅', desc: 'Aerial perspective showing the surrounding environment.' },
  { name: '虫洞', azimuth: 10, elevation: -65, zoom: 0.7, fov: 110, icon: '🐛', desc: 'Extreme wide angle from a very low floor-level perspective.' },
  { name: '侧拍', azimuth: 75, elevation: 15, zoom: 1.3, fov: 55, icon: '📸', desc: 'Profile view showing the depth of the scene from the side.' },
];

// 增强版 3D 示意图：显示所有机位
const MultiCameraSchematic: React.FC<{ 
  cameras: CameraPose[];
  activeId: string;
  onUpdate: (id: string, settings: CameraSettings) => void;
  disabled: boolean;
}> = ({ cameras, activeId, onUpdate, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  
  const activePose = cameras.find(c => c.id === activeId) || cameras[0];
  const settings = activePose.settings;

  const r = 85; 
  const cx = 150;
  const cy = 100;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || disabled) return;
    const deltaX = e.clientX - lastPos.current.x;
    const deltaY = e.clientY - lastPos.current.y;
    const sensitivity = 0.6;

    let newAz = settings.azimuth + deltaX * sensitivity;
    let newEl = settings.elevation - deltaY * sensitivity;

    if (newAz > 180) newAz -= 360;
    if (newAz < -180) newAz += 360;
    newEl = Math.max(-90, Math.min(90, newEl));

    onUpdate(activeId, { ...settings, azimuth: Math.round(newAz), elevation: Math.round(newEl) });
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch(e){}
  };

  return (
    <div 
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`w-full h-full bg-[#0B0F19] relative overflow-hidden rounded-xl border border-slate-800 flex items-center justify-center touch-none select-none transition-all ${isDragging ? 'ring-1 ring-indigo-500/50' : ''} ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.2) 1px, transparent 1px)', 
          backgroundSize: '30px 30px',
          transform: `perspective(600px) rotateX(65deg) scale(2.5) rotateZ(${settings.azimuth * 0.1}deg)`,
          transformOrigin: '50% 100%',
      }}></div>

      <svg width="300" height="200" viewBox="0 0 300 200" className="relative z-10 pointer-events-none">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.25} fill="none" stroke="#1e293b" strokeWidth="1" />

        {cameras.map((pose) => {
          const isActive = pose.id === activeId;
          const pRadAz = (pose.settings.azimuth - 90) * (Math.PI / 180); 
          const pRadEl = pose.settings.elevation * (Math.PI / 180);
          const px = cx + r * Math.cos(pRadAz) * Math.cos(pRadEl);
          const py = cy + r * Math.sin(pRadEl) * -0.6;

          return (
            <g key={pose.id} opacity={isActive ? 1 : 0.3}>
              {isActive && (
                <line x1={cx} y1={cy} x2={px} y2={py} stroke="#f472b6" strokeWidth="1.5" strokeDasharray="3 3" />
              )}
              <g transform={`translate(${px}, ${py})`}>
                <circle r={isActive ? 10 : 6} fill={isActive ? "#f472b6" : "#6366f1"} opacity={isActive ? 0.2 : 0.1} filter={isActive ? "url(#glow)" : ""} />
                <rect x={isActive ? -10 : -6} y={isActive ? -6 : -4} width={isActive ? 20 : 12} height={isActive ? 12 : 8} rx="1" fill={isActive ? "#6366f1" : "#475569"} />
                <rect x={isActive ? 2 : 1} y={isActive ? -3 : -2} width={isActive ? 10 : 6} height={isActive ? 6 : 4} rx="0.5" fill="#818cf8" transform={`rotate(${-pose.settings.azimuth} 0 0)`} />
              </g>
            </g>
          );
        })}

        <g transform={`translate(${cx-12}, ${cy-16})`}>
          <rect width="24" height="32" fill="#334155" rx="2" />
          <circle cx="12" cy="12" r="6" fill="#fbbf24" />
        </g>
      </svg>
      
      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-slate-600 bg-black/40 px-2 py-0.5 rounded border border-white/5 uppercase">
        ACTIVE POSE: {activePose.name}
      </div>
    </div>
  );
};

export const CameraControls: React.FC<CameraControlsProps> = ({ 
  cameras, activeId, onSelect, onUpdate, onAdd, onRemove, disabled, onGenerate 
}) => {
  const activePose = cameras.find(c => c.id === activeId) || cameras[0];
  const settings = activePose.settings;

  const handleApplyPreset = (preset: typeof CAMERA_PRESETS[0]) => {
    onUpdate(activeId, {
      ...settings,
      azimuth: preset.azimuth,
      elevation: preset.elevation,
      zoom: preset.zoom,
      fov: preset.fov,
      description: preset.desc || settings.description, // 自动填充推荐的描述，帮助模型进行场景推理
    });
  };

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 flex flex-col h-full shadow-2xl overflow-hidden">
      <div className="bg-[#161f2e] border-b border-slate-700/50 p-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {cameras.map((pose) => (
          <div key={pose.id} className="relative group flex-shrink-0">
            <button
              onClick={() => onSelect(pose.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border ${
                activeId === pose.id 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              {pose.name}
            </button>
            {cameras.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(pose.id); }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button 
          onClick={onAdd}
          className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center transition-all"
          title="添加新机位"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-4 bg-[#0B0F19]">
          <MultiCameraSchematic cameras={cameras} activeId={activeId} onUpdate={onUpdate} disabled={disabled} />
        </div>

        <div className="w-full md:w-1/2 p-6 flex flex-col justify-start gap-6 bg-[#1e293b]/30 overflow-y-auto">
           <div>
              <div className="flex items-center gap-2 mb-3">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">常用 3D 机位预设</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                 {CAMERA_PRESETS.map(preset => (
                   <button
                     key={preset.name}
                     onClick={() => handleApplyPreset(preset)}
                     className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 transition-all group active:scale-95"
                   >
                     <span className="text-lg group-hover:scale-110 transition-transform">{preset.icon}</span>
                     <span className="text-[10px] text-slate-500 font-medium group-hover:text-slate-300">{preset.name}</span>
                   </button>
                 ))}
              </div>
           </div>

           <div className="flex flex-col gap-6">
              <div className="group">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 font-mono">
                    <span>水平方位角 (AZ)</span>
                    <span className="text-indigo-400">{settings.azimuth}°</span>
                  </div>
                  <input type="range" min="-180" max="180" value={settings.azimuth}
                    onChange={(e) => onUpdate(activeId, { ...settings, azimuth: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-[#22d3ee] cursor-pointer"
                  />
              </div>

              <div className="group">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 font-mono">
                    <span>垂直高度角 (EL)</span>
                    <span className="text-pink-400">{settings.elevation}°</span>
                  </div>
                  <input type="range" min="-90" max="90" value={settings.elevation}
                    onChange={(e) => onUpdate(activeId, { ...settings, elevation: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-[#f472b6] cursor-pointer"
                  />
              </div>

              <div className="group">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 font-mono">
                    <span>变焦倍数 (ZOOM)</span>
                    <span className="text-orange-400">{settings.zoom.toFixed(2)}x</span>
                  </div>
                  <input type="range" min="0.5" max="3.0" step="0.05" value={settings.zoom}
                    onChange={(e) => onUpdate(activeId, { ...settings, zoom: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-[#fb923c] cursor-pointer"
                  />
              </div>

              <div className="group">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 font-mono">
                    <span>视野范围 (FOV)</span>
                    <span className="text-emerald-400">{settings.fov}°</span>
                  </div>
                  <input type="range" min="10" max="120" step="1" value={settings.fov}
                    onChange={(e) => onUpdate(activeId, { ...settings, fov: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-[#10b981] cursor-pointer"
                  />
              </div>
           </div>

           <div>
              <div className="flex items-center justify-between mb-2">
                 <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-tighter flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
                    视角描述 (Prompt)
                 </span>
              </div>
              <textarea 
                placeholder="例如：极简主义风格，电影级光影..."
                value={settings.description || ''}
                onChange={(e) => onUpdate(activeId, { ...settings, description: e.target.value })}
                className="w-full h-20 bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
              />
           </div>
        </div>
      </div>

      <div className="p-4 bg-[#161f2e] border-t border-slate-700/50 flex justify-center">
         <button onClick={onGenerate} disabled={disabled}
            className="flex items-center gap-3 text-slate-300 hover:text-white transition-all disabled:opacity-30 text-sm font-semibold group py-1"
         >
            <div className="w-0 h-0 border-t-[7px] border-t-transparent border-l-[12px] border-l-current border-b-[7px] border-b-transparent group-hover:scale-110"></div>
            立即生成 {activePose.name} 视角
         </button>
      </div>
    </div>
  );
};