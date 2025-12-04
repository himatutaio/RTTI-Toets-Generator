import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './services/supabaseClient';
import { DistributionSlider } from './components/DistributionSlider';
import { TestRenderer } from './components/TestRenderer';
import { FeedbackModal } from './components/FeedbackModal';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { suggestTopics, generateTest } from './services/geminiService';
import { TestConfiguration, GeneratedTest, SearchResult, TaxonomyType } from './types';
import { DEFAULT_RTTI, DEFAULT_KTI, QUESTION_TYPE_OPTIONS } from './constants';
import { Sparkles, BookOpen, Loader2, Search, AlertCircle, FileText, Settings, Target, CheckCircle, Plus, Trash2, MessageSquare, LogOut, RefreshCw } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  
  // approvalError bevat foutmeldingen over permissies OF technische validatiefouten
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const [step, setStep] = useState<'input' | 'generating' | 'result'>('input');
  
  // Feedback Modal State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  // Taxonomy State
  const [taxonomy, setTaxonomy] = useState<TaxonomyType>('RTTI');

  // Form State
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [topics, setTopics] = useState('');
  const [learningGoals, setLearningGoals] = useState('');
  
  // Distribution State (Flexible for RTTI or KTI)
  const [distribution, setDistribution] = useState<any>(DEFAULT_RTTI);

  const [duration, setDuration] = useState(60);
  const [qCount, setQCount] = useState(15);
  
  // Question Types State
  const [selectedQTypes, setSelectedQTypes] = useState<{type: string, percentage: number}[]>([
    { type: 'Meerkeuze', percentage: 50 },
    { type: 'Open vraag / korte antwoord', percentage: 50 }
  ]);
  
  // Filter available options for dropdown (Hoisted for useEffect access)
  const availableOptions = QUESTION_TYPE_OPTIONS.filter(
    opt => !selectedQTypes.some(selected => selected.type === opt)
  );

  const [selectedDropdownType, setSelectedDropdownType] = useState(QUESTION_TYPE_OPTIONS[0]);

  // Sync selectedDropdownType with availableOptions
  useEffect(() => {
    // If current selected type is not available (already added), switch to first available
    if (availableOptions.length > 0 && !availableOptions.includes(selectedDropdownType)) {
      setSelectedDropdownType(availableOptions[0]);
    }
  }, [selectedQTypes, selectedDropdownType]); // availableOptions is derived from selectedQTypes

  const [langLevel, setLangLevel] = useState('Normaal');
  const [extraReq, setExtraReq] = useState('');
  
  // Suggestion State
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<{topics: string, sources: SearchResult[]} | null>(null);

  // Result State
  const [generatedTest, setGeneratedTest] = useState<GeneratedTest | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate user approval status with timeout
  const validateSession = async (currentSession: Session | null) => {
    if (!currentSession?.user?.email) {
      setAuthLoading(false);
      return;
    }

    try {
      // Create a timeout promise (30 seconden is beter voor cold starts)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Het systeem start op (dit kan tot 30 sec duren). Controleer uw verbinding of probeer het opnieuw.")), 30000)
      );

      // Perform DB check
      const dbPromise = supabase
        .from('school_requests')
        .select('status')
        .eq('email', currentSession.user.email)
        .maybeSingle()
        .then(res => res); // Ensure promise behavior

      // Race against timeout
      const { data, error } = await Promise.race([dbPromise, timeoutPromise]) as any;

      // Technical error (e.g. RLS or network issue reported by Supabase)
      if (error) {
        console.error("Session validation error:", error);
        // We loggen NIET uit, zodat de gebruiker op 'Retry' kan klikken
        setApprovalError(`Technisch probleem bij controleren: ${error.message || 'Onbekende fout'}`);
        setSession(currentSession);
        sessionRef.current = currentSession;
      } 
      // Access check
      else if (!data || data.status !== 'approved') {
        await supabase.auth.signOut();
        setSession(null);
        sessionRef.current = null;
        setApprovalError("Uw account is (nog) niet goedgekeurd door de beheerder. Wacht op bevestiging.");
      } 
      // Success
      else {
        setSession(currentSession);
        sessionRef.current = currentSession;
        setApprovalError(null);
      }
    } catch (e: any) {
      console.error("Validation failed (timeout/catch)", e);
      // Bij timeout loggen we niet uit, maar tonen we een retry scherm
      setApprovalError(e.message || "Verbindingsfout tijdens controleren.");
      setSession(currentSession);
      sessionRef.current = currentSession;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRetryValidation = () => {
    if (session) {
      setAuthLoading(true);
      setApprovalError(null);
      validateSession(session);
    } else {
      window.location.reload();
    }
  };

  // Auth Listener
  useEffect(() => {
    let isMounted = true;

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      console.log("Auth Event:", event);

      if (event === 'INITIAL_SESSION') {
         if (newSession) {
            await validateSession(newSession);
         } else {
            setAuthLoading(false);
         }
      } else if (event === 'SIGNED_IN' && newSession) {
         // Fix: Voorkom onnodige 'loading' schermen als we al ingelogd zijn als dezelfde gebruiker.
         // Dit voorkomt dat de app "flikkert" of vastloopt bij een reconnect.
         if (sessionRef.current?.user?.id === newSession.user.id) {
             setSession(newSession);
             sessionRef.current = newSession;
             return;
         }
         
         setAuthLoading(true);
         await validateSession(newSession);
      } else if (event === 'SIGNED_OUT') {
         setSession(null);
         sessionRef.current = null;
         setAuthLoading(false);
         setStep('input');
         setGeneratedTest(null);
         setApprovalError(null);
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
         setSession(newSession);
         sessionRef.current = newSession;
      }
    });

    // Check session explicitly once on mount to handle edge cases
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted && session && authLoading) {
         validateSession(session);
      } else if (isMounted && !session) {
         setAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setAuthLoading(true);
    setApprovalError(null);
    await supabase.auth.signOut();
  };

  // Switch taxonomy handler
  const handleTaxonomyChange = (type: TaxonomyType) => {
    setTaxonomy(type);
    setDistribution(type === 'RTTI' ? DEFAULT_RTTI : DEFAULT_KTI);
  };

  const totalDistPercentage = (Object.values(distribution) as number[]).reduce((a, b) => a + b, 0);
  const isDistValid = totalDistPercentage === 100;
  
  const totalQTypePercentage = selectedQTypes.reduce((sum, item) => sum + item.percentage, 0);
  const isQTypeValid = totalQTypePercentage === 100;

  const handleSuggest = async () => {
    if (!subject || !level) return;
    setIsSuggesting(true);
    setSuggestions(null);
    try {
      const result = await suggestTopics(subject, level);
      setSuggestions(result);
      if (result.topics && !topics) setTopics(result.topics); // Auto-fill if empty
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const addQType = () => {
    if (selectedQTypes.some(q => q.type === selectedDropdownType)) return;
    setSelectedQTypes([...selectedQTypes, { type: selectedDropdownType, percentage: 0 }]);
  };

  const removeQType = (typeToRemove: string) => {
    setSelectedQTypes(selectedQTypes.filter(q => q.type !== typeToRemove));
  };

  const updateQTypePercentage = (type: string, newPercentage: number) => {
    setSelectedQTypes(selectedQTypes.map(q => 
      q.type === type ? { ...q, percentage: newPercentage } : q
    ));
  };

  const handleGenerate = async () => {
    if (!isDistValid) return;
    if (!isQTypeValid) {
        setError("De verdeling van vraagtypes moet in totaal 100% zijn.");
        return;
    }
    
    setStep('generating');
    setError(null);

    // Format question types for the prompt
    const questionTypesString = selectedQTypes
      .map(q => `${q.percentage}% ${q.type}`)
      .join(', ');

    const config: TestConfiguration = {
      taxonomy,
      subject,
      level,
      topics,
      learningGoals,
      distribution: distribution,
      duration,
      questionCount: qCount,
      questionTypes: questionTypesString || "Gevarieerd (Open en Gesloten vragen)",
      languageLevel: langLevel,
      extraRequirements: extraReq,
    };

    try {
      const result = await generateTest(config);
      setGeneratedTest(result);
      setStep('result');
    } catch (e: any) {
      setError(e.message || "Er is iets misgegaan.");
      setStep('input');
    }
  };

  // 1. Loading State for Auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-6">
        <div className="flex flex-col items-center gap-4">
           <Loader2 size={48} className="animate-spin text-indigo-600" />
           <p className="text-gray-500 font-medium">Bezig met controleren...</p>
        </div>
        {/* Emergency Logout Button if stuck */}
        <button 
          onClick={handleLogout}
          className="text-xs text-red-500 hover:text-red-700 underline"
        >
          Duurt het te lang? Klik hier om uit te loggen.
        </button>
      </div>
    );
  }

  // 2. Auth Failed / Retry Screen (Session exists but validation failed)
  if (session && approvalError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center space-y-6">
           <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Validatie Mislukt</h2>
          <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm border border-red-100">
            {approvalError}
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleRetryValidation}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} /> Probeer Opnieuw
            </button>
            <button 
              onClick={handleLogout}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl border border-gray-300 flex items-center justify-center gap-2"
            >
              <LogOut size={20} /> Uitloggen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Login / Register Screens (No session)
  if (!session) {
    return (
      <>
        {approvalError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-red-100 border border-red-200 text-red-800 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fadeIn max-w-[90vw]">
            <AlertCircle size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">{approvalError}</span>
            <button onClick={() => setApprovalError(null)} className="ml-2 font-bold hover:text-red-950 px-2">✕</button>
          </div>
        )}
        {showRegister ? (
          <Register onSwitch={() => setShowRegister(false)} />
        ) : (
          <Login onSwitch={() => setShowRegister(true)} />
        )}
      </>
    );
  }

  // 4. Main App Content (Protected & Approved)
  if (step === 'result' && generatedTest) {
    return (
      <>
        <TestRenderer test={generatedTest} onBack={() => setStep('input')} />
        <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      
      {/* Navbar */}
      <nav className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Sparkles size={24} className="text-yellow-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Toets Generator</h1>
              <p className="text-xs text-indigo-200">Meer tijd voor echt onderwijs</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-sm transition-colors border border-indigo-400/30"
            >
              <MessageSquare size={16} />
              <span className="hidden sm:inline">Feedback</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-sm transition-colors border border-red-400/30"
              title="Uitloggen"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Uitloggen</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto mt-8 px-4">
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <Loader2 size={48} className="animate-spin text-indigo-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Toets wordt gegenereerd...</h2>
            <p className="text-gray-500">Gemini analyseert leerdoelen en structureert de {taxonomy} matrix.</p>
          </div>
        )}

        {step === 'input' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Toets Configureren</h2>
                  <p className="text-gray-600">Kies uw taxonomie en vul de details in.</p>
                </div>
                
                {/* Taxonomy Toggle */}
                <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
                   <button 
                     type="button"
                     onClick={() => handleTaxonomyChange('RTTI')}
                     className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${taxonomy === 'RTTI' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                   >
                     RTTI
                   </button>
                   <button 
                     type="button"
                     onClick={() => handleTaxonomyChange('KTI')}
                     className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${taxonomy === 'KTI' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                   >
                     KTI
                   </button>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              
              {/* Section 1: Context */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold border-b pb-2">
                  <BookOpen size={20} />
                  <h3>1. Context & Vak</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vak</label>
                    <input
                      type="text"
                      placeholder="bijv. Biologie, Geschiedenis"
                      className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                    <input
                      type="text"
                      placeholder="bijv. VMBO-T 3, VWO 5"
                      className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Section 2: Content (with Search Tool) */}
              <section className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                   <div className="flex items-center gap-2 text-indigo-600 font-semibold">
                    <Target size={20} />
                    <h3>2. Inhoud & Doelen</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={handleSuggest}
                    disabled={!subject || !level || isSuggesting}
                    className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    {isSuggesting ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                    {isSuggesting ? 'Zoeken...' : 'Suggesties (Google Zoeken)'}
                  </button>
                </div>

                {suggestions && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-sm animate-fadeIn">
                     <div className="flex items-start gap-2 mb-2">
                        <CheckCircle size={16} className="text-green-600 mt-0.5"/>
                        <p className="font-semibold text-green-800">Onderzoeksresultaten:</p>
                     </div>
                     <div className="text-gray-700 whitespace-pre-line mb-3">{suggestions.topics}</div>
                     {suggestions.sources.length > 0 && (
                       <div className="mt-2 pt-2 border-t border-green-200">
                         <p className="text-xs font-bold text-green-700 mb-1">Bronnen:</p>
                         <ul className="list-disc list-inside text-xs text-green-800">
                           {suggestions.sources.map((s, i) => (
                             <li key={i}><a href={s.uri} target="_blank" rel="noreferrer" className="underline hover:text-green-900 truncate">{s.title}</a></li>
                           ))}
                         </ul>
                       </div>
                     )}
                     <button type="button" onClick={() => setSuggestions(null)} className="text-xs text-green-600 underline mt-2">Sluiten</button>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Onderwerpen</label>
                  <textarea
                    placeholder="Noteer de hoofdonderwerpen (bijv. Celdeling, Genetica, Evolutie)"
                    className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 h-24"
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leerdoelen (Optioneel)</label>
                  <textarea
                    placeholder="Specifieke doelen (bijv. Leerling kan mitose uitleggen)"
                    className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 h-24"
                    value={learningGoals}
                    onChange={(e) => setLearningGoals(e.target.value)}
                  />
                </div>
              </section>

              {/* Section 3: Taxonomy Distribution */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold border-b pb-2">
                  <Settings size={20} />
                  <h3>3. {taxonomy} Verdeling</h3>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                      {taxonomy === 'RTTI' ? (
                        <>
                          <DistributionSlider label="Reproductie (R)" value={distribution.R} color="bg-blue-500" onChange={(v) => setDistribution({...distribution, R: v})} />
                          <DistributionSlider label="Training 1 (T1)" value={distribution.T1} color="bg-green-500" onChange={(v) => setDistribution({...distribution, T1: v})} />
                          <DistributionSlider label="Training 2 (T2)" value={distribution.T2} color="bg-yellow-500" onChange={(v) => setDistribution({...distribution, T2: v})} />
                          <DistributionSlider label="Inzicht (I)" value={distribution.I} color="bg-purple-500" onChange={(v) => setDistribution({...distribution, I: v})} />
                        </>
                      ) : (
                        <>
                           <DistributionSlider label="Kennis (K)" value={distribution.K} color="bg-blue-500" onChange={(v) => setDistribution({...distribution, K: v})} />
                           <DistributionSlider label="Toepassen (T)" value={distribution.T} color="bg-green-500" onChange={(v) => setDistribution({...distribution, T: v})} />
                           <DistributionSlider label="Inzicht (I)" value={distribution.I} color="bg-purple-500" onChange={(v) => setDistribution({...distribution, I: v})} />
                        </>
                      )}
                   </div>
                   
                   <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Totale Verdeling</span>
                      <span className={`text-lg font-bold ${isDistValid ? 'text-green-600' : 'text-red-600'}`}>
                        {totalDistPercentage}%
                      </span>
                   </div>
                   {!isDistValid && (
                     <p className="text-red-500 text-xs mt-1 text-right">Totaal moet 100% zijn</p>
                   )}
                </div>
              </section>

              {/* Section 4: Details & Question Types */}
              <section className="space-y-6">
                 <div className="flex items-center gap-2 text-indigo-600 font-semibold border-b pb-2">
                  <FileText size={20} />
                  <h3>4. Toetsvorm & Vraagtypes</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aantal Vragen</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-indigo-500"
                      value={qCount}
                      onChange={(e) => setQCount(Number(e.target.value))}
                    />
                   </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tijd (minuten)</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-indigo-500"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                    />
                   </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verdeling Vraagtypes</label>
                  
                  {/* Selector for new types */}
                  <div className="flex gap-2 mb-4">
                     <div className="relative flex-grow">
                        <select
                          className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                          value={selectedDropdownType}
                          onChange={(e) => setSelectedDropdownType(e.target.value)}
                        >
                          {availableOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          {availableOptions.length === 0 && <option disabled>Alle types geselecteerd</option>}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                     </div>
                     <button 
                        type="button"
                        onClick={addQType}
                        disabled={availableOptions.length === 0}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                     >
                       <Plus size={18} /> Toevoegen
                     </button>
                  </div>

                  {/* List of selected types */}
                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    {selectedQTypes.map((item, index) => (
                      <div key={item.type} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                         <span className="flex-grow font-medium text-gray-700 text-sm">{item.type}</span>
                         <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              min="0"
                              max="100"
                              className="w-16 rounded border-gray-300 border p-1 text-center focus:ring-indigo-500 focus:border-indigo-500"
                              value={item.percentage}
                              onChange={(e) => updateQTypePercentage(item.type, Number(e.target.value))}
                            />
                            <span className="text-gray-500 text-sm">%</span>
                         </div>
                         <button 
                            type="button"
                            onClick={() => removeQType(item.type)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50"
                         >
                           <Trash2 size={18} />
                         </button>
                      </div>
                    ))}
                    
                    {selectedQTypes.length === 0 && (
                      <p className="text-gray-500 text-sm text-center italic py-2">Nog geen vraagtypes geselecteerd. Voeg er een toe hierboven.</p>
                    )}

                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center mt-2">
                       <span className="text-sm font-semibold text-gray-700">Totaal Vraagtypes</span>
                       <span className={`font-bold ${isQTypeValid ? 'text-green-600' : 'text-red-600'}`}>
                         {totalQTypePercentage}%
                       </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Taalniveau</label>
                     <select 
                       className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                       value={langLevel}
                       onChange={(e) => setLangLevel(e.target.value)}
                     >
                       <option>Laag (Korte zinnen, makkelijke woorden)</option>
                       <option>Normaal</option>
                       <option>Hoog (Academisch)</option>
                     </select>
                   </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Extra Eisen</label>
                    <textarea
                      placeholder="bijv. Inclusief een afbeelding, specifieke casus..."
                      className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 h-20"
                      value={extraReq}
                      onChange={(e) => setExtraReq(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {error && (
                <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3 text-red-700 border border-red-200">
                  <AlertCircle size={20} />
                  <p>{error}</p>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!isDistValid || !subject || !topics || !isQTypeValid}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Sparkles size={20} />
                  Genereer {taxonomy}-Toets
                </button>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;