import React, { useState, useEffect } from 'react';
import { CameraSettings, GenerationStatus, CameraPose } from './types';
import { fileToRawBase64, generateNewView } from './services/geminiService';
import { CameraControls } from './components/CameraControls';
import { ImageDisplay } from './components/ImageDisplay';
import { OutputSettings } from './components/OutputSettings';
import { saveImage, loadImage } from './services/storageService';

const STORAGE_KEYS = {
  CAMERAS: 'viewshift_cameras',
  ACTIVE_CAM_ID: 'viewshift_active_id',
  ORIGINAL_IMG: 'viewshift_orig',
  GENERATED_IMG: 'viewshift_gen',
  MIME_TYPE: 'viewshift_mime'
};

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [rawBase64, setRawBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const initialSettings: CameraSettings = {
    azimuth: 0,
    elevation: 0,
    zoom: 1.0,
    fov: 70, // Default FOV
    aspectRatio: '1:1',
    count: 1,
    imageSize: '1K'
  };

  const [cameras, setCameras] = useState<CameraPose[]>([
    { id: 'cam-1', name: '机位 1', settings: { ...initialSettings } }
  ]);
  const [activeCameraId, setActiveCameraId] = useState<string>('cam-1');

  // Load state from storage on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // 1. Restore Key Status
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
        if (!selected) setStatus(GenerationStatus.NEEDS_KEY);

        // 2. Restore Settings from localStorage
        const savedCams = localStorage.getItem(STORAGE_KEYS.CAMERAS);
        const savedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_CAM_ID);
        const savedMime = localStorage.getItem(STORAGE_KEYS.MIME_TYPE);
        
        if (savedCams) setCameras(JSON.parse(savedCams));
        if (savedActiveId) setActiveCameraId(savedActiveId);
        if (savedMime) setMimeType(savedMime);

        // 3. Restore Images from IndexedDB (Big data)
        const savedOrig = await loadImage(STORAGE_KEYS.ORIGINAL_IMG);
        const savedGen = await loadImage(STORAGE_KEYS.GENERATED_IMG);

        if (savedOrig) {
          setRawBase64(savedOrig);
          // Convert raw base64 back to data URL for display
          setOriginalImage(`data:${savedMime || 'image/png'};base64,${savedOrig}`);
        }
        if (savedGen) {
          setGeneratedImage(savedGen);
        }
      } catch (err) {
        console.error("Failed to restore session", err);
      } finally {
        setIsInitializing(false);
      }
    };
    restoreSession();
  }, []);

  // Persist settings whenever they change
  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(cameras));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CAM_ID, activeCameraId);
  }, [cameras, activeCameraId, isInitializing]);

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setHasKey(true);
    setStatus(GenerationStatus.IDLE);
  };

  const activeCamera = cameras.find(c => c.id === activeCameraId) || cameras[0];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus(GenerationStatus.UPLOADING);
    setErrorMsg(null);
    setGeneratedImage(null);
    try {
      const displayUrl = URL.createObjectURL(file);
      const base64 = await fileToRawBase64(file);
      setOriginalImage(displayUrl);
      setRawBase64(base64);
      setMimeType(file.type);
      
      // Async Save to DB
      await saveImage(STORAGE_KEYS.ORIGINAL_IMG, base64);
      localStorage.setItem(STORAGE_KEYS.MIME_TYPE, file.type);
      
      setStatus(GenerationStatus.IDLE);
    } catch (err) {
      setErrorMsg("图片处理失败。");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleUpdateCamera = (id: string, newSettings: CameraSettings) => {
    setCameras(prev => prev.map(c => c.id === id ? { ...c, settings: newSettings } : c));
  };

  const handleAddCamera = () => {
    const nextId = `cam-${Date.now()}`;
    setCameras([...cameras, { id: nextId, name: `机位 ${cameras.length + 1}`, settings: { ...activeCamera.settings } }]);
    setActiveCameraId(nextId);
  };

  const handleRemoveCamera = (id: string) => {
    if (cameras.length <= 1) return;
    const newCameras = cameras.filter(c => c.id !== id);
    setCameras(newCameras);
    if (activeCameraId === id) setActiveCameraId(newCameras[0].id);
  };

  const handleGenerate = async () => {
    if (!rawBase64) return;
    setStatus(GenerationStatus.GENERATING);
    setErrorMsg(null);
    try {
      const newImageUrl = await generateNewView(rawBase64, mimeType, activeCamera.settings);
      setGeneratedImage(newImageUrl);
      setStatus(GenerationStatus.SUCCESS);
      
      // Async Save generated result
      await saveImage(STORAGE_KEYS.GENERATED_IMG, newImageUrl);
    } catch (err: any) {
      if (err.message === "KEY_NOT_FOUND") {
        setHasKey(false);
        setStatus(GenerationStatus.NEEDS_KEY);
        setErrorMsg("API Key 验证失败，请重新选择。");
      } else {
        setErrorMsg("生成失败。请确保您选择了付费项目的 API Key。");
        setStatus(GenerationStatus.ERROR);
      }
    }
  };

  const handleResetSession = async () => {
    if (window.confirm("确定要清空所有数据并重置吗？")) {
      localStorage.clear();
      // We'd ideally clear IndexedDB too
      setOriginalImage(null);
      setGeneratedImage(null);
      setRawBase64(null);
      setCameras([{ id: 'cam-1', name: '机位 1', settings: { ...initialSettings } }]);
      setActiveCameraId('cam-1');
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-xs font-mono tracking-widest uppercase">Restoring Session...</span>
        </div>
      </div>
    );
  }

  if (status === GenerationStatus.NEEDS_KEY) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-[#1e293b] p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">启用 Pro 渲染引擎</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            本应用已升级至 <span className="text-indigo-400 font-bold">Nano Banana Pro (Gemini 3 Pro)</span>，支持 4K 高画质和更强的 3D 理解。使用此模型需要您选择一个启用了计费功能的 API Key。
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleOpenKeySelector}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z"/></svg>
              选择付费 API Key
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              className="text-xs text-slate-500 hover:text-indigo-400 transition-colors underline underline-offset-4"
            >
              查看计费说明文档
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-['Inter'] pb-12">
      <header className="bg-[#1e293b] border-b border-slate-700/50 py-3 px-6 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">ViewShift Pro</h1>
                <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Nano Banana Pro Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                  onClick={handleResetSession}
                  className="text-xs text-slate-500 hover:text-red-400 px-3 py-1.5 transition-all"
                >
                  重置
                </button>
                <button 
                  onClick={handleOpenKeySelector}
                  className="text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
                >
                  切换 Key
                </button>
            </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-6">
        <ImageDisplay originalImage={originalImage} generatedImage={generatedImage} onUpload={handleFileUpload} isLoading={status === GenerationStatus.GENERATING} />

        <CameraControls 
          cameras={cameras} 
          activeId={activeCameraId}
          onSelect={setActiveCameraId}
          onUpdate={handleUpdateCamera}
          onAdd={handleAddCamera}
          onRemove={handleRemoveCamera}
          onGenerate={handleGenerate}
          disabled={status === GenerationStatus.GENERATING || !originalImage}
        />

        <OutputSettings 
          settings={activeCamera.settings} 
          onUpdate={(newS) => handleUpdateCamera(activeCameraId, newS)} 
        />

        {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-shake">
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
               {errorMsg}
            </div>
        )}
      </div>
    </div>
  );
};

export default App;