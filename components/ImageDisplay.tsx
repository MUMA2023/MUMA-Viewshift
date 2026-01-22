import React, { useState } from 'react';

interface ImageDisplayProps {
  originalImage: string | null;
  generatedImage: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  originalImage, 
  generatedImage, 
  onUpload,
  isLoading 
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      
      {/* Lightbox Modal */}
      {isPreviewOpen && generatedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-12 cursor-zoom-out animate-in fade-in duration-300"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative max-w-full max-h-full flex items-center justify-center">
             <img 
               src={generatedImage} 
               alt="Preview" 
               className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
             />
             <button 
               className="absolute -top-12 right-0 text-white/70 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
               onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(false); }}
             >
               关闭预览
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
             </button>
          </div>
        </div>
      )}

      {/* Input Reference Card */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 flex flex-col h-[500px]">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="text-white font-medium flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            输入参考图
          </h3>
          <button className="text-slate-500 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          </button>
        </div>
        
        <div className="flex-1 p-4">
          <div className="w-full h-full rounded-xl border-2 border-dashed border-indigo-500/30 bg-slate-900/50 relative group overflow-hidden flex flex-col items-center justify-center transition-colors hover:border-indigo-500/60">
            {originalImage ? (
              <>
                <img 
                  src={originalImage} 
                  alt="Original" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <label className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-600 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all">
                     更换图片
                     <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
                   </label>
                </div>
              </>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-slate-500 hover:text-indigo-400 transition-colors">
                <svg className="w-12 h-12 mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                <span className="text-sm font-medium">上传或拖拽图片</span>
                <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Result Card */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 flex flex-col h-[500px]">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="text-white font-medium flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m2 12 5-5m0 0 5 5"/></svg>
            生成结果 {generatedImage ? '(1)' : '(0)'}
          </h3>
          {generatedImage && (
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
              就绪
            </span>
          )}
        </div>

        <div className="flex-1 p-4 bg-[#0B0F19] relative">
          {isLoading ? (
             <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-center">
                  <span className="text-indigo-400 text-xs font-mono tracking-widest block animate-pulse mb-1">PRO RENDERING...</span>
                  <span className="text-[10px] text-slate-500">正在分析 3D 深度与光影细节</span>
                </div>
             </div>
          ) : generatedImage ? (
             <div className="w-full h-full relative group cursor-zoom-in" onClick={() => setIsPreviewOpen(true)}>
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-slate-900/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                    单击放大预览
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <a 
                    href={generatedImage} 
                    download="gemini_render.png"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg shadow-lg flex items-center justify-center transition-colors"
                    title="下载高清图"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  </a>
                </div>
             </div>
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                <svg className="w-20 h-20 mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span className="text-xs font-mono tracking-widest opacity-40 uppercase">Awaiting Pro Input</span>
             </div>
          )}
        </div>
      </div>

    </div>
  );
};