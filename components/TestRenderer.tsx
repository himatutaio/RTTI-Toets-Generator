import React, { useRef } from 'react';
import { GeneratedTest, Question } from '../types';
import { Printer, Download, CheckCircle, Brain, BookOpen, BarChart2 } from 'lucide-react';

interface Props {
  test: GeneratedTest;
  onBack: () => void;
}

export const TestRenderer: React.FC<Props> = ({ test, onBack }) => {
  const [activeTab, setActiveTab] = React.useState<'test' | 'answers' | 'matrix' | 'analysis'>('test');
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const renderBadge = (rtti: string) => {
    const colors: Record<string, string> = {
      'R': 'bg-blue-100 text-blue-800',
      'T1': 'bg-green-100 text-green-800',
      'T2': 'bg-yellow-100 text-yellow-800',
      'I': 'bg-purple-100 text-purple-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[rtti] || 'bg-gray-100 text-gray-800'}`}>
        {rtti}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 no-print gap-4">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">
          ← Instellingen wijzigen
        </button>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Printer size={16} /> Afdrukken / PDF
          </button>
          {/* Export functionality could be added here */}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xl overflow-hidden print:shadow-none">
        {/* Tabs */}
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
                  w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap
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

        {/* Content Area */}
        <div className="p-8 print:p-0" ref={printRef}>
          {/* Title Header - Always visible on print */}
          <div className="mb-8 pb-6 border-b border-gray-200 print-only">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{test.title}</h1>
            <p className="text-gray-600 italic">{test.introduction}</p>
          </div>

          {/* Student Test View */}
          {(activeTab === 'test') && (
            <div className="space-y-8 animate-fadeIn">
              <div className="no-print mb-6 p-4 bg-blue-50 text-blue-800 rounded-md text-sm">
                <strong>Docent weergave:</strong> In deze weergave ziet u de vragen zoals ze op het toetsblad komen. De RTTI labels zijn zichtbaar voor uw referentie (normaal verborgen voor studenten).
              </div>
              
              {test.questions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 print:bg-white print:border-none print:p-0 print:mb-6 break-inside-avoid">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm print:bg-black print:text-white">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide print:hidden">
                        {renderBadge(q.rtti)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">({q.points} pt)</span>
                  </div>
                  
                  <div className="ml-11">
                    <p className="text-gray-900 text-lg mb-4 whitespace-pre-wrap">{q.text}</p>
                    
                    {q.type === 'Multiple Choice' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((opt, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full border border-gray-400 flex-shrink-0 mt-0.5"></div>
                            <span className="text-gray-800">{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {q.type === 'Open' && (
                      <div className="mt-4 h-32 border-b border-gray-300 border-dashed print:block hidden"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Answer Key View */}
          {(activeTab === 'answers') && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 print:block hidden">Antwoordmodel</h2>
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
                        <tr key={ans.questionId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-700">
                            <div className="font-semibold text-gray-900 mb-1">{ans.answer}</div>
                            {ans.criteria && (
                              <div className="text-gray-500 italic mt-1 text-xs border-l-2 border-gray-300 pl-2">
                                Criteria: {ans.criteria}
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                             {question ? renderBadge(question.rtti) : '-'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 italic">
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
          {(activeTab === 'matrix') && (
            <div className="space-y-8 animate-fadeIn">
               <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart2 className="text-indigo-600"/> Toetsmatrijs (Aantal vragen)
                </h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
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
                          <td className="px-3 py-4 text-sm text-center text-gray-500">{row.r}</td>
                          <td className="px-3 py-4 text-sm text-center text-gray-500">{row.t1}</td>
                          <td className="px-3 py-4 text-sm text-center text-gray-500">{row.t2}</td>
                          <td className="px-3 py-4 text-sm text-center text-gray-500">{row.i}</td>
                          <td className="px-3 py-4 text-sm text-center font-bold text-gray-900">
                            {row.r + row.t1 + row.t2 + row.i}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                   <Brain className="text-indigo-600"/> Dekking Leerdoelen
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {test.goalMapping.map((map, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <h4 className="font-medium text-gray-900 mb-2">{map.goal}</h4>
                      <div className="flex flex-wrap gap-2">
                        {map.questionIds.map(qid => (
                          <span key={qid} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-mono">
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
           {(activeTab === 'analysis') && (
            <div className="animate-fadeIn prose max-w-none text-gray-800">
               <h3 className="text-xl font-bold text-gray-900 mb-4">Toetsanalyse Instructies</h3>
               <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                 <div className="whitespace-pre-wrap">{test.analysisInstructions}</div>
               </div>
               
               <div className="mt-8">
                  <h4 className="font-semibold mb-4">Sjabloon voor cijferanalyse</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300 bg-white text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-left">Naam Student</th>
                          <th className="border border-gray-300 p-2 w-20 text-center">R Score %</th>
                          <th className="border border-gray-300 p-2 w-20 text-center">T1 Score %</th>
                          <th className="border border-gray-300 p-2 w-20 text-center">T2 Score %</th>
                          <th className="border border-gray-300 p-2 w-20 text-center">I Score %</th>
                          <th className="border border-gray-300 p-2 w-24 text-center font-bold">Cijfer</th>
                          <th className="border border-gray-300 p-2 w-1/3">Opmerkingen / Actiepunten</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4, 5].map((row) => (
                          <tr key={row}>
                            <td className="border border-gray-300 p-2 h-10"></td>
                            <td className="border border-gray-300 p-2"></td>
                            <td className="border border-gray-300 p-2"></td>
                            <td className="border border-gray-300 p-2"></td>
                            <td className="border border-gray-300 p-2"></td>
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