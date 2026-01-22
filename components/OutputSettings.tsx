import React from 'react';
import { CameraSettings } from '../types';

interface OutputSettingsProps {
    settings: CameraSettings;
    onUpdate: (newSettings: CameraSettings) => void;
}

export const OutputSettings: React.FC<OutputSettingsProps> = ({ settings, onUpdate }) => {
    
    const aspectRatios = ["1:1", "4:3", "3:4", "16:9", "9:16"];
    const sizes = ["1K", "2K", "4K"] as const;

    return (
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-700/50 pb-4">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg>
               <h3 className="text-white font-bold text-sm">Pro 输出配置</h3>
            </div>

            <div className="flex flex-col gap-8">
                
                {/* Image Resolution */}
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-32">
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">画质分辨率</span>
                        <span className="text-[9px] text-indigo-400 font-mono">Nano Banana Pro Only</span>
                    </div>
                    <div className="flex flex-1 gap-2">
                        {sizes.map(size => (
                            <button
                                key={size}
                                onClick={() => onUpdate({...settings, imageSize: size})}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${
                                    settings.imageSize === size 
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
                                }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Aspect Ratio */}
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <span className="text-slate-400 text-xs font-bold w-32 uppercase tracking-wider">输出宽高比</span>
                    <div className="flex flex-1 gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                        {aspectRatios.map(ratio => (
                            <button
                                key={ratio}
                                onClick={() => onUpdate({...settings, aspectRatio: ratio})}
                                className={`flex-1 min-w-[70px] py-2.5 rounded-xl text-xs font-medium border transition-all ${
                                    settings.aspectRatio === ratio 
                                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
                                }`}
                            >
                                {ratio}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-indigo-300 text-[11px] flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div className="leading-relaxed">
                   <strong>Pro 模式提示:</strong> 2K 和 4K 生成可能需要更长的渲染时间。该模型会自动结合 Google 搜索结果以获得更精确的物体表面材质和现代环境细节。
                </div>
            </div>
        </div>
    );
};