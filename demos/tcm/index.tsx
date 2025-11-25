import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, ArrowLeft, RefreshCw, Brain, Clock, Activity, History } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// --- Types & Constants ---
const ITEMS = ['Apple', 'Beach', 'Car', 'Dog', 'Eagle', 'Forest'];
const VECTOR_SIZE = 6; // Corresponding to the 6 items for simplicity (localist representation)

// --- Math Helpers ---

// Generate a random vector (not used in simplified localist version, but good to have)
const generateVector = (size: number) => Array.from({ length: size }, () => Math.random());

// Normalize a vector to length 1
const normalize = (v: number[]) => {
  const mag = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
  return mag === 0 ? v : v.map(val => val / mag);
};

// Dot product
const dot = (v1: number[], v2: number[]) => v1.reduce((sum, val, i) => sum + val * v2[i], 0);

// Scale vector
const scale = (v: number[], s: number) => v.map(val => val * s);

// Add vectors
const add = (v1: number[], v2: number[]) => v1.map((val, i) => val + v2[i]);

// Create an item vector (One-hot encoding for tutorial simplicity)
// Item 0 = [1, 0, 0...], Item 1 = [0, 1, 0...]
const createItemVector = (index: number, size: number) => {
  const v = new Array(size).fill(0);
  if (index >= 0 && index < size) v[index] = 1;
  return v;
};

// --- Components ---

const VectorDisplay = ({ vector, label, highlightIndex = -1 }: { vector: number[]; label: string; highlightIndex?: number }) => {
  return (
    <div className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">{label}</div>
      <div className="flex flex-col gap-1 bg-slate-100 p-2 rounded border border-slate-200">
        {vector.map((val, i) => (
          <div key={i} className="flex items-center gap-2 group">
             <div className="w-4 text-[10px] text-right text-slate-400 font-mono w-8">
               {ITEMS[i] ? ITEMS[i].substring(0,3) : `Dim${i}`}
             </div>
            <div 
              className={`w-8 h-4 sm:w-12 sm:h-6 rounded border transition-all duration-500 relative overflow-hidden ${
                i === highlightIndex ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-slate-300'
              }`}
              style={{ backgroundColor: `rgba(59, 130, 246, ${Math.min(Math.abs(val), 1)})` }}
            >
              <div 
                className="absolute inset-0 bg-blue-500 transition-transform duration-500"
                style={{ transform: `scaleX(${Math.min(Math.abs(val), 1)})`, transformOrigin: 'left' }}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono w-8">
              {val.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Slides ---

const IntroSlide = () => (
  <div className="space-y-6">
    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
      <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
        <Clock className="w-6 h-6" /> What is Mental Context?
      </h2>
      <p className="text-lg text-blue-800 leading-relaxed">
        Imagine you are at a party. You're talking to a friend, hearing music, and feeling happy. 
        All these internal and external states form your <strong>Temporal Context</strong>.
      </p>
      <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
        <p className="text-slate-700">
          The <strong>Temporal Context Model (TCM)</strong> suggests that our memory works like a timeline. 
          We don't just store items; we store the <em>context</em> (mental state) we were in when we saw them.
        </p>
      </div>
    </div>
  </div>
);

const DriftSimulator = () => {
  const [beta, setBeta] = useState(0.6); // Input strength
  // In many TCM variants rho = sqrt(1 - beta^2) to maintain unit length, but simple decay rho is easier to teach.
  // We'll use a manual rho for clarity or a calculated one. Let's stick to explicit Rho for simplicity.
  const [rho, setRho] = useState(0.8); 
  
  const [context, setContext] = useState<number[]>(new Array(6).fill(0));
  const [history, setHistory] = useState<{item: string, context: number[]}[]>([]);
  const [step, setStep] = useState(0);

  const currentItemName = ITEMS[step % ITEMS.length];
  
  const processNextItem = () => {
    const itemIdx = step % ITEMS.length;
    const itemVec = createItemVector(itemIdx, VECTOR_SIZE);
    
    // Core TCM Equation: C_new = rho * C_old + beta * Item_Input
    const decayedContext = scale(context, rho);
    const inputContext = scale(itemVec, beta);
    const newContext = add(decayedContext, inputContext);
    
    // Often normalized in real models, but we'll skip strict normalization to keep math visible
    // const finalContext = normalize(newContext); 
    
    setContext(newContext);
    setHistory([...history, { item: currentItemName, context: newContext }]);
    setStep(s => s + 1);
  };

  const reset = () => {
    setContext(new Array(6).fill(0));
    setHistory([]);
    setStep(0);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4">The Equation of Drift</h3>
          <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm shadow-inner mb-6">
            Context<sub>new</sub> = (ρ × Context<sub>old</sub>) + (β × Input)
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="flex justify-between text-sm font-semibold text-slate-700 mb-1">
                <span>Decay (ρ): Keep old thoughts</span>
                <span>{rho.toFixed(2)}</span>
              </label>
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={rho} onChange={(e) => setRho(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <p className="text-xs text-slate-500 mt-1">High ρ means context changes slowly.</p>
            </div>
            <div>
              <label className="flex justify-between text-sm font-semibold text-slate-700 mb-1">
                <span>Input Strength (β): Add new thought</span>
                <span>{beta.toFixed(2)}</span>
              </label>
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={beta} onChange={(e) => setBeta(parseFloat(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <p className="text-xs text-slate-500 mt-1">High β means new items dominate context quickly.</p>
            </div>
          </div>

          <div className="flex gap-3">
             <button 
              onClick={processNextItem}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              Present Item: "{currentItemName}" <ArrowRight size={16} />
            </button>
            <button onClick={reset} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[300px]">
           <div className="flex items-end gap-8">
              {/* Previous State Visualization (Conceptual) */}
              <div className="opacity-50 scale-75 hidden sm:block">
                 <VectorDisplay vector={scale(context, rho)} label="Old (Decayed)" />
              </div>
              <div className="text-2xl text-slate-400 font-bold hidden sm:block">+</div>
              {/* Input Visualization */}
              <div className="opacity-75 scale-75 hidden sm:block">
                  <VectorDisplay 
                    vector={scale(createItemVector(step % ITEMS.length, VECTOR_SIZE), beta)} 
                    label="Input" 
                    highlightIndex={step % ITEMS.length}
                  />
              </div>
               <div className="text-2xl text-slate-400 font-bold hidden sm:block">=</div>
              {/* Result */}
              <VectorDisplay vector={context} label="Current Context" />
           </div>
           <p className="text-center text-sm text-slate-500 mt-4 max-w-xs">
             Notice how the "Current Context" is a blend of the history. The bar for "{ITEMS[(step-1 + ITEMS.length) % ITEMS.length] || 'None'}" is fading, while "{currentItemName}" is fresh.
           </p>
        </div>
      </div>
    </div>
  );
};

const RetrievalRecency = () => {
  // Pre-calculate a scenario
  const rho = 0.6;
  const beta = 0.8;
  const listLength = 6;
  
  // Calculate states
  const states: {item: string, contextAtEncoding: number[]}[] = [];
  let currentContext = new Array(VECTOR_SIZE).fill(0);

  for (let i = 0; i < listLength; i++) {
    const itemVec = createItemVector(i, VECTOR_SIZE);
    currentContext = add(scale(currentContext, rho), scale(itemVec, beta));
    states.push({
      item: ITEMS[i],
      contextAtEncoding: currentContext // In TCM, we associate item with the context present *when it appeared*
    });
  }
  
  // The context at the very end of the list (what cues retrieval)
  const endOfListContext = currentContext;

  // Calculate similarity (dot product) between end-context and each item's encoded context
  // NOTE: In TCM, we typically check similarity between Probe Context and Item's Associated Context.
  // Or simply, how much does the current context overlap with the context stored with the item?
  // For simplicity, we assume the item is linked to the context at time i.
  const similarities = states.map((state, i) => ({
    name: state.item,
    similarity: dot(endOfListContext, state.contextAtEncoding),
    index: i
  }));

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
        <h3 className="text-xl font-bold text-indigo-900 mb-2">The Recency Effect</h3>
        <p className="text-indigo-800 mb-4">
          Why do we remember the last things we heard? Because the context <strong>at the end of the list</strong> is most similar to the context <strong>during the presentation of the last few items</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={similarities}>
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis hide />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                content={({active, payload}) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-2 shadow rounded border border-slate-200 text-xs">
                        <p className="font-bold">{payload[0].payload.name}</p>
                        <p>Activation: {payload[0].value.toFixed(2)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="similarity" fill="#6366f1" radius={[4, 4, 0, 0]} name="Activation Strength" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-xs text-slate-500 mt-2">Activation Strength (Similarity to Current Context)</p>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-700">How Retrieval Works</h4>
          <ul className="space-y-3 text-sm text-slate-600 list-disc pl-4">
            <li>Your brain uses the <strong>Current Context</strong> as a search query.</li>
            <li>Items associated with a similar context "light up" (high activation).</li>
            <li>Since context drifts slowly, the context at the end is very similar to the context of item #6, slightly less for #5, etc.</li>
            <li>This produces the <strong>Recency Effect</strong> naturally without a separate "short term memory" store.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const RetrievalContiguity = () => {
  const [recalledIndex, setRecalledIndex] = useState<number | null>(null);

  // Simulation setup
  const rho = 0.75;
  const beta = 0.6;
  const listLength = 6;
  
  // 1. Generate Encoding History
  // We need to store what context was associated with each item.
  // History: [ {item, contextVector} ]
  const encodingHistory = useMemo(() => {
    let ctx = new Array(VECTOR_SIZE).fill(0);
    const hist = [];
    for (let i = 0; i < listLength; i++) {
      const itemVec = createItemVector(i, VECTOR_SIZE);
      ctx = add(scale(ctx, rho), scale(itemVec, beta));
      hist.push({ item: ITEMS[i], context: ctx, originalIndex: i });
    }
    return hist;
  }, []);

  // 2. Calculate Activation based on current probe
  // If nothing recalled yet, probe is End-of-List context.
  // If recalledIndex is set, probe is the context retrieved by that item.
  
  const currentProbeContext = recalledIndex === null 
    ? encodingHistory[listLength - 1].context 
    : encodingHistory[recalledIndex].context; // "Mental Time Travel": We reinstate the context of the recalled item

  const activations = encodingHistory.map((entry, i) => {
    // Don't activate the item itself if we are currently focusing on it (conceptually, we want to see what *else* it triggers)
    // But for visualization, let's show everything.
    return {
      name: entry.item,
      activation: dot(currentProbeContext, entry.context),
      isTarget: i === recalledIndex
    };
  });

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
        <h3 className="text-xl font-bold text-emerald-900 mb-2 flex items-center gap-2">
           <History className="w-5 h-5"/> Mental Time Travel
        </h3>
        <p className="text-emerald-800 mb-4">
          When you remember an item, you <strong>recover</strong> its context. This old context then acts as a cue for other items.
          Since context changes slowly, the recovered context is similar to the items that were neighbors in time.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 text-center">
          Click an item to "Recall" it and travel back in time
        </h4>
        
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {ITEMS.map((item, i) => (
            <button
              key={item}
              onClick={() => setRecalledIndex(i)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                recalledIndex === i 
                  ? 'bg-emerald-600 text-white shadow-lg scale-110' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item}
            </button>
          ))}
          {recalledIndex !== null && (
             <button onClick={() => setRecalledIndex(null)} className="px-4 py-2 rounded-full text-sm border border-slate-300 text-slate-500 hover:bg-slate-50">
               Reset to End
             </button>
          )}
        </div>

        <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activations}>
              <XAxis dataKey="name" />
              <YAxis hide />
              <Tooltip content={({active, payload}) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-2 shadow rounded border border-slate-200 text-xs">
                        <p className="font-bold">{payload[0].payload.name}</p>
                        <p>Cue Strength: {payload[0].value.toFixed(2)}</p>
                      </div>
                    );
                  }
                  return null;
                }}/>
              <Bar dataKey="activation" fill="#10b981">
                {activations.map((entry, index) => (
                  <cell key={`cell-${index}`} fill={entry.isTarget ? '#059669' : (Math.abs(index - (recalledIndex||100)) === 1 ? '#34d399' : '#d1fae5')} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-slate-500 text-sm mt-4">
           {recalledIndex === null 
             ? "Currently at end of list. Recency effect dominates." 
             : `Recalled "${ITEMS[recalledIndex]}". Notice how neighbors "${ITEMS[recalledIndex-1]||''}" and "${ITEMS[recalledIndex+1]||''}" are now highly activated? This is the Contiguity Effect.`}
        </p>
      </div>
    </div>
  );
};

// --- Main App ---

const steps = [
  { 
    title: "Introduction", 
    component: IntroSlide 
  },
  { 
    title: "Context Drift", 
    component: DriftSimulator 
  },
  { 
    title: "The Recency Effect", 
    component: RetrievalRecency 
  },
  { 
    title: "Mental Time Travel", 
    component: RetrievalContiguity 
  }
];

const App = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const CurrentComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 font-sans text-slate-900">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-100 p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Temporal Context Model
            </h1>
            <p className="text-slate-500 text-sm mt-1">Interactive Tutorial</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
             <span className="bg-slate-100 px-3 py-1 rounded-full">
               Step {currentStep + 1} of {steps.length}
             </span>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6 md:p-8 min-h-[500px]">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{steps[currentStep].title}</h2>
            <div className="h-1 w-20 bg-blue-500 rounded-full"></div>
          </div>
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CurrentComponent />
          </div>
        </main>

        {/* Footer Navigation */}
        <footer className="bg-slate-50 border-t border-slate-200 p-6 flex justify-between items-center">
          <button 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft size={20} /> Previous
          </button>
          
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-2 h-2 rounded-full transition-all ${idx === currentStep ? 'bg-blue-600 w-4' : 'bg-slate-300'}`}
              />
            ))}
          </div>

          <button 
            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            disabled={currentStep === steps.length - 1}
            className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-200"
          >
            Next <ArrowRight size={20} />
          </button>
        </footer>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
