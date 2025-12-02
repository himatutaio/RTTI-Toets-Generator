import React, { useState } from 'react';
import { DistributionSlider } from './components/DistributionSlider';
import { TestRenderer } from './components/TestRenderer';
import { suggestTopics, generateRTTITest } from './services/geminiService';
import { TestConfiguration, GeneratedTest, SearchResult } from './types';
import { DEFAULT_RTTI, QUESTION_TYPE_OPTIONS } from './constants';
import { Sparkles, BookOpen, Loader2, Search, AlertCircle, FileText, Settings, Target, CheckCircle, Plus, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<'input' | 'generating' | 'result'>('input');
  
  // Form State
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [topics, setTopics] = useState('');
  const [learningGoals, setLearningGoals] = useState('');
  const [rtti, setRtti] = useState(DEFAULT_RTTI);
  const [duration, setDuration] = useState(60);
  const [qCount, setQCount] = useState(15);
  
  // Question Types State
  const [selectedQTypes, setSelectedQTypes] = useState<{type: string, percentage: number}[]>([
    { type: 'Meerkeuze', percentage: 50 },
    { type: 'Open vraag / korte antwoord', percentage: 50 }
  ]);
  const [selectedDropdownType, setSelectedDropdownType] = useState(QUESTION_TYPE_OPTIONS[0]);

  const [langLevel, setLangLevel] = useState('Normaal');
  const [extraReq, setExtraReq] = useState('');
  
  // Suggestion State
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<{topics: string, sources: SearchResult[]} | null>(null);

  // Result State
  const [generatedTest, setGeneratedTest] = useState<GeneratedTest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalRttiPercentage = rtti.R + rtti.T1 + rtti.T2 + rtti.I;
  const isRttiValid = totalRttiPercentage === 100;
  
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
    if (!isRttiValid) return;
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
      subject,
      level,
      topics,
      learningGoals,
      rttiDistribution: rtti,
      duration,
      questionCount: qCount,
      questionTypes: questionTypesString || "Gevarieerd (Open en Gesloten vragen)",
      languageLevel: langLevel,
      extraRequirements: extraReq,
    };

    try {
      const result = await generateRTTITest(config);
      setGeneratedTest(result);
      setStep('result');
    } catch (e: any) {
      setError(e.message || "Er is iets misgegaan.");
      setStep('input');
    }
  };

  if (step === 'result' && generatedTest) {
    return <TestRenderer test={generatedTest} onBack={() => setStep('input')} />;
  }

  // Filter available options for dropdown
  const availableOptions = QUESTION_TYPE_OPTIONS.filter(
    opt => !selectedQTypes.some(selected => selected.type === opt)
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {/* Navbar */}
      <nav className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Sparkles size={24} className="text-yellow-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">RTTI-Toets Generator</h1>
              <p className="text-xs text-indigo-200">AI-ondersteunde toetsconstructie</p>
            </div>
          </div>
          <div className="text-sm font-medium bg-indigo-700 px-3 py-1 rounded-full border border-indigo-500">
            Powered by Gemini
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto mt-8 px-4">
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <Loader2 size={48} className="animate-spin text-indigo-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Toets wordt gegenereerd...</h2>
            <p className="text-gray-500">Gemini analyseert leerdoelen en structureert de RTTI-matrix.</p>
          </div>
        )}

        {step === 'input' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Toets Configureren</h2>
              <p className="text-gray-600">Vul de details in om een perfect gebalanceerde RTTI-toets te genereren.</p>
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
                     <button onClick={() => setSuggestions(null)} className="text-xs text-green-600 underline mt-2">Sluiten</button>
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

              {/* Section 3: RTTI Matrix */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold border-b pb-2">
                  <Settings size={20} />
                  <h3>3. RTTI Verdeling</h3>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                      <DistributionSlider label="Reproductie (R)" value={rtti.R} color="bg-blue-500" onChange={(v) => setRtti({...rtti, R: v})} />
                      <DistributionSlider label="Training 1 (T1)" value={rtti.T1} color="bg-green-500" onChange={(v) => setRtti({...rtti, T1: v})} />
                      <DistributionSlider label="Training 2 (T2)" value={rtti.T2} color="bg-yellow-500" onChange={(v) => setRtti({...rtti, T2: v})} />
                      <DistributionSlider label="Inzicht (I)" value={rtti.I} color="bg-purple-500" onChange={(v) => setRtti({...rtti, I: v})} />
                   </div>
                   
                   <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Totale Verdeling</span>
                      <span className={`text-lg font-bold ${isRttiValid ? 'text-green-600' : 'text-red-600'}`}>
                        {totalRttiPercentage}%
                      </span>
                   </div>
                   {!isRttiValid && (
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
                  onClick={handleGenerate}
                  disabled={!isRttiValid || !subject || !topics || !isQTypeValid}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Sparkles size={20} />
                  Genereer Toets
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