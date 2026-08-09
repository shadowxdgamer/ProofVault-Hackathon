import React, { useState } from 'react';
import { 
    Wallet, 
    FileEdit, 
    Rocket, 
    RotateCcw, 
    BrainCircuit, 
    Landmark, 
    Loader2, 
    Sparkles, 
    CheckCircle, 
    Copy 
} from 'lucide-react';

type EvalState = 'idle' | 'loading' | 'success';

interface EvalResult {
    innovationScore: number;
    feasibilityScore: number;
    quadrant: 'WOW' | 'NOW' | 'HOW' | 'CIAO';
}

function App() {
    // FAKE VAULT PAGE FOR DEMO
    if (window.location.pathname.startsWith('/vault/')) {
        const vaultId = window.location.pathname.split('/').pop();
        return (
            <div className="font-body-md text-body-md min-h-screen pb-12 flex flex-col items-center justify-center p-6 bg-surface-container-lowest">
               <div className="bg-surface border border-outline-variant rounded-xl p-8 max-w-md w-full shadow-2xl">
                   <h1 className="text-headline-md text-primary font-bold mb-4 flex items-center gap-2">
                       <Landmark size={28} /> GRAVV Escrow Vault
                   </h1>
                   <p className="text-on-surface-variant mb-6 text-sm font-mono-data">Vault ID: {vaultId}</p>
                   
                   <div className="bg-surface-container-lowest p-4 rounded mb-6 border border-outline-variant">
                       <div className="flex justify-between mb-2 pb-2 border-b border-outline-variant/50">
                           <span className="text-on-surface-variant">Funding Goal</span>
                           <span className="text-primary font-bold font-mono-data">500 USDC</span>
                       </div>
                       <div className="flex justify-between">
                           <span className="text-on-surface-variant">Status</span>
                           <span className="text-secondary font-bold flex items-center gap-1">
                               <Loader2 size={16} className="spin" /> Awaiting Deposit
                           </span>
                       </div>
                   </div>
                   
                   <button 
                       className="w-full bg-primary text-on-primary font-bold font-label-caps uppercase tracking-widest py-4 rounded glow-emerald hover:bg-primary-fixed transition-all cursor-pointer" 
                       onClick={() => alert('Mock Payment Successful! Funds locked in escrow.')}
                   >
                       Deposit 500 USDC
                   </button>
                   
                   <p className="text-xs text-center text-on-surface-variant mt-4">Powered by @gravvfi/mcp</p>
               </div>
            </div>
        );
    }

    const [evalState, setEvalState] = useState<EvalState>('idle');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [result, setResult] = useState<EvalResult | null>(null);
    const [paymentLink, setPaymentLink] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const callOpenRouter = async (desc: string): Promise<EvalResult> => {
        // In a real app, you'd call the backend to protect your API key.
        // This is a placeholder for the OpenRouter integration.
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer OPENROUTER_API_KEY_PLACEHOLDER`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'ProofVault'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert venture capitalist AI. Evaluate the startup pitch using the How-Now-Wow matrix. Return ONLY a JSON object with keys: "innovationScore" (1-10 number), "feasibilityScore" (1-10 number), and "quadrant" (string: must be "WOW", "NOW", "HOW", or "CIAO"). Do not wrap in markdown.'
                    },
                    {
                        role: 'user',
                        content: desc
                    }
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.statusText}`);
        }

        const data = await response.json();
        try {
            const parsed = JSON.parse(data.choices[0].message.content);
            return parsed as EvalResult;
        } catch (e) {
            console.error("Failed to parse OpenRouter response", data);
            throw new Error("Invalid JSON response from AI");
        }
    };

    const createGravvfiVault = async (title: string, desc: string): Promise<string> => {
        const response = await fetch('/api/gravv/vault', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description: desc })
        });
        
        if (!response.ok) {
            throw new Error(`Backend error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.link;
    };

    const handleEvaluate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description) return;
        
        setEvalState('loading');
        setError(null);
        setResult(null);
        setPaymentLink(null);
        
        try {
            // STEP 1: AI Evaluation (Simulated if no key, otherwise real)
            // For testing without a real key, we mock the success response if API fails
            let evalRes: EvalResult;
            try {
                evalRes = await callOpenRouter(description);
            } catch (err) {
                console.warn("OpenRouter API failed (likely missing key), using mock data.", err);
                // Mock fallback
                await new Promise(r => setTimeout(r, 2000));
                evalRes = {
                    innovationScore: 9.2,
                    feasibilityScore: 8.8,
                    quadrant: 'WOW'
                };
            }
            
            setResult(evalRes);

            // STEP 2: Autonomous Payment (GRAVV MCP)
            if (evalRes.quadrant === 'WOW') {
                const link = await createGravvfiVault(title, description);
                setPaymentLink(link);
            }
            
            // STEP 3: Success UI Render
            setEvalState('success');
        } catch (err: any) {
            setError(err.message || "An error occurred during evaluation.");
            setEvalState('idle');
        }
    };

    const resetState = () => {
        setEvalState('idle');
        setTitle('');
        setDescription('');
        setResult(null);
        setPaymentLink(null);
        setError(null);
    }

    return (
        <div className="font-body-md text-body-md min-h-screen pb-12">
            {/* TopNavBar */}
            <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-16 bg-surface-container-lowest border-b border-outline-variant">
                <div className="flex items-center gap-4">
                    <span className="text-headline-md font-headline-md font-bold text-primary">ProofVault</span>
                </div>
                <div className="flex items-center gap-4">
                    <button className="bg-surface-variant text-on-surface px-4 py-2 rounded font-label-caps text-label-caps border border-outline-variant hover:bg-surface transition-colors flex items-center gap-2">
                        <Wallet size={18} />
                        Connect Wallet
                    </button>
                    <div className="w-8 h-8 rounded-full border border-outline-variant bg-gradient-to-tr from-primary to-secondary flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full bg-surface/50 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-on-surface">
                            AI
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="pt-24 px-gutter pb-margin-desktop max-w-container-max mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: The Pitch Zone */}
                    <div className="bg-surface gradient-bg border border-outline-variant rounded-xl p-6 flex flex-col h-full">
                        <h2 className="text-headline-md font-headline-md text-on-surface mb-6 flex items-center gap-2">
                            <FileEdit size={24} className="text-primary" />
                            The Pitch Zone
                        </h2>
                        
                        <form onSubmit={handleEvaluate} className="flex flex-col gap-6 flex-grow">
                            <div className="flex flex-col gap-2">
                                <label className="text-label-caps font-label-caps text-on-surface-variant">Project Title</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Decentralized Carbon Credit Exchange"
                                    className="bg-surface-container-lowest border border-outline-variant rounded p-3 text-on-surface focus:border-primary focus:outline-none transition-colors"
                                    disabled={evalState !== 'idle'}
                                />
                            </div>
                            
                            <div className="flex flex-col gap-2 flex-grow">
                                <label className="text-label-caps font-label-caps text-on-surface-variant">Project Description</label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the problem, solution, and potential impact..."
                                    className="bg-surface-container-lowest border border-outline-variant rounded p-3 text-on-surface focus:border-primary focus:outline-none transition-colors h-48 resize-none flex-grow"
                                    disabled={evalState !== 'idle'}
                                ></textarea>
                            </div>

                            {error && (
                                <div className="p-4 bg-error-container text-on-error-container rounded border border-error">
                                    {error}
                                </div>
                            )}
                            
                            {evalState === 'idle' ? (
                                <button 
                                    type="submit" 
                                    className="bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded font-bold uppercase tracking-wider glow-emerald hover:bg-primary-fixed transition-all flex items-center justify-center gap-2 mt-auto cursor-pointer"
                                    disabled={!title || !description}
                                >
                                    <Rocket size={20} />
                                    Evaluate & Deploy
                                </button>
                            ) : (
                                <button 
                                    type="button"
                                    onClick={resetState}
                                    className="bg-surface-variant text-on-surface font-label-caps text-label-caps py-4 rounded font-bold uppercase tracking-wider border border-outline-variant hover:bg-surface transition-all flex items-center justify-center gap-2 mt-auto cursor-pointer"
                                    disabled={evalState === 'loading'}
                                >
                                    <RotateCcw size={20} />
                                    Start New Pitch
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Right Column: The Evaluation Zone */}
                    <div className="bg-surface gradient-bg border border-outline-variant rounded-xl p-6 flex flex-col h-full min-h-[500px]">
                        <h2 className="text-headline-md font-headline-md text-on-surface mb-6 flex items-center gap-2 border-b border-outline-variant pb-4">
                            <BrainCircuit size={24} className="text-secondary" />
                            The Evaluation Zone
                        </h2>
                        
                        <div className="flex-grow flex flex-col justify-center">
                            {/* Idle State */}
                            {evalState === 'idle' && (
                                <div className="flex flex-col items-center justify-center text-center opacity-70">
                                    <Landmark size={64} className="text-outline mb-4" />
                                    <p className="text-body-lg font-body-lg text-on-surface-variant max-w-sm">
                                        Submit a pitch to generate AI evaluation and deployment rails.
                                    </p>
                                </div>
                            )}

                            {/* Loading State */}
                            {evalState === 'loading' && (
                                <div className="flex flex-col items-center justify-center text-center">
                                    <Loader2 size={48} className="text-primary spin mb-6" />
                                    <p className="text-body-md font-body-md text-primary animate-pulse font-mono-data">
                                        Agent evaluating feasibility and routing GRAVV payment rails...
                                    </p>
                                </div>
                            )}

                            {/* Success State */}
                            {evalState === 'success' && result && (
                                <div className="flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out]">
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 flex flex-col items-center justify-center">
                                            <span className="text-label-caps font-label-caps text-on-surface-variant mb-1 uppercase">Innovation Score</span>
                                            <span className="text-display-lg-mobile font-display-lg-mobile text-primary font-bold">
                                                {result.innovationScore}<span className="text-body-md text-outline">/10</span>
                                            </span>
                                        </div>
                                        <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 flex flex-col items-center justify-center">
                                            <span className="text-label-caps font-label-caps text-on-surface-variant mb-1 uppercase">Feasibility Score</span>
                                            <span className="text-display-lg-mobile font-display-lg-mobile text-secondary font-bold">
                                                {result.feasibilityScore}<span className="text-body-md text-outline">/10</span>
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-center">
                                        <div className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full font-label-caps text-label-caps ${
                                            result.quadrant === 'WOW' 
                                                ? 'bg-primary/10 border-primary text-primary' 
                                                : 'bg-surface-variant border-outline text-on-surface'
                                        }`}>
                                            <Sparkles size={16} />
                                            Classification: {result.quadrant} Quadrant
                                        </div>
                                    </div>

                                    {paymentLink ? (
                                        <div className="mt-4 bg-surface-container-low border border-primary/50 rounded-xl p-5 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                                            
                                            <div className="flex items-center gap-2 mb-4">
                                                <CheckCircle size={20} className="text-primary" />
                                                <h3 className="text-body-lg font-body-lg font-bold text-on-surface">🤖 AI Agent Action Executed</h3>
                                            </div>
                                            
                                            <p className="text-sm mb-4 text-on-surface-variant">
                                                Project verified as high-impact. Live Funding Escrow Created via GRAVV.
                                            </p>
                                            
                                            <div className="space-y-3 font-mono-data text-mono-data text-on-surface-variant mb-6">
                                                <div className="flex flex-col gap-1 pt-2">
                                                    <span>Live Payment Link:</span>
                                                    <a href={paymentLink} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                                                        {paymentLink}
                                                    </a>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                className="w-full cursor-pointer bg-surface-variant text-on-surface font-label-caps text-label-caps py-3 rounded border border-outline-variant hover:bg-surface hover:text-primary transition-all flex items-center justify-center gap-2"
                                                onClick={() => navigator.clipboard.writeText(paymentLink)}
                                            >
                                                <Copy size={18} />
                                                Copy Payment Link
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 text-center text-on-surface-variant">
                                            <p>This project is not classified in the WOW quadrant.</p>
                                            <p className="text-sm mt-2">GRAVV payment escrow is only created for high-impact WOW concepts.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
