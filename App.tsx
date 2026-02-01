
import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, X, Sun, Moon, Languages, Sparkles, Wand2, Download, 
  Loader2, AlertCircle, Trash2, Image as ImageIcon,
  Upload, Send, Paperclip, User, Bot, Brain, Globe, FileJson, 
  ChefHat, Zap, Scissors, Camera as CameraIcon, Star, Flame, UserCircle,
  ShieldCheck, Cpu, Briefcase, Heart, PenTool, Layers, Plus, Maximize, Smartphone, Monitor, Square, ExternalLink, ChevronRight, Video,
  Target, Info
} from 'lucide-react';
import { TRANSLATIONS, MENU_ICONS } from './constants';
import { MenuId, AppLanguage, ChatMessage, RecipeResult } from './types';
import { gemini } from './geminiService';

const App: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<MenuId>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<AppLanguage>('id');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [sourceTab, setSourceTab] = useState<'single' | 'multi'>('single');
  const [sourceImage1, setSourceImage1] = useState<string | null>(null);
  const [multiImages, setMultiImages] = useState<string[]>([]);
  
  const [prompt, setPrompt] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [cameraAngle, setCameraAngle] = useState("Eye Level");
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
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
  const [liveResult, setLiveResult] = useState<{ summary: string, imageUrl: string, groundingMetadata?: any } | null>(null);

  const txt = TRANSLATIONS[lang];

  const CAMERA_ANGLES = [
    { 
      id: 'eye', 
      label: 'Eye Level', 
      desc: 'Sudut pandang normal dan natural.',
      icon: <Target className="w-3 h-3"/>, 
      prompt: 'Kamera setinggi mata, sudut pandang natural.' 
    },
    { 
      id: 'low', 
      label: 'Low Angle', 
      desc: 'Memberikan kesan heroik dan dramatis.',
      icon: <ChevronRight className="w-3 h-3 -rotate-45"/>, 
      prompt: 'Sudut kamera rendah (worm-eye view), memberikan kesan heroik dan dramatis.' 
    },
    { 
      id: 'high', 
      label: 'High Angle', 
      desc: 'Memberikan kesan artistik dan cinematic.',
      icon: <ChevronRight className="w-3 h-3 rotate-45"/>, 
      prompt: 'Sudut kamera tinggi (bird-eye view), memberikan kesan artistik dan sinematik.' 
    },
    { 
      id: 'close', 
      label: 'Close-up', 
      desc: 'Fokus pada detail wajah yang sangat tajam.',
      icon: <Maximize className="w-3 h-3"/>, 
      prompt: 'Kamera makro sangat dekat, fokus pada detail tekstur pori-pori kulit, warna mata, dan detail bibir yang sangat tajam.' 
    },
    { 
      id: 'profile', 
      label: 'Side Profile', 
      desc: 'Potret wajah dari samping.',
      icon: <User className="w-3 h-3"/>, 
      prompt: 'Kamera dari sudut samping 90 derajat, memperlihatkan siluet wajah dan garis rahang yang tegas.' 
    },
  ];

  const STYLE_CATEGORIES = [
    { id: 'wedding', label: txt.wedding, icon: <Heart className="w-4 h-4"/>, items: [
      { id: 'wedding_lux', label: lang === 'id' ? 'Klasik Mewah' : 'Luxury Classic', prompt: 'Suasana pernikahan klasik mewah, dekorasi megah, pencahayaan kristal hangat, gaun dan jas pengantin sangat elegan.' },
      { id: 'wedding_garden', label: lang === 'id' ? 'Outdoor Garden' : 'Outdoor Garden', prompt: 'Suasana pernikahan taman outdoor, cahaya matahari alami tembus pepohonan, dekorasi bunga segar, suasana santai dan romantis.' },
      { id: 'wedding_trad', label: lang === 'id' ? 'Adat Tradisional' : 'Traditional Heritage', prompt: 'Suasana romantis pernikahan, pencahayaan lembut hangat, nuansa elegan dan penuh kebahagiaan. Pakaian adat pernikahan tradisional Indonesia dengan detail emas yang rumit dan latar pelaminan artistik.' },
      { id: 'wedding_candid', label: lang === 'id' ? 'Candid Emosional' : 'Emotional Candid', prompt: 'Momen pernikahan candid emosional, ekspresi wajah bahagia yang jujur, fokus pada perasaan, pencahayaan alami yang lembut.' },
    ]},
    { id: 'official', label: txt.official, icon: <UserCircle className="w-4 h-4"/>, items: [
      { id: 'off_suit', label: lang === 'id' ? 'Jas & Dasi' : 'Suit & Tie', prompt: 'Foto resmi profesional memakai jas dan dasi rapi, latar belakang polos studio, pencahayaan formal yang bersih.' },
      { id: 'off_batik', label: lang === 'id' ? 'Batik Formal' : 'Formal Batik', prompt: 'Foto resmi memakai kemeja batik formal khas Indonesia, motif etnik yang tegas, latar belakang kantor atau studio profesional.' },
      { id: 'off_work', label: lang === 'id' ? 'Kemeja Kerja' : 'Work Shirt', prompt: 'Foto resmi memakai kemeja kerja rapi, suasana lingkungan kerja modern, pencahayaan terang dan aura profesional.' },
      { id: 'off_smart', label: lang === 'id' ? 'Kacamata Cerdas' : 'Smart Eyewear', prompt: 'Potret profil profesional dengan kacamata, tatapan cerdas dan fokus, latar belakang rak buku atau ruang kerja minimalis.' },
    ]},
    { id: 'model', label: txt.pose, icon: <CameraIcon className="w-4 h-4"/>, items: [
      { id: 'mod_vogue', label: lang === 'id' ? 'Vogue Style' : 'Vogue Style', prompt: 'Gaya model editorial Vogue, pose dramatis high fashion, pencahayaan studio dengan kontras tinggi dan bayangan artistik.' },
      { id: 'mod_urban', label: lang === 'id' ? 'Urban Street' : 'Urban Street', prompt: 'Gaya model urban street fashion, latar belakang perkotaan yang estetik, pakaian kasual trendi, pencahayaan jalanan yang dinamis.' },
      { id: 'mod_bw', label: lang === 'id' ? 'B&W Artistic' : 'B&W Artistic', prompt: 'Gaya model hitam putih artistik, permainan cahaya dan bayangan yang dramatis, siluet tubuh yang elegan dan berkarakter.' },
      { id: 'mod_avant', label: lang === 'id' ? 'Avant-Garde' : 'Avant-Garde', prompt: 'Gaya model avant-garde, pakaian eksperimental yang unik, seni tata rias dramatis, suasana latar belakang yang abstrak dan futuristik.' },
    ]},
    { id: 'business', label: txt.business, icon: <Briefcase className="w-4 h-4"/>, items: [
      { id: 'biz_space', label: lang === 'id' ? 'Ruang Kerja' : 'Workspace', prompt: 'Suasana bisnis di ruang kerja modern, elemen meja kerja dan laptop, fokus pada profesionalisme, latar belakang kantor eksekutif.' },
      { id: 'biz_pres', label: lang === 'id' ? 'Presentasi' : 'Presentation', prompt: 'Suasana bisnis sedang memberikan presentasi, gaya kepemimpinan yang percaya diri, latar belakang ruang rapat atau konferensi.' },
      { id: 'biz_casual', label: lang === 'id' ? 'Business Casual' : 'Business Casual', prompt: 'Gaya bisnis kasual santai, blazer tanpa dasi, suasana profesional namun nyaman di co-working space atau cafe modern.' },
      { id: 'biz_lead', label: lang === 'id' ? 'Leader Focus' : 'Leader Focus', prompt: 'Potret fokus pemimpin bisnis masa kini, pose berwibawa, latar belakang gedung perkantoran tinggi di sore hari.' },
    ]},
    { id: 'cinema', label: txt.cinematic, icon: <Zap className="w-4 h-4"/>, items: [
      { id: 'cin_cyber', label: lang === 'id' ? 'Cyberpunk' : 'Cyberpunk', prompt: 'Gaya sinematik cyberpunk, lampu neon warna-warni pink dan biru, suasana kota masa depan yang futuristik di malam hari.' },
      { id: 'cin_70s', label: lang === 'id' ? 'Vintage 70s' : 'Vintage 70s', prompt: 'Gaya sinematik vintage tahun 70-an, nuansa warna hangat butiran film lama, pakaian retro klasik, kesan nostalgia yang kuat.' },
      { id: 'cin_noir', label: lang === 'id' ? 'Film Noir' : 'Film Noir', prompt: 'Gaya sinematik film noir klasik, hitam putih kontras tinggi, bayangan tirai jendela, suasana misterius detektif.' },
      { id: 'cin_ethereal', label: lang === 'id' ? 'Ethereal Fantasy' : 'Ethereal Fantasy', prompt: 'Gaya sinematik fantasi etereal, cahaya berkilau lembut yang magis, suasana negeri dongeng yang indah and damai.' },
    ]},
  ];

  const getMenuTitle = (menuId: MenuId): string => {
    const mapping: Record<MenuId, string> = {
      home: 'menuHome',
      'text-to-image': 'menuTxtImg',
      'image-to-image': 'menuImgTrans',
      'photorealistic': 'menuPhoto',
      'photorealistic-portrait': 'menuRealFace',
      'sticker-design': 'menuSticker',
      'logo-creator': 'menuLogo',
      'product-mockup': 'menuProduct',
      'sequential-art': 'menuComic',
      'smart-editor': 'menuSmart',
      'style-transfer': 'menuStyle',
      'fashion-composite': 'menuFashion',
      'sketch-to-real': 'menuSketch',
      'character-lab': 'menuChar',
      'live-visuals': 'menuLive',
      'recipe-extractor': 'menuRecipe',
      chat: 'menuChat'
    };
    const key = mapping[menuId] || 'menuHome';
    return (txt as any)[key] || '';
  };

  useEffect(() => {
    setError(null);
    setGeneratedImage(null);
    setSelectedCategory(null);
    setSelectedStyle(null);
    const menuPrompts: Record<string, string> = {
      'text-to-image': txt.promptTxtImg,
      'image-to-image': txt.promptImgTrans,
      'photorealistic': txt.promptPhoto,
      'photorealistic-portrait': txt.promptRealFace,
      'sticker-design': txt.promptSticker,
      'logo-creator': txt.promptLogo,
      'product-mockup': txt.promptProduct,
      'sequential-art': txt.promptComic,
      'smart-editor': txt.promptSmart,
      'style-transfer': txt.promptStyle,
      'fashion-composite': txt.menuFashion,
      'sketch-to-real': txt.promptSketch,
      'character-lab': txt.promptChar,
      'live-visuals': txt.promptLive,
      'recipe-extractor': txt.promptRecipe,
    };
    if (menuPrompts[activeMenu]) setPrompt(menuPrompts[activeMenu]);
  }, [activeMenu, lang]);

  const autoAnalyzeImage = async (img: string) => {
    setIsAnalyzing(true);
    try {
      const menuTitle = getMenuTitle(activeMenu);
      const initialPrompt = await gemini.generatePromptFromImage(img, menuTitle, lang);
      setPrompt(initialPrompt);
    } catch (err: any) {
      console.error("Auto analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRefinePrompt = async () => {
    setIsAnalyzing(true);
    try {
      const menuTitle = getMenuTitle(activeMenu);
      const refImg = sourceTab === 'single' ? sourceImage1 : (multiImages[0] || null);
      const refined = await gemini.refinePrompt(prompt, (refImg || sourceImage2 || null), menuTitle, lang);
      setPrompt(refined);
    } catch (err: any) {
      setError(lang === 'en' ? "Refinement failed" : "Penyempurnaan gagal");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyStyle = (item: any) => {
    setSelectedStyle(item.id);
    setPrompt(item.prompt);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2 | 'multi') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (slot === 'multi') {
        Array.from(files).forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setMultiImages(prev => [...prev, reader.result as string].slice(0, 12));
          };
          reader.readAsDataURL(file);
        });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const data = reader.result as string;
          if (slot === 1) {
            setSourceImage1(data);
            autoAnalyzeImage(data);
          }
          else setSourceImage2(data);
        };
        reader.readAsDataURL(files[0]);
      }
    }
  };

  const captureCamera = async (slot: 1 | 2 | 'multi') => {
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
      if (slot === 'multi') setMultiImages(prev => [...prev, dataUrl].slice(0, 12));
      else if (slot === 1) {
        setSourceImage1(dataUrl);
        autoAnalyzeImage(dataUrl);
      }
      else setSourceImage2(dataUrl);
      
      stream.getTracks().forEach(track => track.stop());
    } catch (err: any) {
      setError("Camera access denied or not available");
    }
  };

  const generateAction = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let res;
      const currentSources = sourceTab === 'single' ? (sourceImage1 ? [sourceImage1] : []) : multiImages;
      
      const isPortraitMenu = activeMenu === 'photorealistic-portrait' || activeMenu === 'photorealistic';
      const selectedAngleData = CAMERA_ANGLES.find(a => a.label === cameraAngle);
      const anglePrompt = isPortraitMenu ? (selectedAngleData?.prompt || "") : "";
      
      let finalPrompt = prompt;
      
      if (isPortraitMenu) {
        finalPrompt = `STRICT FACE IDENTITY: Preserve 100% of the facial identity from the reference image. Every feature (eyes, lip shape, nose structure, skin texture, eyebrows, facial hair) MUST remain identical. 
        Exceptions: Only change features if user explicitly asks for it in prompt (e.g. "make younger", "blue hair"). 
        Current User Request: ${prompt}. 
        Camera Perspective: ${anglePrompt}. 
        Technical Specs: Professional photography, 8k resolution, ultra-detailed skin textures, realistic lighting.`;
      } else if (sourceTab === 'multi' && multiImages.length > 1) {
        finalPrompt = `GABUNG FOTO: Gabungkan identitas dari semua gambar referensi ke satu subjek. Jaga kemiripan wajah semaksimal mungkin. Deskripsi: ${prompt}.`;
      }

      if (currentSources.length > 0) {
        res = await gemini.transformImage(finalPrompt, currentSources, aspectRatio);
      } else {
        res = await gemini.generateImage(finalPrompt, aspectRatio);
      }
      setGeneratedImage(res);
    } catch (err: any) {
      if (err.message?.includes('429')) {
        setError(lang === 'id' ? 'Kuota API Terlampaui. Mohon tunggu beberapa menit atau hubungi Admin.' : 'API Quota Exceeded. Please wait a few minutes before trying again.');
      } else {
        setError(err.message || "Operation failed");
      }
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

    // Use a functional update to ensure we have the latest state before it's sent
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setChatAttachment(null);
    setChatLoading(true);
    try {
      // Map history parts to the structure expected by the Gemini API
      const history = [...chatHistory, userMsg].map(msg => ({
        role: msg.role,
        parts: msg.parts.map(p => {
          if (p.type === 'text') {
            return { text: p.text };
          } else {
            const mimeTypeMatch = p.url?.match(/^data:(.*);base64,/);
            const dataStr = p.url?.split(',')[1] || "";
            const mType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
            // Return an object that fits the Part interface. Cast to any to avoid browser Blob conflict.
            return {
              inlineData: {
                data: dataStr,
                mimeType: mType
              }
            } as any;
          }
        })
      }));
      const res = await gemini.chat(history);
      setChatHistory(prev => [...prev, { role: 'model', parts: res as any }]);
    } catch (err: any) {
      if (err.message?.includes('429')) {
        setError(lang === 'id' ? 'Kuota Obrolan Terlampaui.' : 'Chat Quota Exceeded.');
      } else {
        setError("Chat failed");
      }
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
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r flex flex-col ${themeClasses.sidebar} transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-inherit flex-shrink-0">
          <div className="p-2 bg-[#2563eb] rounded-xl shadow-lg shadow-blue-500/20"><Sparkles className="w-6 h-6 text-white" /></div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-xl tracking-tight truncate">Magic Studio</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">by Abi Hisan</p>
          </div>
          <button className="md:hidden ml-auto" onClick={() => setIsMobileMenuOpen(false)}><X className="w-5 h-5"/></button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <SidebarButton id="home" active={activeMenu === 'home'} label={txt.menuHome} onClick={() => { setActiveMenu('home'); setIsMobileMenuOpen(false); }} />
          <SectionLabel label={txt.catGeneral} />
          <SidebarButton id="text-to-image" active={activeMenu === 'text-to-image'} label={txt.menuTxtImg} onClick={() => { setActiveMenu('text-to-image'); setIsMobileMenuOpen(false); }} />
          <SidebarButton id="image-to-image" active={activeMenu === 'image-to-image'} label={txt.menuImgTrans} onClick={() => { setActiveMenu('image-to-image'); setIsMobileMenuOpen(false); }} />
          <SectionLabel label={txt.catSpecialized} />
          <SidebarButton id="photorealistic" active={activeMenu === 'photorealistic'} label={txt.menuPhoto} onClick={() => { setActiveMenu('photorealistic'); setIsMobileMenuOpen(false); }} />
          <SidebarButton id="photorealistic-portrait" active={activeMenu === 'photorealistic-portrait'} label={txt.menuRealFace} onClick={() => { setActiveMenu('photorealistic-portrait'); setIsMobileMenuOpen(false); }} />
          <SidebarButton id="sticker-design" active={activeMenu === 'sticker-design'} label={txt.menuSticker} onClick={() => { setActiveMenu('sticker-design'); setIsMobileMenuOpen(false); }} />
          <SidebarButton id="logo-creator" active={activeMenu === 'logo-creator'} label={txt.menuLogo} onClick={() => { setActiveMenu('logo-creator'); setIsMobileMenuOpen(false); }} />
          <SectionLabel label={txt.catAdvanced} />
          <SidebarButton id="smart-editor" active={activeMenu === 'smart-editor'} label={txt.menuSmart} onClick={() => { setActiveMenu('smart-editor'); setIsMobileMenuOpen(false); }} />
          <SidebarButton id="fashion-composite" active={activeMenu === 'fashion-composite'} label={txt.menuFashion} onClick={() => { setActiveMenu('fashion-composite'); setIsMobileMenuOpen(false); }} />
          <SectionLabel label={txt.catTools} />
          <SidebarButton id="live-visuals" active={activeMenu === 'live-visuals'} label={txt.menuLive} onClick={() => { setActiveMenu('live-visuals'); setIsMobileMenuOpen(false); }} />
          <SidebarButton id="recipe-extractor" active={activeMenu === 'recipe-extractor'} label={txt.menuRecipe} onClick={() => { setActiveMenu('recipe-extractor'); setIsMobileMenuOpen(false); }} />
          <SidebarButton id="chat" active={activeMenu === 'chat'} label={txt.menuChat} onClick={() => { setActiveMenu('chat'); setIsMobileMenuOpen(false); }} />
          <div className="h-10" />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative min-w-0">
        <header className={`h-16 flex items-center justify-between px-6 border-b ${themeClasses.sidebar} backdrop-blur-xl z-40 flex-shrink-0`}>
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/10" onClick={() => setIsMobileMenuOpen(true)}><Menu className="w-6 h-6"/></button>
            <h2 className="font-bold text-sm md:text-base truncate max-w-[150px] md:max-w-none">
              {activeMenu === 'home' ? txt.welcome : getMenuTitle(activeMenu)}
            </h2>
          </div>
          <div className="flex items-center gap-1 md:gap-3">
            <button onClick={() => setLang(lang === 'en' ? 'id' : 'en')} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Change Language"><Languages className="w-5 h-5"/></button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Toggle Theme">{isDarkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-16">
          {activeMenu === 'home' ? (
            <HomeView theme={themeClasses} txt={txt} onExplore={setActiveMenu}/>
          ) : ['chat', 'recipe-extractor', 'live-visuals'].includes(activeMenu) ? (
            <div className="max-w-4xl mx-auto h-full">
              {activeMenu === 'chat' && <ChatView history={chatHistory} loading={chatLoading} input={chatInput} onInputChange={setChatInput} onSubmit={handleChatSubmit} theme={themeClasses} chatEndRef={chatEndRef} onFileSelect={setChatAttachment} attachment={chatAttachment} onRemoveAttachment={() => setChatAttachment(null)}/>}
              {activeMenu === 'recipe-extractor' && <RecipeView input={recipeInput} onInputChange={setRecipeInput} loading={loading} result={recipeResult} onExtract={async () => { setLoading(true); try { setRecipeResult(await gemini.extractRecipe(recipeInput)); } catch(e: any){ setError("Failed"); } finally { setLoading(false); }}} theme={themeClasses} txt={txt}/>}
              {activeMenu === 'live-visuals' && <LiveView input={livePrompt} onInputChange={setLivePrompt} loading={loading} result={liveResult} onGenerate={async () => { setLoading(true); try { setLiveResult(await gemini.getLiveVisuals(livePrompt)); } catch(e: any){ setError("Search failed"); } finally { setLoading(false); }}} theme={themeClasses} txt={txt}/>}
            </div>
          ) : (
            <StudioView 
              prompt={prompt} 
              onPromptChange={setPrompt} 
              loading={loading}
              isAnalyzing={isAnalyzing}
              generatedImage={generatedImage} 
              source1={sourceImage1} 
              source2={sourceImage2}
              multiImages={multiImages}
              onUpload1={handleImageUpload} 
              onUpload2={handleImageUpload} 
              onRemove1={() => setSourceImage1(null)} 
              onRemove2={() => setSourceImage2(null)}
              onRemoveMulti={(idx: number) => setMultiImages(prev => prev.filter((_, i) => i !== idx))}
              onCapture1={() => captureCamera(1)}
              onCapture2={() => captureCamera(2)}
              onCaptureMulti={() => captureCamera('multi')}
              onGenerate={generateAction} 
              onRefine={handleRefinePrompt}
              onApplyStyle={handleApplyStyle}
              aspectRatio={aspectRatio} 
              onAspectRatioChange={setAspectRatio} 
              cameraAngle={cameraAngle}
              onCameraAngleChange={setCameraAngle}
              cameraAngles={CAMERA_ANGLES}
              sourceTab={sourceTab}
              onTabChange={setSourceTab}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedStyle={selectedStyle}
              styleCategories={STYLE_CATEGORIES}
              theme={themeClasses} 
              txt={txt} 
              error={error}
              activeMenu={activeMenu}
            />
          )}
        </div>

        <footer className={`h-8 border-t ${themeClasses.sidebar} flex items-center px-4 overflow-hidden flex-shrink-0`}>
          <div className="animate-marquee whitespace-nowrap text-[10px] font-bold uppercase tracking-widest opacity-40">
            {txt.footerText} • MAGIC STUDIO ABI HISAN • POWERED BY GEMINI 2.5 FLASH • {txt.footerText}
          </div>
        </footer>
      </main>
      
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}/>}
    </div>
  );
};

const SectionLabel = ({ label }: { label: string }) => <div className="px-4 py-2 mt-4 text-[10px] font-black uppercase opacity-40 tracking-widest border-l-2 border-transparent">{label}</div>;

const SidebarButton = ({ id, active, label, onClick }: any) => {
  const Icon = MENU_ICONS[id];
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-600/30' : 'hover:bg-white/5 opacity-70 hover:opacity-100'}`}>
      <Icon className={`w-4 h-4 ${active ? 'animate-pulse' : ''}`}/>
      <span className="text-sm font-semibold truncate">{label}</span>
    </button>
  );
};

const HomeView = ({ theme, txt, onExplore }: any) => (
  <div className="max-w-5xl mx-auto space-y-12 py-12 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
    <div className="space-y-4 px-4">
      <div className="inline-block p-4 bg-blue-600/10 rounded-3xl mb-4"><Sparkles className="w-12 h-12 text-[#2563eb]"/></div>
      <h1 className="text-4xl md:text-7xl font-black tracking-tight">{txt.heroTitle} <br/><span className="text-[#2563eb]">{txt.heroSubtitle}</span></h1>
      <p className={`text-base md:text-xl ${theme.textSecondary} max-w-2xl mx-auto leading-relaxed`}>{txt.heroDesc}</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-4">
      <FeatureCard icon={Wand2} title={txt.featGen} desc={txt.featDesc1} onClick={() => onExplore('text-to-image')} theme={theme}/>
      <FeatureCard icon={Scissors} title={txt.featEdit} desc={txt.featDesc2} onClick={() => onExplore('smart-editor')} theme={theme}/>
      <FeatureCard icon={Globe} title={txt.featTool} desc={txt.featDesc3} onClick={() => onExplore('live-visuals')} theme={theme}/>
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc, onClick, theme }: any) => (
  <button onClick={onClick} className={`p-8 rounded-[2rem] border ${theme.card} text-left hover:scale-[1.02] active:scale-95 transition-all group h-full flex flex-col`}>
    <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#2563eb] group-hover:text-white transition-colors"><Icon className="w-6 h-6"/></div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className={`text-sm ${theme.textSecondary} flex-1`}>{desc}</p>
  </button>
);

const StudioView = ({ prompt, onPromptChange, loading, isAnalyzing, generatedImage, source1, source2, multiImages, onUpload1, onUpload2, onRemove1, onRemove2, onRemoveMulti, onCapture1, onCapture2, onCaptureMulti, onGenerate, onRefine, onApplyStyle, aspectRatio, onAspectRatioChange, cameraAngle, onCameraAngleChange, cameraAngles, sourceTab, onTabChange, selectedCategory, onCategoryChange, selectedStyle, styleCategories, theme, txt, error, activeMenu }: any) => {
  
  const getPreviewRatioStyle = () => {
    switch(aspectRatio) {
      case '16:9': return { aspectRatio: '16/9', width: '100%', maxWidth: '100%' };
      case '9:16': return { aspectRatio: '9/16', height: '100%', maxHeight: '100%' };
      case '3:4': return { aspectRatio: '3/4', height: '100%', maxHeight: '100%' };
      case '4:3': return { aspectRatio: '4/3', width: '100%', maxWidth: '100%' };
      default: return { aspectRatio: '1/1', width: '100%', maxWidth: '100%' };
    }
  };

  const selectedAngle = cameraAngles.find((a: any) => a.label === cameraAngle);
  const isPortraitMenu = activeMenu === 'photorealistic' || activeMenu === 'photorealistic-portrait';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
      <div className="lg:col-span-5 space-y-6">
        
        {/* Source Switcher */}
        <div className="flex bg-[#0a0f1e] p-1.5 rounded-full border border-white/5 shadow-2xl overflow-hidden">
          <button 
            onClick={() => onTabChange('single')} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full text-[10px] font-black transition-all ${sourceTab === 'single' ? 'bg-[#2563eb] text-white shadow-lg' : 'opacity-60 text-white hover:opacity-100'}`}
          >
            <Wand2 className="w-4 h-4"/> PRODUK
          </button>
          <button 
            onClick={() => onTabChange('multi')} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full text-[10px] font-black transition-all ${sourceTab === 'multi' ? 'bg-[#2563eb] text-white shadow-lg' : 'opacity-60 text-white hover:opacity-100'}`}
          >
            <div className="relative flex items-center gap-2">
              <Layers className="w-4 h-4"/>
              GABUNG FOTO
              {multiImages.length > 0 && (
                <span className="px-1.5 py-0.5 bg-white text-[#2563eb] rounded-md text-[8px] font-black animate-pulse">
                  {multiImages.length}
                </span>
              )}
            </div>
          </button>
        </div>

        <div className={`p-6 rounded-[2.5rem] border ${theme.card} space-y-6 shadow-2xl bg-slate-900/60`}>
          
          {/* Image Upload Area */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#2563eb] rounded-2xl text-white shadow-xl shadow-blue-500/20">
                <Upload className="w-6 h-6"/>
              </div>
              <div>
                <h3 className="text-xl font-black text-white leading-tight tracking-tight">Sumber Gambar</h3>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                  {sourceTab === 'single' ? 'FOKUS PRODUK TUNGGAL' : 'GABUNGAN MULTI-REFERENSI'}
                </p>
              </div>
            </div>
            
            {sourceTab === 'single' ? (
              <UploadSlot label={txt.refImg1} image={source1} onUpload={(e:any) => onUpload1(e, 1)} onRemove={onRemove1} onCapture={onCapture1} theme={theme} txt={txt}/>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {multiImages.map((img: string, idx: number) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-blue-500/30 group animate-in zoom-in-50">
                      <img src={img} className="w-full h-full object-cover"/>
                      <button onClick={() => onRemoveMulti(idx)} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  ))}
                  {multiImages.length < 12 && (
                    <label className="aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#2563eb]/20 hover:border-[#2563eb]/50 bg-slate-950/40 cursor-pointer transition-all">
                      <input type="file" className="hidden" multiple onChange={(e:any) => onUpload1(e, 'multi')} accept="image/*"/>
                      <Plus className="w-5 h-5 opacity-40 mb-1"/>
                      <span className="text-[8px] font-black opacity-30">TAMBAH</span>
                    </label>
                  )}
                </div>
                <button onClick={onCaptureMulti} className="w-full py-3 rounded-xl border border-white/5 bg-slate-950/40 text-[9px] font-black opacity-60 hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                  <CameraIcon className="w-4 h-4"/> AMBIL FOTO KAMERA
                </button>
              </div>
            )}
          </div>

          {/* Conditional Styles - ONLY FOR PORTRAIT/PHOTO */}
          {isPortraitMenu && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2563eb]/20 rounded-lg"><Star className="w-5 h-5 text-[#2563eb]"/></div>
                <h3 className="text-xs font-black uppercase tracking-widest">GAYA SPESIFIK</h3>
              </div>
              
              <div className="flex overflow-x-auto pb-2 gap-2 custom-scrollbar">
                {styleCategories.map((cat: any) => (
                  <button 
                    key={cat.id} 
                    onClick={() => onCategoryChange(selectedCategory === cat.id ? null : cat.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[9px] font-black ${selectedCategory === cat.id ? 'bg-[#2563eb] border-blue-500 text-white shadow-lg scale-105' : 'bg-slate-900/60 border-white/5 opacity-60 hover:opacity-100'}`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>

              {selectedCategory && (
                <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-left-2 duration-300">
                  {styleCategories.find((c: any) => c.id === selectedCategory)?.items.map((item: any) => (
                    <button 
                      key={item.id} 
                      onClick={() => onApplyStyle(item)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all group ${selectedStyle === item.id ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-md' : 'bg-slate-900/40 border-white/5 hover:bg-[#2563eb]/20'}`}
                    >
                      <span className="text-[9px] font-black truncate pr-2">{item.label}</span>
                      <ChevronRight className={`w-3 h-3 transition-transform ${selectedStyle === item.id ? 'rotate-90' : 'opacity-40 group-hover:translate-x-1'}`}/>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conditional Camera Angle - ONLY FOR PORTRAIT/PHOTO */}
          {isPortraitMenu && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600/20 rounded-lg"><Video className="w-5 h-5 text-emerald-500"/></div>
                  <h3 className="text-xs font-black uppercase tracking-widest">ANGLE CAMERA</h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-500">{cameraAngle}</span>
              </div>
              
              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 flex items-start gap-3 animate-in fade-in duration-300">
                <Info className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0"/>
                <div>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase">{cameraAngle}</p>
                  <p className="text-[9px] text-gray-400 mt-1">{selectedAngle?.desc}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {cameraAngles.map((angle: any) => (
                  <button 
                    key={angle.id} 
                    onClick={() => onCameraAngleChange(angle.label)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-[9px] font-black ${cameraAngle === angle.label ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-slate-900/60 border-white/5 opacity-60 hover:opacity-100'}`}
                    title={angle.desc}
                  >
                    {angle.icon}
                    <span className="truncate">{angle.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="h-px bg-white/5 w-full"/>

          {/* Prompt Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-50">
                {activeMenu === 'text-to-image' ? "ISI PROMPT ANDA" : "MANTRA KREATIF"}
              </label>
              <button onClick={onRefine} disabled={isAnalyzing || !prompt} className="text-[9px] font-black text-[#2563eb] hover:underline flex items-center gap-1"><Sparkles className="w-3 h-3"/> PERCANTIK MANTRA</button>
            </div>
            <div className="relative">
              <textarea 
                value={prompt} 
                onChange={e => onPromptChange(e.target.value)} 
                className={`w-full h-32 p-4 rounded-2xl border ${theme.input} resize-none focus:ring-2 ring-[#2563eb]/50 outline-none text-xs leading-relaxed scrollbar-thin transition-all ${isAnalyzing ? 'opacity-50 blur-[1px]' : ''} bg-slate-950/40`} 
                placeholder={activeMenu === 'text-to-image' ? "Ketik prompt gambar yang ingin Anda buat..." : "Deskripsikan imajinasimu di sini..."}
              />
              {isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                  <div className="bg-[#2563eb] text-white px-4 py-2 rounded-full text-[10px] font-black shadow-2xl flex items-center gap-2 animate-bounce">
                    <Sparkles className="w-3 h-3"/> MENGOPTIMALKAN...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ASPECT RATIO SECTION - POSITIONED ABOVE BUTTON */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-50">PILIH RASIO ASPEK</label>
              <span className="text-[10px] font-bold text-[#2563eb]">{aspectRatio}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <AspectRatioButton ratio="1:1" icon={<Square className="w-3 h-3"/>} active={aspectRatio === "1:1"} onClick={() => onAspectRatioChange("1:1")} />
              <AspectRatioButton ratio="3:4" icon={<Smartphone className="w-3 h-3"/>} active={aspectRatio === "3:4"} onClick={() => onAspectRatioChange("3:4")} />
              <AspectRatioButton ratio="16:9" icon={<Monitor className="w-3 h-3"/>} active={aspectRatio === "16:9"} onClick={() => onAspectRatioChange("16:9")} />
              <AspectRatioButton ratio="9:16" icon={<Smartphone className="w-3 h-3 rotate-90"/>} active={aspectRatio === "9:16"} onClick={() => onAspectRatioChange("9:16")} />
            </div>
          </div>

          <button onClick={onGenerate} disabled={loading || isAnalyzing || !prompt} className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#4f46e5] text-white font-black shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group">
            {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Flame className="w-5 h-5 group-hover:rotate-12 transition-transform"/>}
            {(source1 || multiImages.length > 0) ? "TRANSFORM REALITAS" : "GENERATE IMAGE"}
          </button>
        </div>
      </div>
      
      {/* RESULT CANVAS */}
      <div className="lg:col-span-7 h-full flex items-center justify-center">
        <div className={`rounded-[3rem] border ${theme.card} flex items-center justify-center overflow-hidden p-4 md:p-10 relative shadow-inner bg-slate-950/40 w-full h-[88vh]`}>
          {generatedImage ? (
            <div className="relative group flex items-center justify-center animate-in zoom-in-95 duration-500 w-full h-full">
              <div style={getPreviewRatioStyle()} className="flex items-center justify-center overflow-hidden rounded-3xl shadow-2xl border border-white/10 bg-black/20">
                 <img src={generatedImage} className="w-full h-full object-contain" alt="Generated visual"/>
              </div>
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-3 z-10">
                <button onClick={() => { const a = document.createElement('a'); a.href = generatedImage; a.download = 'magic_studio_result.png'; a.click(); }} className="p-4 bg-white text-black rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all shadow-blue-500/20"><Download className="w-6 h-6"/></button>
              </div>
              <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold text-white/80 tracking-widest border border-white/5 z-10">RESULT ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
            </div>
          ) : loading ? (
            <div className="text-center space-y-8 animate-pulse px-4">
              <div className="w-24 h-24 border-8 border-blue-500/20 border-t-[#2563eb] rounded-full animate-spin mx-auto shadow-2xl"/>
              <div>
                <h3 className="text-3xl font-black italic tracking-widest text-[#2563eb] uppercase">MENGGABUNGKAN ATOM...</h3>
                <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-2">Engine sedang mensintesis realitas Anda</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center space-y-6 max-sm px-6">
              <div className="p-6 bg-red-500/10 rounded-full inline-block shadow-inner animate-bounce"><AlertCircle className="w-16 h-16 text-red-500"/></div>
              <div>
                <p className="text-red-500 font-black text-xl mb-2">{error.includes('429') ? '⚠️ LIMIT API' : 'ERROR'}</p>
                <p className="text-xs font-medium opacity-70 leading-relaxed">{error}</p>
              </div>
              {error.includes('429') && (
                <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 text-[10px] text-left space-y-2 opacity-80">
                  <p className="font-bold">Tips Mengatasi Quota Limit:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tunggu 1-2 menit sebelum mencoba lagi.</li>
                    <li>Gunakan API Key berbayar untuk batas yang lebih tinggi.</li>
                    <li>Kurangi penggunaan gambar referensi berganda.</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center opacity-10 space-y-6 select-none px-4">
              <ImageIcon className="w-48 h-48 mx-auto grayscale"/>
              <p className="text-4xl font-black italic uppercase tracking-tighter">KANVAS SIAP DIISI</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AspectRatioButton = ({ ratio, icon, active, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border transition-all ${active ? 'bg-[#2563eb] border-blue-500 text-white shadow-lg scale-105' : 'border-white/5 bg-slate-900/60 opacity-60 text-white hover:opacity-100'}`}
  >
    {icon}
    <span className="text-[8px] font-black">{ratio}</span>
  </button>
);

const UploadSlot = ({ label, image, onUpload, onRemove, onCapture, theme, txt }: any) => (
  <div className="space-y-2">
    {image ? (
      <div className="relative h-56 rounded-3xl overflow-hidden border-2 border-[#2563eb]/30 group shadow-2xl">
        <img src={image} className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button onClick={onRemove} className="p-4 bg-red-500 text-white rounded-full hover:scale-110 active:scale-90 transition-all shadow-lg"><Trash2 className="w-6 h-6"/></button>
        </div>
      </div>
    ) : (
      <label className={`h-56 flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-[#2563eb]/20 bg-slate-950/40 hover:border-[#2563eb]/60 hover:bg-[#2563eb]/5 cursor-pointer transition-all group shadow-inner`}>
        <input type="file" className="hidden" onChange={onUpload} accept="image/*"/>
        <div className="p-5 bg-blue-600/10 rounded-full group-hover:bg-[#2563eb] group-hover:text-white transition-all shadow-lg">
          <ImageIcon className="w-10 h-10"/>
        </div>
        <div className="text-center">
          <p className="text-base font-black uppercase tracking-tight">Klik untuk Unggah</p>
          <p className="text-[10px] opacity-40 font-black tracking-widest">SERET & LEPAS ASET DI SINI</p>
        </div>
      </label>
    )}
  </div>
);

const ChatView = ({ history, loading, input, onInputChange, onSubmit, theme, chatEndRef, onFileSelect, attachment, onRemoveAttachment }: any) => (
  <div className={`h-[calc(100vh-12rem)] flex flex-col rounded-[2.5rem] border ${theme.card} overflow-hidden shadow-2xl`}>
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
      {history.map((msg: any, i: number) => (
        <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-slate-700' : 'bg-[#2563eb]'}`}>
            {msg.role === 'user' ? <User className="w-5 h-5 text-white"/> : <Bot className="w-5 h-5 text-white"/>}
          </div>
          <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
            {msg.parts.map((p: any, j: number) => (
              <div key={j} className={`p-4 rounded-3xl inline-block text-left shadow-sm ${msg.role === 'user' ? 'bg-[#2563eb] text-white rounded-tr-none' : `${theme.input} rounded-tl-none`}`}>
                {p.type === 'text' ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.text}</p> : <img src={p.url} className="max-w-full sm:max-w-sm rounded-xl" alt="Chat attachment"/>}
              </div>
            ))}
          </div>
        </div>
      ))}
      {loading && <div className="flex gap-4 items-center opacity-50"><div className="w-10 h-10 rounded-2xl bg-[#2563eb] flex items-center justify-center"><Bot className="w-5 h-5 text-white animate-bounce"/></div><div className="p-4 bg-blue-600/10 rounded-3xl text-xs font-bold italic">Mantra dilepaskan...</div></div>}
      <div ref={chatEndRef}/>
    </div>
    <form onSubmit={onSubmit} className={`p-4 md:p-6 border-t ${theme.sidebar} space-y-4 flex-shrink-0`}>
      {attachment && (
        <div className="flex items-center gap-2 p-2 bg-blue-600/10 rounded-xl inline-flex border border-blue-600/20 animate-in slide-in-from-bottom-2">
          <ImageIcon className="w-4 h-4 text-[#2563eb]"/>
          <span className="text-[10px] font-bold">Gambar siap</span>
          <button type="button" onClick={onRemoveAttachment} className="hover:text-red-500 transition-colors"><X className="w-4 h-4"/></button>
        </div>
      )}
      <div className="flex gap-3">
        <label className={`p-4 rounded-2xl ${theme.input} cursor-pointer hover:bg-white/5 transition-colors`} title="Lampirkan Gambar">
          <input type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = () => onFileSelect(r.result as string); r.readAsDataURL(f); }}}/>
          <Paperclip className="w-5 h-5"/>
        </label>
        <input value={input} onChange={e => onInputChange(e.target.value)} className={`flex-1 p-4 rounded-2xl border ${theme.input} focus:ring-2 ring-blue-500/50 outline-none text-sm`} placeholder="Tanyakan apa pun pada Magic Studio..."/>
        <button type="submit" disabled={loading || (!input.trim() && !attachment)} className="p-4 rounded-2xl bg-[#2563eb] text-white shadow-xl hover:shadow-blue-600/40 active:scale-95 transition-all disabled:opacity-50"><Send className="w-5 h-5"/></button>
      </div>
    </form>
  </div>
);

const RecipeView = ({ input, onInputChange, loading, result, onExtract, theme, txt }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
    <div className={`p-8 rounded-[2.5rem] border ${theme.card} flex flex-col gap-6 shadow-xl h-fit lg:h-full`}>
      <h3 className="text-2xl font-black flex items-center gap-3"><ChefHat className="text-amber-500"/> Story to Recipe</h3>
      <textarea value={input} onChange={e => onInputChange(e.target.value)} className={`flex-1 min-h-[200px] p-6 rounded-3xl border ${theme.input} resize-none focus:ring-2 ring-amber-500/50 outline-none leading-relaxed font-medium custom-scrollbar`} placeholder="Tempel teks resep atau cerita tentang memasak..."/>
      <button onClick={onExtract} disabled={loading || !input.trim()} className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl font-black text-white shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
        {loading ? <Loader2 className="w-6 h-6 animate-spin"/> : <FileJson className="w-6 h-6"/>} {txt.extract}
      </button>
    </div>
    <div className={`p-8 rounded-[2.5rem] border ${theme.card} overflow-y-auto shadow-xl min-h-[50vh] lg:h-full custom-scrollbar`}>
      {result ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div><h2 className="text-4xl font-black text-amber-500 leading-tight">{result.recipe_name}</h2><p className="font-bold opacity-50 uppercase text-[10px] tracking-widest mt-1">Waktu Persiapan: {result.prep_time_minutes} min</p></div>
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase opacity-50 border-b border-white/10 pb-2">Bahan-bahan</h4>
            <div className="grid grid-cols-1 gap-2">
              {result.ingredients.map((ing: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors"><span className="font-bold">{ing.name}</span><span className="text-amber-500 font-black">{ing.quantity}</span></div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase opacity-50 border-b border-white/10 pb-2">Instruksi</h4>
            <div className="space-y-4">
              {result.instructions.map((step: string, i: number) => (
                <div key={i} className="flex gap-4 group"><div className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black flex items-center justify-center text-[10px] flex-shrink-0 group-hover:scale-110 transition-transform">{i+1}</div><p className="text-sm leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{step}</p></div>
              ))}
            </div>
          </div>
        </div>
      ) : <div className="h-full flex flex-col items-center justify-center opacity-10 py-20 select-none"><ChefHat className="w-32 h-32 mb-4"/><p className="text-2xl font-black uppercase italic tracking-tighter">Siap Mengekstrak</p></div>}
    </div>
  </div>
);

const LiveView = ({ input, onInputChange, loading, result, onGenerate, theme, txt }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
    <div className="lg:col-span-5 flex flex-col gap-6">
      <div className={`p-8 rounded-[2.5rem] border ${theme.card} space-y-6 shadow-xl`}>
        <div className="flex items-center gap-4"><div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 shadow-inner"><Globe className="w-8 h-8"/></div><h3 className="text-2xl font-black">Visualisasi Langsung</h3></div>
        <p className={`text-sm ${theme.textSecondary}`}>Gunakan Google Search untuk memvisualisasikan peristiwa terkini dan pengetahuan real-time secara instan.</p>
        <textarea value={input} onChange={e => onInputChange(e.target.value)} className={`w-full h-40 p-4 rounded-2xl border ${theme.input} focus:ring-2 ring-emerald-500/50 outline-none leading-relaxed text-sm`} placeholder="Tanyakan tentang berita terkini, cuaca, atau tren..."/>
        <button onClick={onGenerate} disabled={loading || !input.trim()} className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
          {loading ? <Loader2 className="w-6 h-6 animate-spin"/> : <Globe className="w-6 h-6"/>} {txt.visualize}
        </button>
      </div>
    </div>
    <div className="lg:col-span-7">
      <div className={`h-full min-h-[50vh] rounded-[2.5rem] border ${theme.card} overflow-hidden shadow-2xl flex flex-col bg-slate-950/20`}>
        {result ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right-4 duration-500 custom-scrollbar">
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 group"><img src={result.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Live visualization result"/></div>
            <div className={`p-6 rounded-3xl ${theme.input} space-y-4 shadow-sm`}><h4 className="font-bold text-emerald-500 flex items-center gap-2"><Brain className="w-4 h-4"/> Pengetahuan Terkini</h4><p className="text-sm leading-relaxed whitespace-pre-wrap">{result.summary}</p></div>
            
            {result.groundingMetadata?.groundingChunks && (
              <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
                  <Globe className="w-3 h-3"/> Sumber URL
                </h4>
                <div className="flex flex-col gap-2">
                  {result.groundingMetadata.groundingChunks.map((chunk: any, i: number) => {
                    const web = chunk.web;
                    if (!web) return null;
                    return (
                      <a key={i} href={web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-[#2563eb]/20 border border-white/5 transition-all group">
                        <span className="text-xs font-bold truncate pr-4">{web.title || web.uri}</span>
                        <ExternalLink className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity"/>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-20"><div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin shadow-lg"/><p className="font-black text-xl animate-pulse italic text-emerald-500">Memindai dunia...</p></div>
        ) : <div className="flex-1 flex flex-col items-center justify-center opacity-10 select-none py-20"><Globe className="w-32 h-32 mb-4"/><p className="text-2xl font-black uppercase italic tracking-tighter">Visual Knowledge</p></div>}
      </div>
    </div>
  </div>
);

export default App;
