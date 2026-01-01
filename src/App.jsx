import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Shield, Play, RotateCcw, Trophy, Github } from 'lucide-react';

// --- Constants ---
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const FRAGMENT_TYPES = {
  LIGHT: 'light',
  VOID: 'void',
  POWERUP: 'powerup'
};

const App = () => {
  const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [fragments, setFragments] = useState([]);
  const [vfx, setVfx] = useState([]);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);

  const gameRef = useRef(null);
  const requestRef = useRef();
  const lastSpawnTime = useRef(0);

  // --- Sound Simulation (Visual Only for this environment) ---
  const triggerVfx = (x, y, type) => {
    const id = Math.random();
    setVfx(prev => [...prev, { id, x, y, type }]);
    setTimeout(() => {
      setVfx(prev => prev.filter(v => v.id !== id));
    }, 1000);
  };

  // --- Game Logic ---
  const spawnFragment = useCallback(() => {
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y, vx, vy;

    const speed = 2 + (level * 0.5);

    if (side === 0) { x = Math.random() * GAME_WIDTH; y = -20; vx = (Math.random() - 0.5) * 2; vy = speed; }
    else if (side === 1) { x = GAME_WIDTH + 20; y = Math.random() * GAME_HEIGHT; vx = -speed; vy = (Math.random() - 0.5) * 2; }
    else if (side === 2) { x = Math.random() * GAME_WIDTH; y = GAME_HEIGHT + 20; vx = (Math.random() - 0.5) * 2; vy = -speed; }
    else { x = -20; y = Math.random() * GAME_HEIGHT; vx = speed; vy = (Math.random() - 0.5) * 2; }

    const isVoid = Math.random() > 0.7;
    const type = isVoid ? FRAGMENT_TYPES.VOID : FRAGMENT_TYPES.LIGHT;

    return {
      id: Math.random(),
      x,
      y,
      vx,
      vy,
      type,
      size: type === FRAGMENT_TYPES.VOID ? 30 : 20,
      rotation: Math.random() * 360
    };
  }, [level]);

  const update = useCallback((time) => {
    if (gameState !== 'PLAYING') return;

    // Spawning logic
    if (time - lastSpawnTime.current > Math.max(1000 - (level * 50), 400)) {
      setFragments(prev => [...prev, spawnFragment()]);
      lastSpawnTime.current = time;
    }

    setFragments(prev => {
      return prev
        .map(f => ({
          ...f,
          x: f.x + f.vx,
          y: f.y + f.vy,
          rotation: f.rotation + 2
        }))
        .filter(f => (
          f.x > -100 && f.x < GAME_WIDTH + 100 &&
          f.y > -100 && f.y < GAME_HEIGHT + 100
        ));
    });

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, level, spawnFragment]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      requestRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, update]);

  // --- Interaction Handlers ---
  const handleFragmentClick = (id, x, y, type) => {
    if (gameState !== 'PLAYING') return;

    if (type === FRAGMENT_TYPES.LIGHT) {
      setScore(s => s + (10 * multiplier));
      setMultiplier(m => Math.min(m + 0.1, 5));
      triggerVfx(x, y, 'collect');
    } else {
      setLives(l => {
        if (l <= 1) {
          setGameState('GAMEOVER');
          return 0;
        }
        return l - 1;
      });
      setMultiplier(1);
      triggerVfx(x, y, 'damage');
    }

    setFragments(prev => prev.filter(f => f.id !== id));
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    setMultiplier(1);
    setFragments([]);
    setLevel(1);
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (score > highScore) setHighScore(score);
    // Level up every 200 points
    const newLevel = Math.floor(score / 200) + 1;
    if (newLevel !== level) setLevel(newLevel);
  }, [score]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white font-sans overflow-hidden select-none">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header Info */}
      <div className="z-10 w-full max-w-4xl px-8 mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            NEON NEBULA
          </h1>
          <p className="text-xs text-slate-500 font-mono">ESTABLISHING CONNECTION... Lvl {level}</p>
        </div>
        
        <div className="flex gap-8 items-center font-mono">
          <div className="text-right">
            <div className="text-xs text-slate-500">SCORE</div>
            <div className="text-2xl font-bold text-blue-400">{score.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">MULTIPLIER</div>
            <div className="text-2xl font-bold text-purple-400">x{multiplier.toFixed(1)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">BEST</div>
            <div className="text-2xl font-bold text-amber-400">{highScore.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Game Stage */}
      <div 
        ref={gameRef}
        className="relative z-20 bg-slate-900/50 border-2 border-slate-800 rounded-2xl shadow-2xl overflow-hidden cursor-crosshair"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Lives Counter */}
        <div className="absolute top-4 left-4 flex gap-2 z-30">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ 
                scale: i < lives ? 1 : 0.8,
                opacity: i < lives ? 1 : 0.2,
                color: i < lives ? '#f43f5e' : '#475569'
              }}
            >
              <Shield size={24} fill={i < lives ? "currentColor" : "none"} />
            </motion.div>
          ))}
        </div>

        {/* Start Overlay */}
        <AnimatePresence>
          {gameState === 'START' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-40 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ y: 20 }} animate={{ y: 0 }}
                className="text-center p-8 rounded-3xl bg-slate-900 border border-slate-800"
              >
                <div className="mb-6 inline-flex p-4 rounded-full bg-blue-500/10 text-blue-400">
                  <Zap size={48} />
                </div>
                <h2 className="text-3xl font-bold mb-2">Ready to Pulse?</h2>
                <p className="text-slate-400 mb-8 max-w-xs">Collect blue fragments. Avoid the red void shards. Speed increases as you score.</p>
                <button 
                  onClick={startGame}
                  className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Play size={20} fill="white" /> INITIALIZE CORE
                  <div className="absolute inset-0 bg-blue-400 blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {gameState === 'GAMEOVER' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/40 z-40 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="text-center p-10 rounded-3xl bg-slate-950 border-2 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
              >
                <Trophy size={64} className="mx-auto mb-4 text-amber-400" />
                <h2 className="text-4xl font-black mb-2 text-white italic">NEBULA COLLAPSED</h2>
                <div className="text-6xl font-black text-red-500 mb-6">{score.toLocaleString()}</div>
                <div className="text-slate-400 mb-8">Final Multiplier: x{multiplier.toFixed(1)}</div>
                
                <button 
                  onClick={startGame}
                  className="px-10 py-4 bg-white text-slate-950 rounded-xl font-black text-xl hover:bg-slate-200 transition-all flex items-center gap-2 mx-auto"
                >
                  <RotateCcw size={24} /> REBOOT SYSTEM
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Elements */}
        {fragments.map(f => (
          <div
            key={f.id}
            onClick={() => handleFragmentClick(f.id, f.x, f.y, f.type)}
            className="absolute transition-transform hover:scale-110 active:scale-90"
            style={{ 
              left: f.x, 
              top: f.y, 
              transform: `translate(-50%, -50%) rotate(${f.rotation}deg)` 
            }}
          >
            {f.type === FRAGMENT_TYPES.LIGHT ? (
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-blue-400 blur-md opacity-40 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-6 h-6 bg-blue-400 rounded-sm rotate-45 border-2 border-white/50" />
              </div>
            ) : (
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-red-500 blur-lg opacity-60 animate-pulse" />
                <div className="relative w-10 h-10 bg-red-600 rounded-full border-4 border-red-400 flex items-center justify-center overflow-hidden">
                   <div className="w-full h-1 bg-white/20 rotate-45 absolute" />
                   <div className="w-full h-1 bg-white/20 -rotate-45 absolute" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* VFX Layer */}
        {vfx.map(v => (
          <motion.div
            key={v.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            className={`absolute pointer-events-none rounded-full border-4 ${v.type === 'collect' ? 'border-blue-400' : 'border-red-500'}`}
            style={{ 
              left: v.x, 
              top: v.y, 
              width: 40, 
              height: 40, 
              transform: 'translate(-50%, -50%)' 
            }}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-8 grid grid-cols-3 gap-8 max-w-4xl text-center">
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
          <Sparkles size={20} className="mx-auto mb-2 text-blue-400" />
          <h3 className="text-sm font-bold mb-1">COLLECT</h3>
          <p className="text-xs text-slate-500">Click blue shards for points and multipliers.</p>
        </div>
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
          <Zap size={20} className="mx-auto mb-2 text-purple-400" />
          <h3 className="text-sm font-bold mb-1">STREAK</h3>
          <p className="text-xs text-slate-500">Multiplier grows as you catch shards. Don't miss!</p>
        </div>
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
          <Shield size={20} className="mx-auto mb-2 text-red-500" />
          <h3 className="text-sm font-bold mb-1">SURVIVE</h3>
          <p className="text-xs text-slate-500">Touching Red Void Shards damages your core.</p>
        </div>
      </div>

      <div className="mt-12 opacity-30 flex items-center gap-2 grayscale">
        <Github size={16} />
        <span className="text-[10px] font-mono tracking-widest uppercase">Protocol: Neon-Nebula-OS-v2.5</span>
      </div>
    </div>
  );
};

export default App;