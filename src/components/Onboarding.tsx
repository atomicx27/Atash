import React, { useState } from 'react';
import { Flame, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const MASTER_CODE = '21040721';

interface OnboardingProps {
  onVoucherValid: (code: string) => void;
  onLoginClick: () => void;
}

export function Onboarding({ onVoucherValid, onLoginClick }: OnboardingProps) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    const code = value.trim();
    if (!code) return;

    setLoading(true);
    setError(null);

    try {
      if (code === MASTER_CODE) {
        await onVoucherValid(code);
        return;
      }

      const voucherDoc = await getDoc(doc(db, 'vouchers', code));
      if (voucherDoc.exists()) {
        await onVoucherValid(code);
      } else {
        setError('Invalid voucher code. Please check with your community reference.');
      }
    } catch (err: any) {
      console.error("Voucher check error:", err);
      if (err.message?.includes('ADMIN_REQUIRED')) {
        setError('Admin Action Required: Please enable Anonymous Auth in the Firebase Console as per the instructions provided.');
      } else {
        setError('Connection error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col p-6 pt-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col pt-8"
      >
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6 self-start">
          <Flame className="w-8 h-8 text-amber-600" strokeWidth={2.5} />
        </div>
        
        <h1 className="text-4xl text-maroon-900 mb-3 tracking-tight font-serif font-bold">Atash</h1>
        <p className="text-neutral-600 text-lg mb-10 leading-relaxed font-sans">
          A private community for Zoroastrians to connect, share, and find meaningful relationships.
        </p>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex-1">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-6 h-6 text-maroon-800" />
            <h2 className="text-xl serif font-semibold text-neutral-900">Verify Heritage</h2>
          </div>
          
          <p className="text-sm font-sans text-neutral-500 mb-6">
            To maintain our community's privacy, you must enter a voucher code from an existing member.
          </p>

          <div className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-neutral-700 mb-1">
                Community Voucher Code
              </span>
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                placeholder="Enter 8-digit code"
                className={`w-full bg-neutral-50 border ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-neutral-200 focus:border-amber-500 focus:ring-amber-500'} rounded-xl px-4 py-3 outline-none focus:ring-1 transition-all font-sans text-neutral-900 placeholder:text-neutral-400`}
              />
              {error && (
                <p className="mt-2 text-xs text-red-600 font-medium">{error}</p>
              )}
            </label>
            
            {/* Removed master code hint */}
          </div>
        </div>
      </motion.div>

      <div className="mt-8 space-y-4">
        <button
          onClick={handleContinue}
          disabled={!value.trim() || loading}
          className="w-full bg-maroon-900 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 hover:bg-maroon-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-lg shadow-maroon-900/10"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Join Community</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <button
          onClick={onLoginClick}
          className="w-full py-4 text-maroon-900 font-bold border-2 border-maroon-900/10 rounded-full hover:bg-maroon-50 transition-all active:scale-[0.98]"
        >
          Already a member? Sign In
        </button>
      </div>
    </div>
  );
}
