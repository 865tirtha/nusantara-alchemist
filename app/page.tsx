'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { recipes, ALL_LAUK, ALL_BUMBU, ALL_PROSES } from '@/lib/data';
import Image from 'next/image';
import { Volume2, VolumeX, ArrowLeft } from 'lucide-react';

type Recipe = typeof recipes[0];
type ScreenState = 'loading' | 'name-input' | 'menu' | 'game';

export default function Home() {
  const getRecipeRarity = (recipe: Recipe) => {
    const total = (recipe.lauk?.length || 0) + (recipe.bumbu?.length || 0) + (recipe.proses?.length || 0);
    if (total >= 10) return { label: 'GOD', bg: 'bg-[#ffd700] god-tier-anim', text: 'text-[#2d2d2d]', shadow: true, animText: 'god-text-glitter', textColor: 'text-yellow-500' };
    if (total >= 9) return { label: 'Legendary', bg: 'bg-[#fbbf24]', text: 'text-[#2d2d2d]', shadow: true, animText: '', textColor: 'text-amber-500' };
    if (total >= 8) return { label: 'Epic', bg: 'bg-[#a855f7]', text: 'text-white', shadow: false, animText: '', textColor: 'text-purple-500' };
    if (total >= 5) return { label: 'Elite', bg: 'bg-[#06b6d4]', text: 'text-white', shadow: false, animText: '', textColor: 'text-cyan-500' };
    if (total >= 4) return { label: 'Rare', bg: 'bg-[#4ade80]', text: 'text-[#2d2d2d]', shadow: false, animText: '', textColor: 'text-green-500' };
    return { label: 'Common', bg: 'bg-[#e5e7eb]', text: 'text-[#2d2d2d]', shadow: false, animText: '', textColor: 'text-gray-500' };
  };

  const [screen, setScreen] = useState<ScreenState>('loading');
  const [playerName, setPlayerName] = useState('');

  const [activeTab, setActiveTab] = useState<'lauk' | 'bumbu' | 'proses' | null>(null);
  const [isRecipeBookOpen, setIsRecipeBookOpen] = useState(false);

  const [selectedLauk, setSelectedLauk] = useState<string[]>([]);
  const [selectedBumbu, setSelectedBumbu] = useState<string[]>([]);
  const [selectedProses, setSelectedProses] = useState<string[]>([]);
  const [discoveredIds, setDiscoveredIds] = useState<number[]>([]);

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const [failCount, setFailCount] = useState(0);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    status: 'success' | 'fail' | 'hint' | null;
    recipe: Recipe | null;
  }>({ isOpen: false, status: null, recipe: null });

  useEffect(() => {
    const savedName = localStorage.getItem('alchemistName');
    const savedDiscoveries = localStorage.getItem('alchemistDiscoveries');

    if (savedName) setPlayerName(savedName);
    if (savedDiscoveries) setDiscoveredIds(JSON.parse(savedDiscoveries));

    // Simulate slight loading to prevent hydration mismatch flashes
    setTimeout(() => {
      setScreen(savedName ? 'menu' : 'name-input');
    }, 100);

    const audio = new Audio('/bgm.mp3');
    audio.loop = true;
    audio.volume = 0.5;
    
    // Explicit event listener fallback untuk memastikan auto-repeat berjalan di semua browser
    audio.addEventListener('ended', () => {
      audio.currentTime = 0;
      audio.play().catch(e => console.log('Auto-repeat dicegah oleh browser:', e));
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log('Audio error:', e));
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  const handleNameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    if (name && name.trim().length > 0) {
      localStorage.setItem('alchemistName', name.trim());
      setPlayerName(name.trim());
      setScreen('menu');
    }
  };

  const startGame = () => {
    setScreen('game');
    if (!localStorage.getItem('tutorialDone')) {
      setShowTutorial(true);
      setTutorialStep(0);
    }
  };

  const handleSelect = (category: 'lauk' | 'bumbu' | 'proses', item: string) => {
    switch (category) {
      case 'lauk':
        setSelectedLauk(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
        break;
      case 'bumbu':
        setSelectedBumbu(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
        break;
      case 'proses':
        setSelectedProses(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
        break;
    }
  };

  const isSelected = (category: 'lauk' | 'bumbu' | 'proses', item: string) => {
    switch (category) {
      case 'lauk': return selectedLauk.includes(item);
      case 'bumbu': return selectedBumbu.includes(item);
      case 'proses': return selectedProses.includes(item);
    }
  };

  const handleMix = () => {
    if (selectedLauk.length === 0 && selectedBumbu.length === 0 && selectedProses.length === 0) return;

    let foundRecipe = recipes.find(r => {
      const matchLauk = [...r.lauk].sort().join(',') === [...selectedLauk].sort().join(',');
      const matchBumbu = [...r.bumbu].sort().join(',') === [...selectedBumbu].sort().join(',');
      const matchProses = [...r.proses].sort().join(',') === [...selectedProses].sort().join(',');
      return matchLauk && matchBumbu && matchProses;
    });

    if (foundRecipe) {
      setFailCount(0);
      setModalState({ isOpen: true, status: 'success', recipe: foundRecipe });
      if (!discoveredIds.includes(foundRecipe.id)) {
        const newDiscoveries = [...discoveredIds, foundRecipe.id];
        setDiscoveredIds(newDiscoveries);
        localStorage.setItem('alchemistDiscoveries', JSON.stringify(newDiscoveries));
      }
    } else {
      const newFailCount = failCount + 1;
      if (newFailCount >= 5) {
        // Trigger hint
        const undiscovered = recipes.filter(r => !discoveredIds.includes(r.id));
        if (undiscovered.length > 0) {
          const hintRecipe = undiscovered.sort((a, b) => {
            const totalA = (a.lauk?.length || 0) + (a.bumbu?.length || 0) + (a.proses?.length || 0);
            const totalB = (b.lauk?.length || 0) + (b.bumbu?.length || 0) + (b.proses?.length || 0);
            if (totalA !== totalB) return totalA - totalB;
            return a.id - b.id;
          })[0];
          setFailCount(0);
          setModalState({ isOpen: true, status: 'hint', recipe: hintRecipe });
        } else {
          setFailCount(newFailCount);
          setModalState({ isOpen: true, status: 'fail', recipe: null });
        }
      } else {
        setFailCount(newFailCount);
        setModalState({ isOpen: true, status: 'fail', recipe: null });
      }
    }
  };

  const clearCanvas = () => {
    setSelectedLauk([]);
    setSelectedBumbu([]);
    setSelectedProses([]);
    setModalState({ isOpen: false, status: null, recipe: null });
  };

  const nextTutorialStep = () => {
    if (tutorialStep >= 4) {
      skipTutorial();
    } else {
      setTutorialStep(prev => prev + 1);
    }
  };

  const skipTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('tutorialDone', 'true');
  };

  const resetProgress = () => {
    if (window.confirm("Yakin ingin menghapus seluruh progres? Tindakan ini tidak bisa dibatalkan.")) {
      localStorage.removeItem('alchemistName');
      localStorage.removeItem('alchemistDiscoveries');
      setPlayerName('');
      setDiscoveredIds([]);
      setScreen('name-input');
    }
  };

  const questProgress = {
    Common: { discovered: 0, total: 0 },
    Rare: { discovered: 0, total: 0 },
    Elite: { discovered: 0, total: 0 },
    Epic: { discovered: 0, total: 0 },
    Legendary: { discovered: 0, total: 0 },
    GOD: { discovered: 0, total: 0 }
  };

  recipes.forEach(r => {
    const rarity = getRecipeRarity(r).label as keyof typeof questProgress;
    questProgress[rarity].total++;
    if (discoveredIds.includes(r.id)) {
      questProgress[rarity].discovered++;
    }
  });

  if (screen === 'loading') {
    return <div className="h-full flex items-center justify-center font-serif text-2xl italic opacity-50">Menyiapkan kanvas...</div>;
  }

  return (
    <div className="h-full flex flex-col relative w-full font-serif overflow-hidden">

      {/* GLOBAL HEADER */}
      <header className="pt-4 px-4 md:px-8 flex justify-between items-end border-b-2 border-[#2d2d2d] border-dashed shrink-0 pb-2">
        <div className="flex-1">
          <h1 className="text-2xl md:text-4xl font-bold italic tracking-tighter truncate" style={{ fontFamily: 'Georgia, serif' }}>Nusantara Culinary Alchemist</h1>
          <p className="text-xs md:text-sm opacity-60 italic uppercase tracking-widest truncate">A Sketchbook of Lost Flavors</p>
        </div>
        <div className="flex gap-2 md:gap-4 items-center shrink-0">
          <button
            onClick={toggleAudio}
            className="p-2 border-2 border-[#2d2d2d] flex items-center hover:bg-yellow-100 transition-colors sketchy-border min-h-[44px] min-w-[44px] justify-center text-[#2d2d2d]"
            title="Toggle BGM"
          >
            {isAudioPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          {screen === 'game' && (
            <button
              onClick={() => setIsRecipeBookOpen(true)}
              className="px-3 md:px-4 py-2 md:py-1 border-2 border-[#2d2d2d] text-[#2d2d2d] flex items-center justify-center sketchy-border min-h-[44px] hover:bg-[#2d2d2d] hover:text-white transition-colors"
            >
              <span className="text-[10px] md:text-xs font-bold uppercase truncate">
                <span className="opacity-60 mr-1 hidden md:inline">Buku:</span>
                {discoveredIds.length}/{recipes.length}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* SCREEN ROUTER */}
      <AnimatePresence mode="wait">

        {/* NAME INPUT */}
        {screen === 'name-input' && (
          <motion.main
            key="name-input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="max-w-lg w-full flex flex-col items-center">
              <h2 className="text-3xl md:text-5xl font-bold italic mb-8">Siapa nama Sang Alchemist?</h2>
              <form onSubmit={handleNameSubmit} className="w-full flex flex-col items-center gap-6">
                <input
                  type="text"
                  name="name"
                  placeholder="Ketik namamu di sini..."
                  required
                  maxLength={20}
                  className="w-full text-center text-2xl md:text-3xl p-4 bg-transparent border-b-4 border-dashed border-[#2d2d2d]/50 focus:border-[#2d2d2d] outline-none italic placeholder:opacity-30 text-[#2d2d2d]"
                />
                <button
                  type="submit"
                  className="mt-6 px-10 py-4 font-bold uppercase tracking-widest hover-jiggle min-h-[44px] text-xl md:text-2xl bg-transparent text-[#2d2d2d] hover:bg-[#2d2d2d] hover:text-[#fdfaf1] transition-all sketchy-border"
                >
                  Mulai Perjalanan
                </button>
              </form>
            </div>
          </motion.main>
        )}

        {/* START SCREEN (MENU) */}
        {screen === 'menu' && (
          <motion.main
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="max-w-2xl w-full flex flex-col items-center">
              <h2 className="text-4xl md:text-6xl font-bold mb-4 italic transform -rotate-2">Nusantara Culinary Alchemist</h2>
              <p className="text-xl md:text-2xl opacity-80 mb-12 transform rotate-1">Halo, <span className="font-bold underline decoration-wavy">{playerName}</span>! Siap meracik hari ini?</p>

              <div className="flex flex-col gap-6 w-full max-w-sm">
                <button
                  onClick={startGame}
                  className="w-full py-5 bg-transparent text-[#2d2d2d] text-2xl font-bold uppercase tracking-widest hover-jiggle hover:bg-[#2d2d2d] hover:text-[#fdfaf1] transition-colors sketchy-border min-h-[44px]"
                >
                  Mulai Meracik
                </button>
                <button
                  onClick={() => setIsRecipeBookOpen(true)}
                  className="w-full py-4 bg-transparent text-[#2d2d2d] text-xl font-bold uppercase tracking-widest hover-jiggle hover:bg-[#2d2d2d] hover:text-[#fdfaf1] transition-colors sketchy-border-alt min-h-[44px]"
                >
                  Buku Resep
                </button>
                <button
                  onClick={resetProgress}
                  className="w-full mt-4 py-2 bg-transparent text-red-600 text-sm font-bold uppercase tracking-widest hover:underline transition-colors min-h-[44px]"
                >
                  Reset Progress
                </button>
              </div>
            </div>
          </motion.main>
        )}

        {/* GAME SCREEN */}
        {screen === 'game' && (
          <motion.main
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col gap-4 p-4 md:p-6 overflow-hidden min-h-0 w-full max-w-5xl mx-auto"
          >
            {/* RETURN BUTTON */}
            <div className="shrink-0 flex items-center relative z-10 w-full mb-2">
              <button
                onClick={() => setScreen('menu')}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity font-bold uppercase text-sm border-b-2 border-transparent hover:border-[#2d2d2d] min-h-[44px]"
              >
                <ArrowLeft size={16} /> Kembali ke Menu
              </button>
            </div>

            {/* MAIN CONTENT AREA: QUEST + CANVAS */}
            <div className="flex flex-col md:flex-row gap-8 w-full items-start justify-center flex-1 min-h-0 overflow-y-auto pb-8">
              
              {/* QUEST BOX (Left) */}
              <div className="w-full md:w-64 shrink-0 sketchy-border bg-white/50 p-4 md:sticky md:top-0">
                <h3 className="font-bold italic text-xl md:text-2xl mb-4 text-center border-b-2 border-dashed border-[#2d2d2d] pb-2">Quest Log</h3>
                <div className="flex flex-col gap-3">
                  {Object.entries(questProgress).map(([tier, data]) => {
                    // Create a dummy recipe array just to get the color logic from our helper
                    const dummyRarity = getRecipeRarity({ lauk: [], bumbu: [], proses: [], id: 0, nama: tier, sejarah: '', citarasa: '' } as unknown as Recipe);
                    // Override label manually since dummy doesn't work correctly for total items
                    // We can just use hardcoded colors matching the tier for simplicity
                    let colorClass = '';
                    let animClass = '';
                    if(tier === 'GOD') { colorClass = 'text-yellow-500'; animClass = 'god-text-glitter'; }
                    if(tier === 'Legendary') colorClass = 'text-amber-500';
                    if(tier === 'Epic') colorClass = 'text-purple-500';
                    if(tier === 'Elite') colorClass = 'text-cyan-500';
                    if(tier === 'Rare') colorClass = 'text-green-500';
                    if(tier === 'Common') colorClass = 'text-gray-500';

                    return (
                      <div key={tier} className="flex justify-between items-center text-sm md:text-base border-b border-[#2d2d2d]/10 pb-1 last:border-0">
                        <span className={`font-bold uppercase tracking-wider ${colorClass} ${animClass}`}>{tier}</span>
                        <span className="font-mono text-[#2d2d2d] font-bold">{data.discovered} / {data.total}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MIDDLE/TOP: CANVAS (Right) */}
              <section className="flex-1 flex flex-col items-center justify-center w-full max-w-lg relative">
                <div className="w-full sketchy-dashed p-6 min-h-[140px] flex flex-col items-center justify-center relative bg-white/30">
                  <div className="flex flex-wrap justify-center gap-2 w-full">
                    <AnimatePresence>
                      {selectedLauk.map((item, idx) => (
                        <motion.span
                          key={'lauk' + item + idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="px-3 py-1 text-sm font-bold block sketchy-border bg-white text-[#2d2d2d]"
                        >{item}</motion.span>
                      ))}
                      {selectedBumbu.map((item, idx) => (
                        <motion.span
                          key={'bumbu' + item + idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="px-3 py-1 text-sm italic block sketchy-border bg-white font-serif text-[#2d2d2d]"
                        >{item}</motion.span>
                      ))}
                      {selectedProses.map((item, idx) => (
                        <motion.span
                          key={'proses' + item + idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="px-3 py-1 text-sm uppercase font-bold sketchy-border bg-[#2d2d2d] text-white"
                        >{item}</motion.span>
                      ))}
                    </AnimatePresence>

                    {selectedLauk.length === 0 && selectedBumbu.length === 0 && selectedProses.length === 0 && (
                      <p className="opacity-40 italic mt-2 text-sm w-full text-center">Taruh bahan-bahan di sini...</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 w-full flex justify-center z-10">
                  <button
                    onClick={handleMix}
                    className="px-10 py-4 bg-transparent text-[#2d2d2d] text-2xl font-bold uppercase tracking-widest hover-jiggle cursor-pointer w-full max-w-xs sketchy-border hover:bg-[#2d2d2d] hover:text-[#fdfaf1] transition-all focus:outline-none"
                  >
                    RAMU!
                  </button>
                </div>
                <button
                  onClick={clearCanvas}
                  className="mt-4 text-sm underline opacity-50 hover:opacity-100 transition-opacity min-h-[44px] px-4"
                >
                  Bersihkan Panci
                </button>

                {/* TABS INVENTORY BUTTONS */}
                <div className="flex gap-2 w-full max-w-lg mt-8 mb-4 justify-center">
                  <button
                    onClick={() => setActiveTab('lauk')}
                    className="flex-1 py-3 text-sm md:text-base font-bold italic transition-all bg-white/80 text-[#2d2d2d] hover:bg-[#e8e8e8]"
                    style={{ border: '2px solid #2d2d2d', borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px' }}
                  >
                    Lauk 🍗
                  </button>
                  <button
                    onClick={() => setActiveTab('bumbu')}
                    className="flex-1 py-3 text-sm md:text-base font-bold italic transition-all bg-white/80 text-[#2d2d2d] hover:bg-[#e8e8e8]"
                    style={{ border: '2px solid #2d2d2d', borderRadius: '15px 225px 15px 255px/255px 15px 225px 15px' }}
                  >
                    Bumbu 🧄
                  </button>
                  <button
                    onClick={() => setActiveTab('proses')}
                    className="flex-1 py-3 text-sm md:text-base font-bold italic transition-all bg-white/80 text-[#2d2d2d] hover:bg-[#e8e8e8]"
                    style={{ border: '2px solid #2d2d2d', borderRadius: '225px 15px 255px 15px/15px 255px 15px 225px' }}
                  >
                    Proses 🍳
                  </button>
                </div>
              </section>
            </div>
          </motion.main>
        )}


      </AnimatePresence>

      {/* INVENTORY MODAL OVERLAY */}
      <AnimatePresence>
        {activeTab !== null && (
          <div className="fixed inset-0 bg-[#2d2d2d]/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#fdfaf1] w-full max-w-2xl flex flex-col relative max-h-[85vh] sketchy-border"
              style={{ borderRadius: '15px 255px 15px 225px/225px 15px 255px 15px' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b-2 border-dashed border-[#2d2d2d] shrink-0">
                <h2 className="text-2xl md:text-3xl font-bold italic text-[#2d2d2d]">
                  {activeTab === 'lauk' && 'Pilih Lauk 🍗'}
                  {activeTab === 'bumbu' && 'Pilih Bumbu 🧄'}
                  {activeTab === 'proses' && 'Pilih Proses 🍳'}
                </h2>
                <button
                  onClick={() => setActiveTab(null)}
                  className="text-3xl font-bold hover:opacity-70 transition-opacity p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              {/* Content Grid */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white/30">
                <div className="flex flex-wrap gap-3">
                  {activeTab === 'lauk' && ALL_LAUK.map(item => (
                    <button
                      key={item}
                      onClick={() => handleSelect('lauk', item)}
                      className={`font-bold px-4 py-3 text-sm md:text-base transition-colors min-h-[44px] sketchy-border ${isSelected('lauk', item) ? 'bg-[#2d2d2d] text-white scale-105' : 'bg-white text-[#2d2d2d] hover:bg-[#e8e8e8]'
                        }`}
                    >
                      {item}
                    </button>
                  ))}

                  {activeTab === 'bumbu' && ALL_BUMBU.map(item => (
                    <button
                      key={item}
                      onClick={() => handleSelect('bumbu', item)}
                      className={`italic px-4 py-3 text-sm md:text-base transition-colors min-h-[44px] sketchy-border-alt ${isSelected('bumbu', item) ? 'bg-[#2d2d2d] text-white scale-105' : 'bg-white text-[#2d2d2d] hover:bg-[#e8e8e8]'
                        }`}
                    >
                      {item}
                    </button>
                  ))}

                  {activeTab === 'proses' && ALL_PROSES.map(item => (
                    <button
                      key={item}
                      onClick={() => handleSelect('proses', item)}
                      className={`uppercase font-bold px-4 py-3 text-sm md:text-base transition-colors min-h-[44px] sketchy-border ${isSelected('proses', item) ? 'bg-[#2d2d2d] text-white scale-105' : 'bg-white text-[#2d2d2d] hover:bg-[#e8e8e8]'
                        }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t-2 border-dashed border-[#2d2d2d] shrink-0 bg-[#fdfaf1] flex justify-end">
                <button
                  onClick={() => setActiveTab(null)}
                  className="px-8 py-3 bg-[#2d2d2d] text-white font-bold uppercase tracking-widest hover-jiggle sketchy-border min-h-[44px]"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESULT MODAL */}
      <AnimatePresence>
        {modalState.isOpen && (
          <div className="fixed inset-0 bg-[#2d2d2d]/60 flex items-center justify-center z-50 p-4 md:p-8 backdrop-blur-sm">
            {modalState.status === 'success' && modalState.recipe ? (
              <motion.div
                initial={{ scale: 0.9, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 40 }}
                className="bg-[#f5f2e9] w-full max-w-4xl p-6 md:p-10 flex flex-col md:flex-row relative max-h-[90vh] overflow-y-auto sketchy-border"
              >
                <button
                  onClick={() => setModalState({ isOpen: false, status: null, recipe: null })}
                  className="absolute top-2 right-4 text-3xl font-bold hover:opacity-70 transition-opacity p-2 min-h-[44px] min-w-[44px]"
                >
                  ×
                </button>

                <div className="w-full md:w-1/2 md:pr-8 md:border-r-2 border-black border-dashed flex flex-col items-center justify-center mb-6 md:mb-0">
                  <div className="w-40 h-40 md:w-64 md:h-64 bg-[#ddd] border-2 border-black flex items-center justify-center overflow-hidden relative" style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}>
                    <Image
                      src={`https://picsum.photos/seed/${modalState.recipe.id}/500/500`}
                      alt={modalState.recipe.nama}
                      fill
                      className="object-cover grayscale opacity-70"
                      style={{ filter: 'contrast(150%) sepia(20%)' }}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h2 className="mt-4 md:mt-6 text-3xl md:text-4xl font-bold italic text-center break-words">{modalState.recipe.nama}</h2>
                </div>

                <div className="w-full md:w-1/2 md:pl-8 flex flex-col gap-6 justify-center">
                  <div>
                    <h3 className="text-[10px] md:text-xs font-bold uppercase bg-yellow-200 inline-block px-2 border-black border">SEJARAH</h3>
                    <p className="mt-2 text-sm md:text-base leading-relaxed italic">{modalState.recipe.sejarah}</p>
                  </div>
                  <div>
                    <h3 className="text-[10px] md:text-xs font-bold uppercase bg-yellow-200 inline-block px-2 border-black border">CITARASA</h3>
                    <p className="mt-2 text-sm md:text-base leading-relaxed italic">{modalState.recipe.citarasa}</p>
                  </div>
                  <button
                    onClick={() => setModalState({ isOpen: false, status: null, recipe: null })}
                    className="mt-2 px-6 py-3 border-2 border-black font-bold hhover-jiggle bg-black text-white self-center md:self-start w-full md:w-auto sketchy-border min-h-[44px]"
                  >
                    Lanjut Meracik
                  </button>
                </div>
              </motion.div>
            ) : modalState.status === 'hint' && modalState.recipe ? (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-[#fdfaf1] p-8 md:p-10 text-center border-[3px] border-dashed border-[#fbbf24] flex flex-col items-center max-w-lg w-full relative"
                style={{ borderRadius: '15px 255px 15px 225px/225px 15px 255px 15px' }}
              >
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-7xl anim-bulb-glow z-20">💡</div>
                <h2 className="text-3xl md:text-4xl font-bold italic mb-4 text-[#fbbf24] mt-6">Oh nenek ingat!</h2>
                <div className="bg-[#fbbf24]/10 p-4 sketchy-border mb-6">
                  <h3 className="text-[10px] md:text-xs font-bold uppercase bg-[#fbbf24] text-[#2d2d2d] inline-block px-2 border-black border mb-2">Petunjuk Misteri</h3>
                  <p className="text-sm md:text-base italic text-[#2d2d2d] leading-relaxed">
                    {modalState.recipe.sejarah} {modalState.recipe.citarasa}
                  </p>
                </div>
                <button
                  onClick={clearCanvas}
                  className="px-8 py-3 bg-[#fbbf24] text-[#2d2d2d] font-bold tracking-widest hover-jiggle sketchy-border w-full min-h-[44px]"
                >
                  Coba Racik Lagi
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-[#fdfaf1] p-8 text-center border-[3px] border-dashed border-[#2d2d2d] flex flex-col items-center max-w-sm w-full"
                style={{ borderRadius: '15px 255px 15px 225px/225px 15px 255px 15px' }}
              >
                <div className="text-6xl mb-4">🍽️❌</div>
                <h2 className="text-2xl md:text-3xl font-bold italic mb-2 text-[#2d2d2d]">Yah ga enak ini mah...</h2>
                <p className="opacity-80 mb-6 text-sm md:text-base italic text-[#2d2d2d] font-bold">Kombinasi ngawur! Makananmu gosong jadi arang.</p>
                <button
                  onClick={clearCanvas}
                  className="px-8 py-3 bg-[#2d2d2d] text-[#fdfaf1] font-bold tracking-widest hover-jiggle sketchy-border w-full min-h-[44px]"
                >
                  Coba Lagi
                </button>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* RECIPE BOOK OVERLAY MODAL */}
      <AnimatePresence>
        {isRecipeBookOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-[#2d2d2d]/80 backdrop-blur-sm"
          >
            <div className="w-full h-full max-w-6xl bg-[#fdfaf1] flex flex-col relative sketchy-border overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b-4 border-[#2d2d2d] border-dashed shrink-0 bg-[#fdfaf1] z-10">
                <button
                  onClick={() => setIsRecipeBookOpen(false)}
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity font-bold uppercase text-sm md:text-base border-2 border-[#2d2d2d] text-[#2d2d2d] px-4 py-2 sketchy-border min-h-[44px] hover:bg-[#2d2d2d] hover:text-white"
                >
                  <ArrowLeft size={20} /> Kembali
                </button>
                <h2 className="text-2xl md:text-5xl font-bold italic tracking-tighter text-[#2d2d2d] text-right">
                  Buku Resep Alchemist
                </h2>
              </div>

              {/* Content Grid (Double Page Sketchbook styling on Desktop) */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-transparent">
                {/* Sketchbook middle divide effect for desktop */}
                <div className="hidden md:block absolute top-[88px] bottom-0 left-1/2 w-[2px] bg-[#2d2d2d]/20 border-l border-r border-[#2d2d2d]/10 pointer-events-none z-0"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 relative z-10">
                  {[...recipes].sort((a, b) => {
                    const isADiscovered = discoveredIds.includes(a.id);
                    const isBDiscovered = discoveredIds.includes(b.id);
                    if (isADiscovered && !isBDiscovered) return -1;
                    if (!isADiscovered && isBDiscovered) return 1;

                    const totalA = (a.lauk?.length || 0) + (a.bumbu?.length || 0) + (a.proses?.length || 0);
                    const totalB = (b.lauk?.length || 0) + (b.bumbu?.length || 0) + (b.proses?.length || 0);
                    if (totalB !== totalA) return totalB - totalA;

                    return a.id - b.id;
                  }).map((recipe, index) => {
                    const isDiscovered = discoveredIds.includes(recipe.id);
                    const rarity = getRecipeRarity(recipe);

                    if (isDiscovered) {
                      return (
                        <div key={recipe.id} className="border-b-2 border-dashed border-[#2d2d2d]/30 pb-6 flex flex-col gap-3 relative">
                          {/* Legendary Crown - Discovered */}
                          {rarity.label === 'Legendary' && (
                            <div className="absolute -top-3 -right-2 text-4xl transform rotate-12 drop-shadow-md z-20">👑</div>
                          )}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col items-start gap-1">
                              <h3 className="text-xl md:text-2xl font-bold italic text-[#2d2d2d] flex items-center gap-2 flex-wrap">
                                #{recipe.id} {recipe.nama}
                                {recipe.secret && <span className="text-[10px] bg-[#2d2d2d] text-white px-2 py-0.5 uppercase tracking-widest font-sans not-italic sketchy-border">SECRET</span>}
                              </h3>
                              <span className={`text-[10px] md:text-xs px-2 py-0.5 font-bold uppercase tracking-wider sketchy-border ${rarity.bg} ${rarity.text} ${rarity.animText || ''}`}>
                                {rarity.label}
                              </span>
                            </div>
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#ddd] border-2 border-[#2d2d2d] shrink-0 overflow-hidden relative sketchy-border-alt">
                              <Image
                                src={`https://picsum.photos/seed/${recipe.id}/150/150`}
                                alt={recipe.nama}
                                fill
                                className="object-cover grayscale opacity-80"
                                style={{ filter: 'contrast(120%) sepia(30%)' }}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {recipe.lauk.map(l => <span key={l} className="text-[10px] md:text-xs px-2 py-1 font-bold sketchy-border bg-white text-[#2d2d2d]">{l}</span>)}
                            {recipe.bumbu.map(b => <span key={b} className="text-[10px] md:text-xs px-2 py-1 italic sketchy-border-alt bg-white text-[#2d2d2d]">{b}</span>)}
                            {recipe.proses.map(p => <span key={p} className="text-[10px] md:text-xs px-2 py-1 uppercase font-bold sketchy-border bg-[#2d2d2d] text-white">{p}</span>)}
                          </div>

                          <div className="mt-2 bg-[#2d2d2d]/5 p-3 sketchy-border-alt">
                            <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#2d2d2d] mb-1">Sejarah & Citarasa</h4>
                            <p className="text-xs md:text-sm italic leading-relaxed text-[#2d2d2d]">{recipe.sejarah} {recipe.citarasa}</p>
                          </div>
                        </div>
                      );
                    } else {
                      // Undiscovered (Mystery Slot)
                      return (
                        <div key={recipe.id} className="border-b-2 border-dashed border-[#2d2d2d]/30 pb-6 flex flex-col gap-3 opacity-60 relative">
                          {/* Legendary Crown - Undiscovered Silhouette */}
                          {rarity.label === 'Legendary' && (
                            <div className="absolute -top-3 -right-2 text-4xl transform rotate-12 z-20 opacity-30 brightness-0">👑</div>
                          )}
                          <div className="flex items-center gap-4 p-4 border-2 border-[#2d2d2d] bg-[#2d2d2d]/5 sketchy-border items-center justify-center min-h-[140px] relative overflow-hidden">
                            <div className="absolute top-2 right-2">
                              <span className={`text-[8px] md:text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider sketchy-border ${rarity.bg} ${rarity.text} ${rarity.animText || ''}`}>
                                {rarity.label}
                              </span>
                            </div>
                            <div className="text-5xl font-bold text-[#2d2d2d]/40">?</div>
                            <div className="flex flex-col gap-2">
                              <h3 className="text-lg md:text-xl font-bold italic text-[#2d2d2d]">Misteri Belum Terungkap</h3>
                              <div className="flex flex-wrap gap-1">
                                <span className="text-[10px] font-bold uppercase opacity-50 mr-1 pt-1">Hint:</span>
                                {recipe.lauk.map(l => <span key={l} className="text-[10px] px-2 py-1 font-bold sketchy-border bg-white text-[#2d2d2d]">{l}</span>)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TUTORIAL OVERLAY */}
      <AnimatePresence>
        {showTutorial && screen === 'game' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40 flex flex-col items-center justify-center p-6 text-white text-center font-sans tracking-wide"
          >
            <div className="max-w-md w-full bg-[#fdfaf1] text-black border-4 border-black p-6 md:p-8" style={{ borderRadius: '15px 225px 15px 255px/255px 15px 225px 15px' }}>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold uppercase tracking-widest bg-yellow-200 px-3 py-1 border border-black">Tutorial {tutorialStep + 1}/5</span>
              </div>

              <p className="text-xl md:text-2xl italic font-serif leading-relaxed min-h-[140px] flex items-center justify-center border-y border-dashed border-black/20 py-4">
                {tutorialStep === 0 && "Selamat datang! Di sini, kamu adalah Alchemist. Tugasmu adalah menemukan 30+ resep Nusantara yang hilang."}
                {tutorialStep === 1 && "1. LAUK & KARBO: Pilih bahan dasar makananmu di area Inventory terlebih dahulu."}
                {tutorialStep === 2 && "2. BUMBU: Taruh bumbu-bumbu dapur untuk memberikan citarasa yang pas."}
                {tutorialStep === 3 && "3. PROSES: Tentukan cara memasaknya (Goreng, Bakar, Rebus, Asap)."}
                {tutorialStep === 4 && "4. RAMU!: Klik tombol RAMU di tengah Kanvas Pencampuran. Jika benar, resep akan terbuka!"}
              </p>

              <div className="flex flex-col gap-3 mt-6">
                <button onClick={nextTutorialStep} className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest hover-jiggle min-h-[44px]">
                  {tutorialStep < 4 ? "Lanjut" : "Siap Masak!"}
                </button>
                <button onClick={skipTutorial} className="w-full py-2 text-sm font-bold uppercase opacity-50 hover:opacity-100 min-h-[44px]">
                  Paham, biarkan saya masak!
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
