import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { ProfileSetup } from './components/ProfileSetup';
import { MainApp } from './components/MainApp';
import { Quiz } from './components/Quiz';
import { auth, db, googleProvider, signInWithPopup } from './lib/firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { customAlphabet } from 'nanoid';
import { Flame, Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';

const nanoid = customAlphabet('0123456789', 8);
const MASTER_CODE = '21040721';

export type ScreenState = 'loading' | 'onboarding' | 'auth-check' | 'quiz' | 'profile-setup' | 'main';

export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  age: string;
  city: string;
  profession: string;
  jobTitle: string;
  company: string;
  education: string;
  prompts: Record<string, string>;
  temple: string;
  photo?: string;
  interests: string[];
  gender: string;
  lookingFor: string;
  voucherCode: string;
  referredByCode: string;
  quizAnswers: Record<number, number>;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('loading');
  const [user, setUser] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [referredByCode, setReferredByCode] = useState('');
  const [authMode, setAuthMode] = useState<'selection' | 'email-signup' | 'email-login'>('selection');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          setProfile(data);
          setQuizAnswers(data.quizAnswers || {});
          setCurrentScreen('main');
        } else {
          // Logged in but no profile.
          // If we have a referredByCode, they are in the onboarding flow.
          if (referredByCode) {
            setCurrentScreen('quiz');
          } else {
            // New user but no voucher code - sign them out to prevent bypass
            await signOut(auth);
            setUser(null);
            setCurrentScreen('onboarding');
          }
        }
      } else {
        setUser(null);
        setProfile(null);
        setCurrentScreen('onboarding');
      }
    });
  }, [referredByCode]);

  const handleVoucherSubmit = async (code: string) => {
    setReferredByCode(code);
    setAuthMode('selection');
    setCurrentScreen('auth-check');
  };

  const handleLoginClick = () => {
    setReferredByCode('');
    setAuthMode('selection');
    setCurrentScreen('auth-check');
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will redirect to main or quiz
    } catch (error: any) {
      console.error("Auth error:", error);
      setAuthError("Google login failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setResetSent(false);
    try {
      if (authMode === 'email-signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Email auth error:", error);
      setAuthError(error.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError("Please enter your email address first.");
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (error: any) {
      console.error("Reset error:", error);
      setAuthError(error.message || "Failed to send reset email.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProfileComplete = async (data: any) => {
    if (!user) return;
    
    const newUserVoucher = nanoid();
    const fullProfile: UserProfile = {
      ...data,
      uid: user.uid,
      email: user.email || '',
      voucherCode: newUserVoucher,
      referredByCode: referredByCode,
      quizAnswers: quizAnswers
    };

    try {
      // Save User
      await setDoc(doc(db, 'users', user.uid), fullProfile);
      // Save Voucher Mapping
      await setDoc(doc(db, 'vouchers', newUserVoucher), {
        code: newUserVoucher,
        ownerId: user.uid,
        createdAt: new Date().toISOString()
      });

      setProfile(fullProfile);
      setCurrentScreen('main');
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    }
  };

  if (currentScreen === 'loading') {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-maroon-900 rounded-full mb-4" />
          <p className="text-maroon-900 font-serif italic text-lg">Igniting Atash...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      {/* Mobile Device Frame */}
      <div className="relative w-full max-w-[400px] h-[850px] max-h-[90vh] bg-ivory rounded-[3rem] shadow-2xl overflow-hidden ring-[14px] ring-neutral-800 flex flex-col">
        {/* Notch simulation */}
        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
          <div className="w-1/3 h-5 bg-neutral-800 rounded-b-2xl"></div>
        </div>

        <div className="flex-1 overflow-y-auto relative h-full w-full bg-ivory pb-8">
          {currentScreen === 'onboarding' && (
            <Onboarding onVoucherValid={handleVoucherSubmit} onLoginClick={handleLoginClick} />
          )}

          {currentScreen === 'auth-check' && (
            <div className="min-h-full flex flex-col p-8 bg-white overflow-y-auto">
              {authMode === 'selection' ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                    <Flame className="w-10 h-10 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-maroon-900 mb-2">
                    {referredByCode ? "Join the Atash Community" : "Welcome Back"}
                  </h2>
                  <p className="text-neutral-600 mb-8 leading-relaxed font-sans text-sm">
                    {referredByCode ? "Voucher verified! Choose a method to create your secure profile." : "Please sign in to your existing account."}
                  </p>
                  
                  <div className="w-full space-y-4">
                    <button
                      onClick={handleLogin}
                      disabled={authLoading}
                      className="w-full bg-white border border-neutral-200 text-neutral-700 font-bold py-4 rounded-full flex items-center justify-center gap-3 hover:bg-neutral-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google icon" />}
                      <span>{referredByCode ? "Continue with Google" : "Sign In with Google"}</span>
                    </button>

                    <div className="relative">
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-neutral-100" />
                      <span className="relative bg-white px-4 text-[10px] text-neutral-300 font-bold uppercase tracking-widest">Or</span>
                    </div>

                    <button
                      onClick={() => setAuthMode(referredByCode ? 'email-signup' : 'email-login')}
                      className="w-full bg-maroon-900 text-white font-bold py-4 rounded-full flex items-center justify-center gap-3 hover:bg-maroon-800 transition-all shadow-lg shadow-maroon-900/10 active:scale-95"
                    >
                      <Mail className="w-5 h-5" />
                      <span>{referredByCode ? "Continue with Email" : "Sign In with Email"}</span>
                    </button>
                  </div>

                  {referredByCode ? (
                    <div className="mt-12 pt-8 border-t border-neutral-100 w-full">
                      <p className="text-xs text-neutral-400 mb-4 font-sans uppercase tracking-widest">Already have an account?</p>
                      <button
                        onClick={() => setAuthMode('email-login')}
                        className="w-full py-4 text-maroon-900 font-bold border-2 border-maroon-900/10 rounded-full hover:bg-maroon-50 transition-all active:scale-[0.98]"
                      >
                        Sign In here
                      </button>
                    </div>
                  ) : (
                    <div className="mt-12 pt-8 border-t border-neutral-100 w-full">
                      <p className="text-xs text-neutral-400 mb-4 font-sans uppercase tracking-widest">Don't have an account?</p>
                      <button
                        onClick={() => setCurrentScreen('onboarding')}
                        className="w-full py-4 text-maroon-900 font-bold border-2 border-maroon-900/10 rounded-full hover:bg-maroon-50 transition-all active:scale-[0.98]"
                      >
                        Enter Voucher Code
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => setCurrentScreen('onboarding')}
                    className="mt-8 text-neutral-400 text-sm font-medium hover:text-maroon-900 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Voucher
                  </button>
                </div>
              ) : (
                <div className="flex flex-col">
                  <button 
                    onClick={() => setAuthMode('selection')}
                    className="flex items-center gap-2 text-neutral-400 hover:text-maroon-900 mb-8 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Back</span>
                  </button>

                  <h2 className="text-2xl font-serif font-bold text-maroon-900 mb-2">
                    {authMode === 'email-signup' ? 'Create Account' : 'Welcome Back'}
                  </h2>
                  <p className="text-neutral-500 text-sm mb-8 font-sans">
                    {authMode === 'email-signup' ? 'Sign up with your email to get started.' : 'Sign in to your existing account.'}
                  </p>

                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    {authMode === 'email-signup' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest ml-4">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jamshed Tata"
                            className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-maroon-900/30 font-sans"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest ml-4">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-maroon-900/30 font-sans"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest ml-4">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-maroon-900/30 font-sans"
                        />
                      </div>
                    </div>

                    {authError && (
                      <p className="text-red-500 text-xs px-4">{authError}</p>
                    )}

                    {resetSent && (
                      <p className="text-green-600 text-xs px-4">Password reset email sent! Please check your inbox.</p>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-maroon-900 text-white font-bold py-4 rounded-full flex items-center justify-center gap-3 hover:bg-maroon-800 transition-all shadow-lg shadow-maroon-900/20 active:scale-95 disabled:opacity-50 mt-4"
                    >
                      {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'email-signup' ? 'Sign Up' : 'Sign In')}
                    </button>
                  </form>

                  {authMode === 'email-login' && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={handleForgotPassword}
                        disabled={authLoading}
                        className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest hover:text-maroon-900"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {referredByCode && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={() => setAuthMode(authMode === 'email-signup' ? 'email-login' : 'email-signup')}
                        className="text-xs text-neutral-400 font-sans uppercase tracking-[0.2em]"
                      >
                        {authMode === 'email-signup' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {currentScreen === 'quiz' && (
            <Quiz 
              onComplete={(answers) => {
                setQuizAnswers(answers);
                setCurrentScreen('profile-setup');
              }} 
              standalone={false}
            />
          )}
          {currentScreen === 'profile-setup' && (
            <ProfileSetup 
              onComplete={handleProfileComplete} 
            />
          )}
          {currentScreen === 'main' && profile && (
            <MainApp 
              currentUserAnswers={quizAnswers} 
              userProfile={profile}
              onUpdateProfile={(updated) => {
                setProfile(updated as UserProfile);
                setDoc(doc(db, 'users', user.uid), updated);
              }}
              onUpdateQuiz={(answers) => {
                setQuizAnswers(answers);
                if (profile) {
                  setDoc(doc(db, 'users', user.uid), { ...profile, quizAnswers: answers });
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
