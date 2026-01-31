
import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, X, Sun, Moon, Languages, Sparkles, Wand2, Download, 
  Loader2, AlertCircle, Trash2, Image as ImageIcon,
  Upload, Send, Paperclip, User, Bot, Brain, Globe, FileJson, 
  ChefHat, Zap, Scissors, Camera as CameraIcon
} from 'lucide-react';
import { TRANSLATIONS, MENU_ICONS } from './constants';
import { MenuId, AppLanguage, ChatMessage, RecipeResult } from './types';
import { gemini } from './geminiService';

const App: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<MenuId>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<AppLanguage>('id');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [sourceImage1, setSourceImage1] = useState<string | null>(null);
  const [sourceImage2, setSourceImage2] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("1:1");

  const [chatInput, setChatInput] = useState("");
  const [chatAttachment, setChatAttachment] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [recipeInput, setRecipeInput] = useState("");
  const [recipeResult, setRecipeResult] = useState<RecipeResult | null>(null);
  const [livePrompt, setLivePrompt] = useState("");
  const [liveResult, setLiveResult] = useState<{ summary: string, imageUrl: string } | null>(null);

  const txt = TRANSLATIONS[lang];

  useEffect(() => {
    setError(null);
    setGeneratedImage(null);
    const menuPrompts: Record<string, string> = {
      'text-to-image': txt.promptTxtImg,
      'image-to-image': txt.promptImgTrans,
      'photorealistic': txt.promptPhoto,
      'sticker-design': txt.promptSticker,
      'logo-creator': txt.promptLogo,
      'product-mockup': txt.promptProduct,
      'sequential-art': txt.promptComic,
      'smart-editor': txt.promptSmart,
      'style-transfer': txt.promptStyle,
      'fashion-composite': txt.promptFashion,
      'sketch-to-real': txt.promptSketch,
      'character-lab': txt.promptChar,
      'live-visuals': txt.promptLive,
      'recipe-extractor': txt.promptRecipe,
    };
    if (menuPrompts[activeMenu]) setPrompt(menuPrompts[activeMenu]);
    if (activeMenu === 'chat' && chatHistory.length === 0) {
      setChatHistory([{
        role: 'model',
        parts: [{ type: 'text', text: lang === 'en' ? "Welcome to Magic Chat! How can I assist you?" : "Selamat datang di Magic Chat! Ada yang bisa saya bantu?" }]
      }]);
    }
  }, [activeMenu, lang]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (slot === 1) setSourceImage1(reader.result as string);
        else setSourceImage2(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const captureCamera = async (slot: 1 | 2) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/png');
      if (slot === 1) setSourceImage1(dataUrl);
      else setSourceImage2(dataUrl);
      
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setError("Camera access denied or not available");
    }
  };

  const generateAction = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let res;
      if (sourceImage1) res = await gemini.transformImage(prompt, [sourceImage1, ...(sourceImage2 ? [sourceImage2] : [])]);
      else res = await gemini.generateImage(prompt, aspectRatio);
      setGeneratedImage(res);
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !chatAttachment) return;
    const userMsg: ChatMessage = { role: 'user', parts: [] };
    if (chatAttachment) userMsg.parts.push({ type: 'image', url: chatAttachment });
    if (chatInput.trim()) userMsg.parts.push({ type: 'text', text: chatInput });

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setChatAttachment(null);
    setChatLoading(true);
    try {
      const history = [...chatHistory, userMsg].map(msg => ({
        role: msg.role,
        parts: msg.parts.map(p => p.type === 'text' ? { text: p.text } : { inlineData: { data: p.url!.split(',')[1], mimeType: 'image/png' } })
      }));
      const res = await gemini.chat(history);
      setChatHistory(prev => [...prev, { role: 'model', parts: res as any }]);
    } catch (err) {
      setError("Chat failed");
    } finally {
      setChatLoading(false);
    }
  };

  const themeClasses = {
    bg: isDarkMode ? "bg-slate-950" : "bg-slate-50",
    sidebar: isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200",
    card: isDarkMode ? "bg-slate-900/40 border-slate-800/50 backdrop-blur-md" : "bg-white/60 border-slate-200 backdrop-blur-md",
    input: isDarkMode ? "bg-slate-800/50 border-slate-700 text-white" : "bg-slate-100 border-slate-200 text-slate-800",
    textPrimary: isDarkMode ? "text-slate-100" : "text-slate-900",
    textSecondary: isDarkMode ? "text-slate-400" : "text-slate-500",
  };

  return (
    <div className={`flex h-screen overflow-hidden ${themeClasses.bg} ${themeClasses.textPrimary} transition-colors duration-500`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r ${themeClasses.sidebar} transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-inherit">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20"><Sparkles className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">Magic Studio</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">by Abi Hisan</p>
          </div>
          <button className="md:hidden ml-auto" onClick={() => setIsMobileMenuOpen(false)}><X className="w-5 h-5"/></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <SidebarButton id="home" active={activeMenu === 'home'} label={txt.menuHome} onClick={() => setActiveMenu('home')} />
          <SectionLabel label={txt.catGeneral} />
          <SidebarButton id="text-to-image" active={activeMenu === 'text-to-image'} label={txt.menuTxtImg} onClick={() => setActiveMenu('text-to-image')} />
          <SidebarButton id="image-to-image" active={activeMenu === 'image-to-image'} label={txt.menuImgTrans} onClick={() => setActiveMenu('image-to-image')} />
          <SectionLabel label={txt.catSpecialized} />
          <SidebarButton id="photorealistic" active={activeMenu === 'photorealistic'} label={txt.menuPhoto} onClick={() => setActiveMenu('photorealistic')} />
          <SidebarButton id="sticker-design" active={activeMenu === 'sticker-design'} label={txt.menuSticker} onClick={() => setActiveMenu('sticker-design')} />
          <SidebarButton id="logo-creator" active={activeMenu === 'logo-creator'} label={txt.menuLogo} onClick={() => setActiveMenu('logo-creator')} />
          <SectionLabel label={txt.catAdvanced} />
          <SidebarButton id="smart-editor" active={activeMenu === 'smart-editor'} label={txt.menuSmart} onClick={() => setActiveMenu('smart-editor')} />
          <SidebarButton id="fashion-composite" active={activeMenu === 'fashion-composite'} label={txt.menuFashion} onClick={() => setActiveMenu('fashion-composite')} />
          <SectionLabel label={txt.catTools} />
          <SidebarButton id="live-visuals" active={activeMenu === 'live-visuals'} label={txt.menuLive} onClick={() => setActiveMenu('live-visuals')} />
          <SidebarButton id="recipe-extractor" active={activeMenu === 'recipe-extractor'} label={txt.menuRecipe} onClick={() => setActiveMenu('recipe-extractor')} />
          <SidebarButton id="chat" active={activeMenu === 'chat'} label={txt.menuChat} onClick={() => setActiveMenu('chat')} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        <header className={`h-16 flex items-center justify-between px-6 border-b ${themeClasses.sidebar} backdrop-blur-xl z-40`}>
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}><Menu className="w-6 h-6"/></button>
            <h2 className="font-bold">{activeMenu === 'home' ? txt.welcome : txt[`menu${activeMenu.replace(/-./g, x => x[1].toUpperCase()).replace(/^./, x => x.toUpperCase())}` as keyof typeof txt]}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(lang === 'en' ? 'id' : 'en')} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><Languages className="w-5 h-5"/></button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">{isDarkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-16">
          {activeMenu === 'home' ? (
            <HomeView theme={themeClasses} txt={txt} onExplore={setActiveMenu}/>
          ) : ['chat', 'recipe-extractor', 'live-visuals'].includes(activeMenu) ? (
            <div className="max-w-4xl mx-auto h-full">
              {activeMenu === 'chat' && <ChatView history={chatHistory} loading={chatLoading} input={chatInput} onInputChange={setChatInput} onSubmit={handleChatSubmit} theme={themeClasses} chatEndRef={chatEndRef} onFileSelect={setChatAttachment} attachment={chatAttachment} onRemoveAttachment={() => setChatAttachment(null)}/>}
              {activeMenu === 'recipe-extractor' && <RecipeView input={recipeInput} onInputChange={setRecipeInput} loading={loading} result={recipeResult} onExtract={async () => { setLoading(true); try { setRecipeResult(await gemini.extractRecipe(recipeInput)); } catch(e){ setError("Failed"); } finally { setLoading(false); }}} theme={themeClasses} txt={txt}/>}
              {activeMenu === 'live-visuals' && <LiveView input={livePrompt} onInputChange={setLivePrompt} loading={loading} result={liveResult} onGenerate={async () => { setLoading(true); try { setLiveResult(await gemini.getLiveVisuals(livePrompt)); } catch(e){ setError("Search failed"); } finally { setLoading(false); }}} theme={themeClasses} txt={txt}/>}
            </div>
          ) : (
            <StudioView 
              prompt={prompt} 
              onPromptChange={setPrompt} 
              loading={loading} 
              generatedImage={generatedImage} 
              source1={sourceImage1} 
              source2={sourceImage2} 
              onUpload1={handleImageUpload} 
              onUpload2={handleImageUpload} 
              onRemove1={() => setSourceImage1(null)} 
              onRemove2={() => setSourceImage2(null)} 
              onCapture1={() => captureCamera(1)}
              onCapture2={() => captureCamera(2)}
              onGenerate={generateAction} 
              aspectRatio={aspectRatio} 
              onAspectRatioChange={setAspectRatio} 
              theme={themeClasses} 
              txt={txt} 
              error={error}
              activeMenu={activeMenu}
            />
          )}
        </div>

        <footer className={`h-8 border-t ${themeClasses.sidebar} flex items-center px-4 overflow-hidden`}>
          <div className="animate-marquee whitespace-nowrap text-[10px] font-bold uppercase tracking-widest opacity-40">
            {txt.footerText} • MAGIC STUDIO ABI HISAN • POWERED BY GEMINI 2.5 FLASH • {txt.footerText}
          </div>
        </footer>
      </main>
      
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}/>}
    </div>
  );
};

const SectionLabel = ({ label }: { label: string }) => <div className="px-4 py-2 mt-4 text-[10px] font-bold uppercase opacity-40 tracking-widest">{label}</div>;

const SidebarButton = ({ id, active, label, onClick }: any) => {
  const Icon = MENU_ICONS[id];
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`}>
      <Icon className="w-4 h-4"/>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
};

const HomeView = ({ theme, txt, onExplore }: any) => (
  <div className="max-w-5xl mx-auto space-y-12 py-12 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
    <div className="space-y-4">
      <div className="inline-block p-4 bg-indigo-600/10 rounded-3xl mb-4"><Sparkles className="w-12 h-12 text-indigo-500"/></div>
      <h1 className="text-5xl md:text-7xl font-black tracking-tight">{txt.heroTitle} <br/><span className="text-indigo-500">{txt.heroSubtitle}</span></h1>
      <p className={`text-xl ${theme.textSecondary} max-w-2xl mx-auto`}>{txt.heroDesc}</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <FeatureCard icon={Wand2} title={txt.featGen} desc={txt.featDesc1} onClick={() => onExplore('text-to-image')} theme={theme}/>
      <FeatureCard icon={Scissors} title={txt.featEdit} desc={txt.featDesc2} onClick={() => onExplore('smart-editor')} theme={theme}/>
      <FeatureCard icon={Globe} title={txt.featTool} desc={txt.featDesc3} onClick={() => onExplore('live-visuals')} theme={theme}/>
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc, onClick, theme }: any) => (
  <button onClick={onClick} className={`p-8 rounded-[2rem] border ${theme.card} text-left hover:scale-[1.02] transition-transform group`}>
    <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Icon className="w-6 h-6"/></div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className={`text-sm ${theme.textSecondary}`}>{desc}</p>
  </button>
);

const StudioView = ({ prompt, onPromptChange, loading, generatedImage, source1, source2, onUpload1, onUpload2, onRemove1, onRemove2, onCapture1, onCapture2, onGenerate, aspectRatio, onAspectRatioChange, theme, txt, error, activeMenu }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
    <div className="lg:col-span-4 space-y-6">
      <div className={`p-6 rounded-[2rem] border ${theme.card} space-y-6 shadow-2xl`}>
        <div className="space-y-4">
          <UploadSlot label={txt.refImg1} image={source1} onUpload={(e:any) => onUpload1(e, 1)} onRemove={onRemove1} onCapture={onCapture1} theme={theme} txt={txt}/>
          {activeMenu === 'fashion-composite' && (
            <UploadSlot label={txt.refImg2} image={source2} onUpload={(e:any) => onUpload2(e, 2)} onRemove={onRemove2} onCapture={onCapture2} theme={theme} txt={txt}/>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">{txt.promptLbl}</label>
          <textarea value={prompt} onChange={e => onPromptChange(e.target.value)} className={`w-full h-40 p-4 rounded-2xl border ${theme.input} resize-none focus:ring-2 ring-indigo-500/50 outline-none text-sm leading-relaxed`} placeholder="Describe your creative vision..."/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-50">{txt.aspectRatio}</label>
            <select value={aspectRatio} onChange={e => onAspectRatioChange(e.target.value)} className={`w-full p-3 rounded-xl border ${theme.input} text-xs outline-none`}>
              <option value="1:1">Square 1:1</option>
              <option value="16:9">Wide 16:9</option>
              <option value="9:16">Portrait 9:16</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-50">Engine</label>
            <div className={`p-3 rounded-xl border ${theme.input} text-[10px] font-bold flex items-center gap-2 opacity-50`}><Zap className="w-3 h-3"/> Gemini 2.5</div>
          </div>
        </div>
        <button onClick={onGenerate} disabled={loading || !prompt} className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>}
          {source1 ? txt.btnTrans : txt.btnGen}
        </button>
      </div>
    </div>
    <div className="lg:col-span-8">
      <div className={`aspect-[4/3] lg:aspect-auto lg:h-[70vh] rounded-[3rem] border ${theme.card} flex items-center justify-center overflow-hidden p-8 relative`}>
        {generatedImage ? (
          <div className="relative group w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-500">
            <img src={generatedImage} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"/>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { const a = document.createElement('a'); a.href = generatedImage; a.download = 'magic.png'; a.click(); }} className="p-3 bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-transform"><Download className="w-5 h-5"/></button>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center space-y-6 animate-pulse">
            <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"/>
            <h3 className="text-2xl font-black italic">{txt.rendering}</h3>
          </div>
        ) : error ? (
          <div className="text-center space-y-4 max-w-xs">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto opacity-50"/>
            <p className="text-red-500 font-bold">{error}</p>
          </div>
        ) : (
          <div className="text-center opacity-20 space-y-4">
            <ImageIcon className="w-32 h-32 mx-auto"/>
            <p className="text-3xl font-black italic uppercase tracking-tighter">{txt.ready}</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const UploadSlot = ({ label, image, onUpload, onRemove, onCapture, theme, txt }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">{label}</label>
    {image ? (
      <div className="relative h-40 rounded-2xl overflow-hidden border border-indigo-500/30 group">
        <img src={image} className="w-full h-full object-cover"/>
        <button onClick={onRemove} className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-2 h-32">
        <label className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed ${theme.input} hover:border-indigo-500/50 cursor-pointer opacity-60 hover:opacity-100 transition-all`}>
          <input type="file" className="hidden" onChange={onUpload} accept="image/*"/>
          <Upload className="w-5 h-5"/>
          <span className="text-[10px] font-bold">{txt.upload}</span>
        </label>
        <button onClick={onCapture} className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed ${theme.input} hover:border-indigo-500/50 opacity-60 hover:opacity-100 transition-all`}>
          <CameraIcon className="w-5 h-5"/>
          <span className="text-[10px] font-bold">{txt.takePhoto}</span>
        </button>
      </div>
    )}
  </div>
);

const ChatView = ({ history, loading, input, onInputChange, onSubmit, theme, chatEndRef, onFileSelect, attachment, onRemoveAttachment }: any) => (
  <div className={`h-[75vh] flex flex-col rounded-[2.5rem] border ${theme.card} overflow-hidden shadow-2xl`}>
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {history.map((msg: any, i: number) => (
        <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-600'}`}>
            {msg.role === 'user' ? <User className="w-5 h-5 text-white"/> : <Bot className="w-5 h-5 text-white"/>}
          </div>
          <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
            {msg.parts.map((p: any, j: number) => (
              <div key={j} className={`p-4 rounded-3xl inline-block text-left shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : `${theme.input} rounded-tl-none`}`}>
                {p.type === 'text' ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.text}</p> : <img src={p.url} className="max-w-sm rounded-xl"/>}
              </div>
            ))}
          </div>
        </div>
      ))}
      {loading && <div className="flex gap-4 items-center opacity-50"><div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center"><Bot className="w-5 h-5 text-white animate-bounce"/></div><div className="p-4 bg-indigo-600/10 rounded-3xl text-xs font-bold italic">Casting magic...</div></div>}
      <div ref={chatEndRef}/>
    </div>
    <form onSubmit={onSubmit} className={`p-6 border-t ${theme.sidebar} space-y-4`}>
      {attachment && (
        <div className="flex items-center gap-2 p-2 bg-indigo-600/10 rounded-xl inline-flex border border-indigo-600/20 animate-in slide-in-from-bottom-2">
          <ImageIcon className="w-4 h-4 text-indigo-500"/>
          <span className="text-[10px] font-bold">Image ready</span>
          <button type="button" onClick={onRemoveAttachment} className="hover:text-red-500"><X className="w-4 h-4"/></button>
        </div>
      )}
      <div className="flex gap-3">
        <label className={`p-4 rounded-2xl ${theme.input} cursor-pointer hover:bg-white/5 transition-colors`}><input type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = () => onFileSelect(r.result); r.readAsDataURL(f); }}}/><Paperclip className="w-5 h-5"/></label>
        <input value={input} onChange={e => onInputChange(e.target.value)} className={`flex-1 p-4 rounded-2xl border ${theme.input} focus:ring-2 ring-indigo-500/50 outline-none`} placeholder="Ask Magic Studio anything..."/>
        <button type="submit" disabled={loading || (!input.trim() && !attachment)} className="p-4 rounded-2xl bg-indigo-600 text-white shadow-xl hover:shadow-indigo-600/40 active:scale-95 transition-all disabled:opacity-50"><Send className="w-5 h-5"/></button>
      </div>
    </form>
  </div>
);

const RecipeView = ({ input, onInputChange, loading, result, onExtract, theme, txt }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
    <div className={`p-8 rounded-[2.5rem] border ${theme.card} flex flex-col gap-6 shadow-xl`}>
      <h3 className="text-2xl font-black flex items-center gap-3"><ChefHat className="text-amber-500"/> Story to Recipe</h3>
      <textarea value={input} onChange={e => onInputChange(e.target.value)} className={`flex-1 p-6 rounded-3xl border ${theme.input} resize-none focus:ring-2 ring-amber-500/50 outline-none leading-relaxed font-medium`} placeholder="Paste recipe text or a story about cooking..."/>
      <button onClick={onExtract} disabled={loading || !input.trim()} className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl font-black text-white shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
        {loading ? <Loader2 className="w-6 h-6 animate-spin"/> : <FileJson className="w-6 h-6"/>} {txt.extract}
      </button>
    </div>
    <div className={`p-8 rounded-[2.5rem] border ${theme.card} overflow-y-auto shadow-xl min-h-[50vh]`}>
      {result ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div><h2 className="text-4xl font-black text-amber-500">{result.recipe_name}</h2><p className="font-bold opacity-50 uppercase text-[10px] tracking-widest mt-1">Prep Time: {result.prep_time_minutes} min</p></div>
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase opacity-50 border-b border-white/10 pb-2">Ingredients</h4>
            <div className="grid grid-cols-1 gap-2">
              {result.ingredients.map((ing: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5"><span className="font-bold">{ing.name}</span><span className="text-amber-500 font-black">{ing.quantity}</span></div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase opacity-50 border-b border-white/10 pb-2">Instructions</h4>
            <div className="space-y-4">
              {result.instructions.map((step: string, i: number) => (
                <div key={i} className="flex gap-4"><div className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black flex items-center justify-center text-[10px] flex-shrink-0">{i+1}</div><p className="text-sm leading-relaxed opacity-80">{step}</p></div>
              ))}
            </div>
          </div>
        </div>
      ) : <div className="h-full flex flex-col items-center justify-center opacity-10"><ChefHat className="w-32 h-32 mb-4"/><p className="text-2xl font-black uppercase italic tracking-tighter">Ready to Extract</p></div>}
    </div>
  </div>
);

const LiveView = ({ input, onInputChange, loading, result, onGenerate, theme, txt }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
    <div className="lg:col-span-5 flex flex-col gap-6">
      <div className={`p-8 rounded-[2.5rem] border ${theme.card} space-y-6 shadow-xl`}>
        <div className="flex items-center gap-4"><div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 shadow-inner"><Globe className="w-8 h-8"/></div><h3 className="text-2xl font-black">Live Visualization</h3></div>
        <p className={`text-sm ${theme.textSecondary}`}>Harness Google Search to visualize current events and real-time knowledge instantly.</p>
        <textarea value={input} onChange={e => onInputChange(e.target.value)} className={`w-full h-40 p-4 rounded-2xl border ${theme.input} focus:ring-2 ring-emerald-500/50 outline-none leading-relaxed`} placeholder="Ask about recent events, weather, or trends..."/>
        <button onClick={onGenerate} disabled={loading || !input.trim()} className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
          {loading ? <Loader2 className="w-6 h-6 animate-spin"/> : <Globe className="w-6 h-6"/>} {txt.visualize}
        </button>
      </div>
    </div>
    <div className="lg:col-span-7">
      <div className={`h-full min-h-[50vh] rounded-[2.5rem] border ${theme.card} overflow-hidden shadow-2xl flex flex-col bg-slate-950/20`}>
        {result ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0"><img src={result.imageUrl} className="w-full h-full object-cover"/></div>
            <div className={`p-6 rounded-3xl ${theme.input} space-y-4`}><h4 className="font-bold text-emerald-500 flex items-center gap-2"><Brain className="w-4 h-4"/> Real-time Knowledge</h4><p className="text-sm leading-relaxed whitespace-pre-wrap">{result.summary}</p></div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6"><div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"/><p className="font-black text-xl animate-pulse italic">Scanning the globe...</p></div>
        ) : <div className="flex-1 flex flex-col items-center justify-center opacity-10"><Globe className="w-32 h-32 mb-4"/><p className="text-2xl font-black uppercase italic">Visual Knowledge</p></div>}
      </div>
    </div>
  </div>
);

export default App;
