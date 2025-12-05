import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { X, GraduationCap, School, User, Phone, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TrainingModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [schoolName, setSchoolName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const compositeInfo = `TRAINING AANVRAAG | School: ${schoolName} | Contact: ${contactPerson} | Tel: ${phone}`;

      // Opslaan in Supabase Database
      const { error: insertError } = await supabase
        .from('school_requests')
        .insert([
          {
            email: email,
            school_name: compositeInfo,
            status: 'pending', 
          }
        ]);

      if (insertError) throw insertError;

      setSuccess(true);
      
    } catch (err: any) {
      console.error('Training request error:', err);
      setError('Er ging iets mis bij het versturen. Probeer het later opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    if (success) {
      setSuccess(false);
      setSchoolName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2 font-bold text-xl mb-1">
                    <GraduationCap size={24} className="text-green-100" />
                    <span>Gratis KTI/RTTI Training</span>
                </div>
                <p className="text-green-50 text-sm opacity-90">
                    Ontdek hoe u meer uit toetsing haalt. Vrijblijvend.
                </p>
            </div>
            <button 
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded-full transition-colors mt-1"
            >
                <X size={24} />
            </button>
        </div>

        {/* Body */}
        <div className="p-8">
            {success ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-fadeIn">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Aanvraag Verstuurd!</h3>
                    <p className="text-gray-600 mb-6">
                        Bedankt voor uw interesse. We nemen zo snel mogelijk contact op met <strong>{contactPerson}</strong> om de mogelijkheden te bespreken.
                    </p>
                    <button 
                        onClick={handleClose}
                        className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-black transition-colors"
                    >
                        Sluiten
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Naam School</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                required
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                placeholder="Bijv. Het Stads Lyceum"
                            />
                            <School size={18} className="absolute left-3 top-3.5 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Naam Contactpersoon</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                required
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                placeholder="Uw voor- en achternaam"
                            />
                            <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">E-mailadres</label>
                            <div className="relative">
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    placeholder="naam@school.nl"
                                />
                                <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Telefoonnummer</label>
                            <div className="relative">
                                <input 
                                    type="tel" 
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    placeholder="06 12345678"
                                />
                                <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Vraag Gratis Training Aan'}
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-3">
                            Wij nemen contact op om een afspraak in te plannen.
                        </p>
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};
