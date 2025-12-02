import React, { useState, useEffect, useRef } from 'react';
import { GeneratedTest, Question } from '../types';
import { Printer, CheckCircle, Brain, BookOpen, BarChart2, Layers, FileText, Share2, Copy, Check, ChevronDown } from 'lucide-react';

interface Props {
  test: GeneratedTest;
  onBack: () => void;
}

export const TestRenderer: React.FC<Props> = ({ test, onBack }) => {
  const [viewMode, setViewMode] = useState<'tabs' | 'full'>('tabs');
  const [activeTab, setActiveTab] = useState<'test' | 'answers' | 'matrix' | 'analysis'>('test');
  
  // Share Menu State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrint = () => {
    setIsShareOpen(false);
    // Switch to full view automatically for PDF generation/Printing
    setViewMode('full');
    // Small timeout to allow React to render the full view before printing
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const formatContentAsText = (scope: 'full' | 'current') => {
    let text = "";
    const line = "--------------------------------------------------\n";

    const addSectionHeader = (title: string) => {
      text += `\n${line}${title.toUpperCase()}\n${line}\n`;
    };

    const formatQuestions = () => {
      addSectionHeader(`DEEL 1: TOETS - ${test.title}`);
      text += `${test.introduction}\n\n`;
      test.questions.forEach((q, i) => {
        text += `${i + 1}. [${q.rtti}] ${q.text} (${q.points} pt)\n`;
        if (q.type === 'Multiple Choice' && q.options) {
          q.options.forEach((opt) => text += `   - ${opt}\n`);
        }
        text += "\n";
      });
    };

    const formatAnswers = () => {
      addSectionHeader("DEEL 2: ANTWOORDMODEL");
      test.answers.forEach((a, i) => {
        const q = test.questions.find(qu => qu.id === a.questionId);
        text += `${i + 1}. Antwoord: ${a.answer}\n`;
        if (a.criteria) text += `   Criteria: ${a.criteria}\n`;
        text += `   RTTI: ${q?.rtti || '-'} | Toelichting: ${a.explanation}\n\n`;
      });
    };

    const formatMatrix = () => {
      addSectionHeader("DEEL 3: MATRIJS & DOELEN");
      text += "Onderwerp | R | T1 | T2 | I | Totaal\n";
      test.matrix.forEach(row => {
        text += `${row.topic} | ${row.r} | ${row.t1} | ${row.t2} | ${row.i} | ${row.r + row.t1 + row.t2 + row.i}\n`;
      });
      text += "\nLeerdoelen:\n";
      test.goalMapping.forEach(map => {
        text += `- ${map.goal}: Vragen ${map.questionIds.map(id => {
           const idx = test.questions.findIndex(q => q.id === id);
           return idx !== -1 ? idx + 1 : '?';
        }).join(', ')}\n`;
      });
    };

    const formatAnalysis = () => {
      addSectionHeader("DEEL 4: ANALYSE INSTRUCTIES");
      text += `${test.analysisInstructions}\n`;
    };

    if (scope === 'full') {
      text += `${test.title.toUpperCase()}\n\n`;
      formatQuestions();
      formatAnswers();
      formatMatrix();
      formatAnalysis();
    } else {
      if (activeTab === 'test') formatQuestions();
      if (activeTab === 'answers') formatAnswers();
      if (activeTab === 'matrix') formatMatrix();
      if (activeTab === 'analysis') formatAnalysis();
    }

    return text;
  };

  const handleCopy = (scope: 'full' | 'current') => {
    const text = formatContentAsText(scope);
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus('copied');
      setIsShareOpen(false);
      setTimeout(() => setCopyStatus('idle'), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const renderBadge = (rtti: string) => {
    const colors: Record<string, string> = {
      'R': 'bg-blue-100 text-blue-800 border-blue-200',
      'T1': 'bg-green-100 text-green-800 border-green-200',
      'T2': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'I': 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[rtti] || 'bg-gray-100 text-gray-800'}`}>
        {rtti}
      </span>
    );
  };

  const shouldRender = (tabName: string) => viewMode === 'full' || activeTab === tabName;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:max-w-none">
      {/* Header Actions - Hidden when printing */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 no-print gap-4">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
          ← Instellingen wijzigen
        </button>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
          {/* View Toggle */}
          <div className="bg-gray-200 p-1 rounded-lg flex text-sm font-medium w-full sm:w-auto">
            <button 
              onClick={() => setViewMode('tabs')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'tabs' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <Layers size={16} /> <span className="sm:inline">Tabbladen</span>
            </button>
            <button 
              onClick={() => setViewMode('full')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'full' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <FileText size={16} /> <span className="sm:inline">Volledig</span>
            </button>
          </div>

          <div className="h-8 w-px bg-gray-300 hidden sm:block mx-1"></div>

          {/* Share / Action Menu */}
          <div className="relative w-full sm:w-auto" ref={shareMenuRef}>
            <button 
              onClick={() => setIsShareOpen(!isShareOpen)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors text-sm font-semibold"
            >
              {copyStatus === 'copied' ? <Check size={18} /> : <Share2 size={18} />}
              <span>{copyStatus === 'copied' ? 'Gekopieerd!' : 'Delen'}</span>
              <ChevronDown size={16} className={`transition-transform ${isShareOpen ? 'rotate-180' : ''}`} />
            </button>

            {isShareOpen && (
              <div className="absolute right-0 mt-2 w-full sm:w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-20 overflow-hidden animate-fadeIn">
                <div className="py-1">
                  <button 
                    onClick={() => handleCopy('current')}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <div className="bg-blue-50 p-1.5 rounded text-blue-600"><Copy size={16} /></div>
                    <div>
                      <span className="font-medium block">Kopieer Huidig Tabblad</span>
                      <span className="text-xs text-gray-500">Alleen de zichtbare tekst</span>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => handleCopy('full')}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-50"
                  >
                     <div className="bg-indigo-50 p-1.5 rounded text-indigo-600"><FileText size={16} /></div>
                     <div>
                      <span className="font-medium block">Kopieer Volledig Dossier</span>
                      <span className="text-xs text-gray-500">Toets, antwoorden & matrix</span>
                    </div>
                  </button>

                  <button 
                    onClick={handlePrint}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-50"
                  >
                     <div className="bg-gray-100 p-1.5 rounded text-gray-600"><Printer size={16} /></div>
                     <div>
                      <span className="font-medium block">Afdrukken / PDF Opslaan</span>
                      <span className="text-xs text-gray-500">Via browser print menu</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`bg-white rounded-xl shadow-xl print:shadow-none print:border-none ${viewMode === 'tabs' ? 'overflow-hidden' : ''}`}>
        {/* Tabs Navigation - Only visible in Tabs mode and NOT printing */}
        {viewMode === 'tabs' && (
          <div className="border-b border-gray-200 bg-gray-50 no-print overflow-x-auto">
            <nav className="flex -mb-px" aria-label="Tabs">
              {[
                { id: 'test', name: 'Toets (Student)', icon: BookOpen },
                { id: 'answers', name: 'Antwoordmodel', icon: CheckCircle },
                { id: 'matrix', name: 'Matrix & Doelen', icon: BarChart2 },
                { id: 'analysis', name: 'Analyse', icon: Brain },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex-1 py-4 px-4 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap transition-colors
                    ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  <tab.icon size={18} />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Content Area */}
        <div className="p-8 print:p-0">
          
          {/* Main Title - Always visible at top of doc */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{test.title}</h1>
                <p className="text-gray-600 italic max-w-2xl">{test.introduction}</p>
              </div>
              <div className="text-right hidden sm:block print:block">
                 <div className="text-sm text-gray-500">Gegenereerd met RTTI-Generator</div>
                 <div className="text-xs text-gray-400">{new Date().toLocaleDateString('nl-NL')}</div>
              </div>
            </div>
          </div>

          {/* Student Test View */}
          {shouldRender('test') && (
            <div className={`space-y-8 animate-fadeIn ${viewMode === 'full' ? 'mb-12 page-break' : ''}`}>
              {viewMode === 'full' && (
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2">
                  <BookOpen className="text-indigo-600"/> Deel 1: De Toets
                </h2>
              )}

              <div className="no-print mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 flex items-start gap-3">
                <div className="mt-0.5"><BookOpen size={16}/></div>
                 <div>
                  <strong>Docent weergave:</strong> U ziet hier de vragen inclusief RTTI labels. Op de print-versie voor studenten worden deze labels en de antwoorden verborgen, maar de layout blijft behouden.
                </div>
              </div>
              
              <div className="space-y-6">
                {test.questions.map((q, idx) => (
                  <div key={q.id} className="p-5 bg-gray-50 rounded-xl border border-gray-200 print:bg-white print:border-none print:p-0 print:mb-8 break-inside-avoid">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm print:bg-black print:text-white print:border print:border-black">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide print:hidden">
                          {renderBadge(q.rtti)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200 print:border-none">
                        {q.points} pt
                      </span>
                    </div>
                    
                    <div className="ml-0 sm:ml-11 print:ml-11">
                      <p className="text-gray-900 text-lg mb-4 whitespace-pre-wrap leading-relaxed font-medium">{q.text}</p>
                      
                      {q.type === 'Multiple Choice' && q.options && (
                        <div className="space-y-3">
                          {q.options.map((opt, i) => (
                            <div key={i} className="flex items-start gap-3 group">
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5 group-hover:border-indigo-400 print:border-black"></div>
                              <span className="text-gray-800">{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {(q.type === 'Open' || q.type === 'Other') && (
                        <div className="mt-6 p-4 border-2 border-gray-200 border-dashed rounded-lg bg-white h-32 print:block hidden">
                           {/* Ruimte voor antwoord op papier */}
                        </div>
                      )}
                       {(q.type === 'Open' || q.type === 'Other') && (
                        <div className="mt-2 text-xs text-gray-400 italic print:hidden">
                           (Ruimte voor antwoord wordt zichtbaar bij printen)
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answer Key View */}
          {shouldRender('answers') && (
            <div className={`space-y-6 animate-fadeIn ${viewMode === 'full' ? 'mb-12 page-break' : ''}`}>
               {viewMode === 'full' && (
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2">
                  <CheckCircle className="text-indigo-600"/> Deel 2: Antwoordmodel
                </h2>
              )}

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-16">Nr.</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Antwoord & Criteria</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-24">RTTI</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-1/3">Toelichting</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {test.answers.map((ans, idx) => {
                      const question = test.questions.find(q => q.id === ans.questionId);
                      return (
                        <tr key={ans.questionId} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} break-inside-avoid`}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 align-top">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700 align-top">
                            <div className="font-semibold text-gray-900 mb-2">{ans.answer}</div>
                            {ans.criteria && (
                              <div className="bg-yellow-50 text-yellow-800 p-2 rounded text-xs border border-yellow-100">
                                <strong>Criteria:</strong> {ans.criteria}
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 align-top">
                             {question ? renderBadge(question.rtti) : '-'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 italic align-top">
                            {ans.explanation}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Matrix & Goals View */}
          {shouldRender('matrix') && (
            <div className={`space-y-8 animate-fadeIn ${viewMode === 'full' ? 'mb-12 page-break' : ''}`}>
               {viewMode === 'full' && (
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2">
                  <BarChart2 className="text-indigo-600"/> Deel 3: Matrijs & Doelen
                </h2>
              )}

               <section className="break-inside-avoid">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  Toetsmatrijs (Aantal vragen)
                </h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg mb-8">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-indigo-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Onderwerp</th>
                        <th className="px-3 py-3.5 text-center text-sm font-semibold text-blue-800">R</th>
                        <th className="px-3 py-3.5 text-center text-sm font-semibold text-green-800">T1</th>
                        <th className="px-3 py-3.5 text-center text-sm font-semibold text-yellow-800">T2</th>
                        <th className="px-3 py-3.5 text-center text-sm font-semibold text-purple-800">I</th>
                        <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Totaal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {test.matrix.map((row, idx) => (
                        <tr key={idx}>
                          <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{row.topic}</td>
                          <td className="px-3 py-4 text-sm text-center text-gray-500 bg-blue-50/30">{row.r}</td>
                          <td className="px-3 py-4 text-sm text-center text-gray-500 bg-green-50/30">{row.t1}</td>
                          <td className="px-3 py-4 text-sm text-center text-gray-500 bg-yellow-50/30">{row.t2}</td>
                          <td className="px-3 py-4 text-sm text-center text-gray-500 bg-purple-50/30">{row.i}</td>
                          <td className="px-3 py-4 text-sm text-center font-bold text-gray-900 bg-gray-50">
                            {row.r + row.t1 + row.t2 + row.i}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="break-inside-avoid">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                   Dekking Leerdoelen
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {test.goalMapping.map((map, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm break-inside-avoid">
                      <h4 className="font-medium text-gray-900 mb-2">{map.goal}</h4>
                      <div className="flex flex-wrap gap-2">
                        {map.questionIds.map(qid => (
                          <span key={qid} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-mono border border-indigo-100">
                            Vraag {test.questions.findIndex(q => q.id === qid) + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

           {/* Analysis View */}
           {shouldRender('analysis') && (
            <div className={`animate-fadeIn prose max-w-none text-gray-800 ${viewMode === 'full' ? 'mb-12 page-break' : ''}`}>
               {viewMode === 'full' && (
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2">
                  <Brain className="text-indigo-600"/> Deel 4: Analyse
                </h2>
              )}

               <h3 className="text-xl font-bold text-gray-900 mb-4">Docent Instructies & Interpretatie</h3>
               <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl mb-8">
                 <div className="whitespace-pre-wrap">{test.analysisInstructions}</div>
               </div>
               
               <div className="mt-8 break-inside-avoid">
                  <h4 className="font-semibold mb-4 text-lg">Sjabloon voor cijferanalyse</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300 bg-white text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-3 text-left">Naam Student</th>
                          <th className="border border-gray-300 p-3 w-20 text-center bg-blue-50">R %</th>
                          <th className="border border-gray-300 p-3 w-20 text-center bg-green-50">T1 %</th>
                          <th className="border border-gray-300 p-3 w-20 text-center bg-yellow-50">T2 %</th>
                          <th className="border border-gray-300 p-3 w-20 text-center bg-purple-50">I %</th>
                          <th className="border border-gray-300 p-3 w-24 text-center font-bold">Cijfer</th>
                          <th className="border border-gray-300 p-3 w-1/3">Opmerkingen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                          <tr key={row}>
                            <td className="border border-gray-300 p-2 h-12"></td>
                            <td className="border border-gray-300 p-2 bg-blue-50/20"></td>
                            <td className="border border-gray-300 p-2 bg-green-50/20"></td>
                            <td className="border border-gray-300 p-2 bg-yellow-50/20"></td>
                            <td className="border border-gray-300 p-2 bg-purple-50/20"></td>
                            <td className="border border-gray-300 p-2 bg-gray-50"></td>
                            <td className="border border-gray-300 p-2"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};