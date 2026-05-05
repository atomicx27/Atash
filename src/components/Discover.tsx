import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, MapPin, Briefcase, Compass, ChevronDown, Flame, Info, SlidersHorizontal, Loader2, Sparkles, Star } from 'lucide-react';
import { QUESTIONS } from './Quiz';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../components/AppContainer';

interface DiscoverProps {
  currentUserAnswers?: Record<number, number>;
  currentUserPhoto?: string;
  currentUserLookingFor?: string;
}

export function Discover({ currentUserAnswers = {}, currentUserPhoto, currentUserLookingFor }: DiscoverProps) {
  const [filters, setFilters] = useState({ gender: currentUserLookingFor || 'Both', minAge: 18, maxAge: 50 });
  const [showFilters, setShowFilters] = useState(false);
  const [cards, setCards] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparisonProfile, setComparisonProfile] = useState<UserProfile | null>(null);
  const [lastDirection, setLastDirection] = useState<'left' | 'right'>('left');

  useEffect(() => {
    fetchProfiles();
  }, [filters]);

  const fetchProfiles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLoading(true);
    try {
      const [likesSentSnap, blocksSentSnap, blocksRecSnap] = await Promise.all([
        supabase.from('likes').select('toId').eq('fromId', user.id),
        supabase.from('blocks').select('blockedUserId').eq('blockerId', user.id),
        supabase.from('blocks').select('blockerId').eq('blockedUserId', user.id)
      ]);

      const likedUserIds = (likesSentSnap.data || []).map(d => d.toId);
      const blockedUserIds = [
        ...(blocksSentSnap.data || []).map(d => d.blockedUserId),
        ...(blocksRecSnap.data || []).map(d => d.blockerId)
      ];

      const { data: usersData } = await supabase.from('users').select('*').limit(50);
      
      const firestoreProfiles = (usersData || [])
        .filter(p => {
          if (p.id === user.id) return false;
          if (likedUserIds.includes(p.id)) return false;
          if (blockedUserIds.includes(p.id)) return false;
          
          if (filters.gender !== 'Both') {
             const targetGender = filters.gender === 'Man' ? 'Man' : 'Woman';
             if (p.gender !== targetGender) return false;
          }
          
          const age = parseInt(p.age);
          if (age < filters.minAge || age > filters.maxAge) return false;
          
          return true;
        })
        .map(p => {
          let matchCount = 0;
          const questionsCount = Object.keys(QUESTIONS).length;
          Object.keys(p.quizAnswers || {}).forEach(k => {
             if (p.quizAnswers[parseInt(k)] === currentUserAnswers[parseInt(k)]) {
                matchCount++;
             }
          });
          const matchScore = questionsCount > 0 ? Math.round((matchCount / questionsCount) * 100) : 70;
          return { ...p, match: matchScore };
        })
        .sort((a, b) => (b.match || 0) - (a.match || 0));

      setCards(firestoreProfiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentProfile = cards[0];
    const { data: { user } } = await supabase.auth.getUser();
    if (!currentProfile || !user) return;

    setLastDirection(direction);
    
    if (direction === 'right') {
      try {
        const { error: likeError } = await supabase.from('likes').upsert({
          fromId: user.id,
          toId: currentProfile.id || currentProfile.uid
        });
        if (likeError) console.error("Error recording like in Discover:", likeError);
      } catch (error) {
        console.error("Critical error in handleSwipe:", error);
      }
    }

    setCards(prev => prev.slice(1));
  };

  return (
    <div className="relative h-full w-full bg-ivory overflow-hidden flex flex-col pt-12">
      {/* Immersive Background Decor */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-200/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-maroon-100/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <div className="relative z-20 flex justify-between items-center mb-6 px-6">
        <h2 className="text-2xl text-maroon-900 serif font-bold tracking-tight">Discover</h2>
        <button 
          onClick={() => setShowFilters(true)}
          className="p-2 rounded-full bg-white shadow-sm border border-neutral-100 text-amber-600 active:scale-95 transition-all"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex-1 px-4 z-10 perspective-1000 mb-20">
        <AnimatePresence>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-maroon-900 opacity-20" />
            </div>
          ) : cards.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-6">
                <Sparkles className="w-10 h-10 text-amber-500" />
              </div>
              <h3 className="text-xl font-serif font-bold text-maroon-900 mb-2">No more sparks today</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">Check back later or expand your preferences to meet more people.</p>
            </div>
          ) : cards.map((profile, i) => {
            const isFront = i === 0;
            if (i > 1) return null;

            return (
              <motion.div
                key={profile.id || profile.uid}
                className="absolute inset-0 w-full h-full rounded-[32px] overflow-hidden bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white flex flex-col origin-bottom"
                initial={{ scale: 0.9, y: 40, opacity: 0 }}
                animate={{ 
                  scale: isFront ? 1 : 0.95, 
                  y: isFront ? 0 : 20, 
                  opacity: 1,
                  zIndex: isFront ? 10 : 5,
                  rotate: isFront ? 0 : (i % 2 === 0 ? 1 : -1)
                }}
                exit={{ x: lastDirection === 'right' ? 600 : -600, opacity: 0, rotate: lastDirection === 'right' ? 45 : -45, transition: { duration: 0.5 } }}
                drag={isFront ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, { offset }) => {
                  if (offset.x > 100) handleSwipe('right');
                  else if (offset.x < -100) handleSwipe('left');
                }}
              >
                {/* Compatibility Badge */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setComparisonProfile(profile);
                  }}
                  className="absolute top-6 right-6 z-30 group cursor-pointer"
                >
                  <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl border border-white/40">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                      <Flame className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                    <span className="text-maroon-900 font-bold text-sm font-serif">{profile.match}%</span>
                  </div>
                </motion.button>

                {/* Top Section: Image */}
                <div className="h-[75%] w-full relative shrink-0">
                  <img 
                    src={profile.photo} 
                    alt="Profile"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  {/* Identity Overlay - Integrated into the image area */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/10 backdrop-blur-lg p-4 rounded-3xl border border-white/20 shadow-2xl">
                      <h3 className="text-2xl font-serif font-bold text-white leading-tight drop-shadow-sm">
                        {profile.name}, {profile.age}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-white/80 text-[10px] font-bold uppercase tracking-widest">
                        <MapPin className="w-3 h-3" />
                        {profile.city}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Scrollable Info */}
                <div className="flex-1 bg-white p-6 pt-6 overflow-y-auto custom-scrollbar">
                  <div className="flex gap-4 mb-6 pb-6 border-b border-neutral-50 overflow-x-auto no-scrollbar">
                    <div className="shrink-0 flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-2xl border border-neutral-100">
                      <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-tight">{profile.profession}</span>
                    </div>
                    {profile.education && (
                      <div className="shrink-0 flex items-center gap-2 bg-neutral-50 px-3 py-2 rounded-2xl border border-neutral-100">
                        <Star className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-tight truncate max-w-[120px]">{profile.education}</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-8">
                    <h4 className="text-[9px] font-sans font-bold text-neutral-400 uppercase tracking-[0.2em] mb-3">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests?.map(interest => (
                        <span key={interest} className="text-[10px] bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl font-bold border border-amber-100/50">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  {profile.prompts && Object.entries(profile.prompts).length > 0 && (
                    <div className="space-y-6 mb-8">
                       {Object.entries(profile.prompts).map(([q, a], idx) => (
                         <div key={idx} className="relative">
                           <div className="absolute -left-2 top-4 w-1 h-8 bg-amber-200 rounded-full opacity-50" />
                           <p className="text-[9px] font-sans font-bold text-neutral-400 uppercase tracking-[0.15em] mb-2 pl-2">{q}</p>
                           <p className="text-base font-serif italic text-maroon-950 leading-relaxed pl-2 bg-gradient-to-r from-amber-50/30 to-transparent p-3 rounded-r-2xl">
                             "{a}"
                           </p>
                         </div>
                       ))}
                    </div>
                  )}

                  {profile.temple && (
                    <div className="bg-maroon-900/5 rounded-3xl p-6 border border-maroon-900/10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-maroon-900">
                        <Compass className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[9px] font-sans font-bold text-maroon-900/40 uppercase tracking-widest">Parsi Heritage</p>
                        <p className="text-xs font-serif font-bold text-maroon-900">Atash Behram: {profile.temple}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="h-32" />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Floating Action Buttons */}
        {cards.length > 0 && !loading && (
          <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center items-center gap-6 pointer-events-none">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('left')}
              className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl border border-neutral-100 text-neutral-400 pointer-events-auto active:bg-neutral-50 transition-colors"
            >
              <X className="w-6 h-6" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.15, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('right')}
              className="w-18 h-18 bg-maroon-900 text-white rounded-full flex items-center justify-center shadow-2xl shadow-maroon-900/30 pointer-events-auto active:bg-maroon-800 transition-all"
            >
              <Flame className="w-8 h-8 fill-white" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      <AnimatePresence>
        {comparisonProfile && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[100] bg-ivory overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-lg font-serif font-bold text-maroon-900">Compatibility</h4>
                  <p className="text-[10px] text-neutral-400 font-sans uppercase tracking-widest">Shared Traditions</p>
                </div>
              </div>
              <button 
                onClick={() => setComparisonProfile(null)}
                className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
              <div className="flex items-center justify-center gap-6 mb-4">
                 <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-200 border-2 border-white shadow-sm flex items-center justify-center text-neutral-500 font-bold">
                      {currentUserPhoto ? <img src={currentUserPhoto} className="w-full h-full object-cover" /> : 'You'}
                    </div>
                    <span className="text-[8px] font-bold text-neutral-400 uppercase">You</span>
                 </div>
                 <div className="h-px w-12 bg-amber-100 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 rounded-full border border-amber-100 text-[8px] font-bold text-amber-600">
                      {comparisonProfile.match}%
                    </div>
                 </div>
                 <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-200 border-2 border-white shadow-sm flex items-center justify-center text-neutral-500 font-bold">
                      {comparisonProfile.photo ? <img src={comparisonProfile.photo} className="w-full h-full object-cover" /> : comparisonProfile.name[0]}
                    </div>
                    <span className="text-[8px] font-bold text-neutral-400 uppercase">{comparisonProfile.name.split(' ')[0]}</span>
                 </div>
              </div>

              {Object.keys(QUESTIONS).map((qId: any) => {
                const userAns = currentUserAnswers[qId];
                const targetAns = comparisonProfile.quizAnswers?.[qId];
                const isMatch = userAns === targetAns;
                
                return (
                  <div key={qId} className={`p-4 rounded-2xl border transition-all ${isMatch ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-neutral-100 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-xs font-serif font-bold text-maroon-900 flex-1 pr-4">{QUESTIONS[qId].question}</p>
                      {isMatch && <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${isMatch ? 'bg-amber-200 text-amber-900' : 'bg-neutral-100 text-neutral-500'}`}>
                        {QUESTIONS[qId].options[userAns as number]}
                      </div>
                      {!isMatch && (
                        <>
                          <div className="h-px w-2 bg-neutral-200" />
                          <div className="px-2 py-1 rounded-md text-[10px] font-bold bg-neutral-50 text-neutral-400">
                            {QUESTIONS[qId].options[targetAns as number]}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 bg-white border-t border-neutral-100">
              <button 
                onClick={() => {
                  handleSwipe('right');
                  setComparisonProfile(null);
                }}
                className="w-full bg-maroon-900 text-white font-bold py-4 rounded-2xl shadow-lg shadow-maroon-900/20 active:scale-95 transition-all"
              >
                Send a Spark to {comparisonProfile.name.split(' ')[0]}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Modal */}
      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-end justify-center sm:p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full sm:max-w-[400px] bg-white rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif font-bold text-maroon-900">Preferences</h3>
                <button onClick={() => setShowFilters(false)} className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-4 block">Looking For</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Man', 'Woman', 'Both'].map(g => (
                      <button
                        key={g}
                        onClick={() => setFilters({ ...filters, gender: g })}
                        className={`py-3 rounded-xl text-xs font-bold transition-all ${filters.gender === g ? 'bg-maroon-900 text-white shadow-lg' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">Age Range</label>
                    <span className="text-xs font-bold text-maroon-900">{filters.minAge} - {filters.maxAge}</span>
                  </div>
                  <div className="px-2">
                    <input 
                      type="range" 
                      min="18" 
                      max="60" 
                      value={filters.maxAge}
                      onChange={(e) => setFilters({ ...filters, maxAge: parseInt(e.target.value) })}
                      className="w-full accent-maroon-900"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full bg-maroon-900 text-white font-bold py-4 rounded-2xl shadow-lg shadow-maroon-900/20 active:scale-95 transition-all mt-4"
                >
                  Apply Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
