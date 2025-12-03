
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserPlus, AlertCircle, Loader2, Mail, School } from 'lucide-react';

interface Props {
  onSwitch: () => void;
}

export const Register: React.FC<Props> = ({ onSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('Je wachtwoord moet minimaal 6 tekens lang zijn.');
      setLoading(false);
      return;
    }

    if (!schoolName.trim()) {
      setError('Vul de naam van je school in.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            school_name: schoolName, // Slaat de schoolnaam op in het gebruikersprofiel
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('Dit e-mailadres is al in gebruik.');
        } else {
          setError('Registreren is mislukt. Probeer het opnieuw.');
        }
      } else {
        if (data.user && !data.session) {
           setSuccess(true);
        } else if (data.session) {
           // Direct ingelogd
        }
      }
    } catch (err) {
      setError('Er is een onverwachte fout opgetreden.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center space-y-6 animate-fadeIn">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={40} className="text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">Check je mail!</h2>
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm leading-relaxed border border-blue-100">
            We hebben een bevestigingsmail gestuurd naar:
            <br />
            <span className="font-bold">{email}</span>
          </div>

          <p className="text-gray-600">
            Klik op de link in de e-mail om je account te activeren. Daarna kun je inloggen.
          </p>

          <button
            onClick={onSwitch}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            Terug naar inloggen
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
          <h2 className="text-3xl font-bold text-gray-900">Nieuw Account</h2>
          <p className="text-gray-500 mt-2">Maak een account om te beginnen.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-200">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Naam van je school</label>
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
            <label className="block text-sm font-bold text-gray-700 mb-2">Kies een wachtwoord</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="Minimaal 6 tekens"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Account aanmaken'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-gray-600 mb-3">Heb je al een account?</p>
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
