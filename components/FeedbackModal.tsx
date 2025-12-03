import React, { useState } from 'react';
import { X, Send, MessageSquare, Loader2, CheckCircle, AlertCircle, Mail } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'form' | 'sending' | 'success' | 'error'>('form');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  
  // CONFIGURATIE VOOR PRIVACY:
  // Optie 1 (Aanbevolen voor volledige anonimiteit): Maak een gratis account op Formspree.io
  // en plak je Form ID hieronder (bijv. "mqkrjzba").
  // Dan zien gebruikers je emailadres NOOIT.
  const FORMSPREE_ID = ""; 

  // Optie 2 (Standaard): Mailto link.
  // Je emailadres is hieronder versleuteld (Base64) zodat spambots het niet kunnen lezen in de code.
  // Gebruikers zien het wel in hun eigen mailprogramma als ze op verzenden klikken.
  // "mariam_86@live.nl"
  const ENCRYPTED_EMAIL = "bWFyaWFtXzg2QGxpdmUubmw=";

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('sending');

    // Methode 1: Formspree (Volledig anoniem voor verzender)
    if (FORMSPREE_ID) {
        try {
            const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: "Anonieme Gebruiker", // Of vraag email als input
                    message: `Feedback van: ${name || 'Onbekend'}\n\n${message}`
                })
            });
            if (response.ok) {
                setStep('success');
                setTimeout(() => {
                    onClose();
                    setStep('form');
                    setMessage('');
                }, 3000);
            } else {
                throw new Error("Verzenden mislukt");
            }
        } catch (error) {
            setStep('error');
        }
        return;
    }

    // Methode 2: Veilige Mailto (Fallback)
    // We simuleren een vertraging voor UX
    setTimeout(() => {
        try {
            // Decrypt email alleen op het moment van verzenden
            const email = atob(ENCRYPTED_EMAIL);
            const subject = encodeURIComponent(`Feedback Toets Generator van ${name || 'Gebruiker'}`);
            const body = encodeURIComponent(message);
            
            // Open mail client
            window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
            
            setStep('success');
            setTimeout(() => {
                onClose();
                setStep('form');
                setMessage('');
            }, 3000);
        } catch (err) {
            setStep('error');
        }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn scale-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2 font-bold text-lg">
                <MessageSquare size={20} />
                <span>Feedback Sturen</span>
            </div>
            <button 
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* Body */}
        <div className="p-6">
            {step === 'form' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                        Heeft u suggesties, bugs of opmerkingen? Stuur het direct naar de ontwikkelaar.
                    </p>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Uw Naam (Optioneel)</label>
                        <input 
                            type="text" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="Hoe mogen we u noemen?"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Uw Bericht</label>
                        <textarea 
                            required
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none transition-all"
                            placeholder="Typ hier uw bericht..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit"
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Send size={18} />
                            Verstuur Feedback
                        </button>
                        {!FORMSPREE_ID && (
                            <p className="text-[10px] text-center text-gray-400 mt-2">
                                Opent uw standaard e-mailprogramma
                            </p>
                        )}
                    </div>
                </form>
            )}

            {step === 'sending' && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
                    <p>Bezig met verzenden...</p>
                </div>
            )}

            {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-fadeIn">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Bedankt!</h3>
                    <p className="text-gray-600">Uw feedback wordt gewaardeerd.</p>
                </div>
            )}

            {step === 'error' && (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-fadeIn">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Oeps</h3>
                    <p className="text-gray-600 mb-4">Er ging iets mis bij het openen van de mail.</p>
                    <button 
                        onClick={() => setStep('form')}
                        className="text-indigo-600 font-medium hover:underline"
                    >
                        Probeer opnieuw
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
