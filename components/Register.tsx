
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserPlus, AlertCircle, Loader2, Send, School, User, Mail } from 'lucide-react';

interface Props {
  onSwitch: () => void;
}

export const Register: React.FC<Props> = ({ onSwitch }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [motivation, setMotivation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Robust error message extractor
  const getErrorMessage = (err: any): string => {
    if (!err) return "Er is een onbekende fout opgetreden.";
    
    // 1. String
    if (typeof err === 'string') return err;
    
    // 2. Standard Error object
    if (err instanceof Error) return err.message;
    
    // 3. Supabase/Postgrest Error objects with message property
    if (err?.message) return err.message;
    
    // 4. Supabase Auth error description
    if (err?.error_description) return err.error_description;
    
    // 5. Fallback: Try to stringify, but avoid empty objects or [object Object]
    try {
      const json = JSON.stringify(err);
      if (json !== '{}' && json !== '[]') return json;
    } catch (e) {
      // ignore stringify error
    }
    
    // 6. Last resort
    return String(err);
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Check of er al een aanvraag is voor dit emailadres
      const { data: existing, error: searchError } = await supabase
        .from('school_requests')
        .select('email, status')
        .eq('email', email)
        .maybeSingle();

      if (searchError) {
        throw searchError;
      }

      if (existing) {
        setLoading(false);
        if (existing.status === 'approved') {
          setError("Dit e-mailadres is al goedgekeurd. Ga terug om in te loggen.");
        } else {
          setError("Er loopt al een aanvraag voor dit e-mailadres. Wacht op goedkeuring van de beheerder.");
        }
        return;
      }

      // 2. Voeg aanvraag toe aan de database
      // We combineren de velden in 'school_name' omdat de tabelstructuur vast ligt
      let combinedInfo = schoolName;
      if (name) combinedInfo += ` | Contact: ${name}`;
      if (motivation) combinedInfo += ` | Motivatie: ${motivation}`;

      const { error: insertError } = await supabase
        .from('school_requests')
        .insert([
          {
            email: email,
            school_name: combinedInfo,
            status: 'pending',
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);

    } catch (err: any) {
      // Log full error for debugging (using simple object/properties dump)
      console.error("Registration error:", err);

      let msg = getErrorMessage(err);

      // Vertaal veelvoorkomende Supabase errors naar Nederlands
      if (msg.includes("row-level security")) {
        msg = "Kon aanvraag niet opslaan. (Fout: Geen schrijfrechten op tabel 'school_requests'. Controleer RLS policies in Supabase.)";
      } else if (msg.includes("relation") && msg.includes("does not exist")) {
        msg = "Systeemfout: De tabel 'school_requests' bestaat niet in de database. Neem contact op met de beheerder.";
      } else if (msg.includes("duplicate key")) {
        msg = "Er bestaat al een aanvraag voor dit e-mailadres.";
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center space-y-6 animate-fadeIn">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send size={40} className="text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">Aanvraag Ontvangen!</h2>
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm leading-relaxed border border-blue-100 text-left">
            Bedankt {name}. Uw aanvraag voor toegang namens <strong>{schoolName}</strong> is succesvol opgeslagen.
          </div>

          <div className="text-gray-600 text-sm space-y-2">
            <p>Uw status staat nu op <strong>In behandeling</strong>.</p>
            <p>Zodra uw school is geverifieerd en goedgekeurd, ontvangt u verdere instructies (of kunt u inloggen).</p>
          </div>

          <button
            onClick={onSwitch}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            Terug naar inlogscherm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} className="text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Toegang Aanvragen</h2>
          <p className="text-gray-500 mt-2 text-sm">Vraag toegang aan voor uw school om de tool te gebruiken.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-200">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium break-words">{error}</span>
          </div>
        )}

        <form onSubmit={handleRequestAccess} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Uw Naam</label>
            <div className="relative">
                <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="Voor- en achternaam"
                />
                <User size={20} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Naam van uw school</label>
            <div className="relative">
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="Bijv. Het Groene College"
              />
              <School size={20} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Uw E-mailadres</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="naam@school.nl"
              />
              <Mail size={20} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Motivatie (Optioneel)</label>
            <textarea
              rows={2}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
              placeholder="Functie of reden van aanvraag..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Aanvraag Versturen'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-gray-600 mb-3">Heeft uw school al toegang?</p>
          <button
            onClick={onSwitch}
            className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
          >
            Log hier in
          </button>
        </div>
      </div>
    </div>
  );
};
