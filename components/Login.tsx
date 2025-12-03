
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  onSwitch: () => void;
}

export const Login: React.FC<Props> = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: any): string => {
    if (!err) return "Er is een onbekende fout opgetreden.";
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    if (err?.message) return err.message;
    if (err?.error_description) return err.error_description;
    try {
      const json = JSON.stringify(err);
      if (json !== '{}' && json !== '[]') return json;
    } catch (e) {}
    return String(err);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Eerst inloggen bij Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Je e-mailadres of wachtwoord klopt niet.');
        } else {
          setError(getErrorMessage(authError));
        }
        setLoading(false);
        return;
      }

      // 2. Controleren of de gebruiker is goedgekeurd in de database
      const { data: requestData, error: requestError } = await supabase
        .from('school_requests')
        .select('status')
        .eq('email', email)
        .maybeSingle();

      if (requestError) {
         console.error("Login verification check failed:", requestError);
         await supabase.auth.signOut();
         
         const msg = getErrorMessage(requestError);
         if (msg.includes('relation') && msg.includes('does not exist')) {
            setError('Systeemfout: Toegangstabel ontbreekt. Neem contact op met de beheerder.');
         } else {
            setError(`Fout bij controleren rechten: ${msg}`);
         }
         
         setLoading(false);
         return;
      }

      // Als er geen record is, of de status is niet 'approved'
      if (!requestData || requestData.status !== 'approved') {
        await supabase.auth.signOut();
        
        if (requestData && requestData.status === 'pending') {
          setError('Je account is nog in behandeling. Wacht op goedkeuring van de beheerder.');
        } else {
          setError('Je account heeft geen toegang (meer) tot deze applicatie. Neem contact op met de beheerder.');
        }
        setLoading(false);
        return;
      }

      // 3. Alles OK
      
    } catch (err: any) {
      console.error("Unexpected Login error:", err);
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn size={32} className="text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welkom terug!</h2>
          <p className="text-gray-500 mt-2">Log in om je toetsen te maken.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-200">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Je e-mailadres</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="naam@school.nl"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Je wachtwoord</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Inloggen'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-gray-600 mb-3">Nog geen toegang?</p>
          <button
            onClick={onSwitch}
            className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
          >
            Vraag hier toegang aan
          </button>
        </div>
      </div>
    </div>
  );
};
