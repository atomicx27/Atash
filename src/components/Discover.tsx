import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X as XIcon, MapPin, Briefcase, Compass, ChevronDown, Flame, Info, SlidersHorizontal, Loader2 } from 'lucide-react';
import { QUESTIONS } from './Quiz';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { UserProfile } from '../App';

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
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      // First, get all likes sent by the current user to exclude them
      const likesSentQuery = query(
        collection(db, 'likes'),
        where('fromId', '==', auth.currentUser.uid)
      );
      const blocksSentQuery = query(
        collection(db, 'blocks'),
        where('blockerId', '==', auth.currentUser.uid)
      );
      const blocksReceivedQuery = query(
        collection(db, 'blocks'),
        where('blockedUserId', '==', auth.currentUser.uid)
      );

      const [likesSnapshot, blocksSentSnap, blocksRecSnap] = await Promise.all([
        getDocs(likesSentQuery),
        getDocs(blocksSentQuery),
        getDocs(blocksReceivedQuery)
      ]);

      const likedUserIds = likesSnapshot.docs.map(doc => doc.data().toId);
      const blockedUserIds = [
        ...blocksSentSnap.docs.map(doc => doc.data().blockedUserId),
        ...blocksRecSnap.docs.map(doc => doc.data().blockerId)
      ];

      // Now query users
      const usersQuery = query(collection(db, 'users'), limit(50));
      const usersSnapshot = await getDocs(usersQuery);
      
      const firestoreProfiles = usersSnapshot.docs
        .map(doc => doc.data() as UserProfile)
        .filter(p => {
          if (p.uid === auth.currentUser?.uid) return false;
          if (likedUserIds.includes(p.uid)) return false;
          if (blockedUserIds.includes(p.uid)) return false;
          
          if (filters.gender !== 'Both') {
             const targetGender = filters.gender === 'Man' ? 'Man' : 'Woman';
             if (p.gender !== targetGender) return false;
          }
          
          const age = parseInt(p.age);
          if (age < filters.minAge || age > filters.maxAge) return false;
          
          return true;
        })
        .map(p => {
          // Calculate compatibility simple way
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
    if (!currentProfile || !auth.currentUser) return;

    setLastDirection(direction);
    
    if (direction === 'right') {
      try {
        const likeId = `${auth.currentUser.uid}_${currentProfile.uid}`;
        await setDoc(doc(db, 'likes', likeId), {
          fromId: auth.currentUser.uid,
          toId: currentProfile.uid,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error recording like:", error);
      }
    }

    setCards(prev => prev.slice(1));
  };

  return (
    <div className="h-full w-full flex flex-col relative px-4 pt-12 pb-6">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-2xl text-maroon-900 serif font-bold tracking-tight">Discover</h2>
        <button 
          onClick={() => setShowFilters(true)}
          className="p-2 rounded-full bg-white shadow-sm border border-neutral-100 text-amber-600 active:scale-95 transition-all"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 relative w-full perspective-1000">
        <AnimatePresence>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-maroon-900 opacity-20" />
            </div>
          ) : cards.map((profile, i) => {
            const isFront = i === 0;
            if (i > 1) return null; // Only show top two cards

            return (
              <motion.div
                key={profile.uid}
                className="absolute inset-0 w-full h-[calc(100%-80px)] rounded-[32px] overflow-hidden bg-white shadow-xl border border-neutral-100 origin-bottom"
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ 
                  scale: isFront ? 1 : 0.95, 
                  y: isFront ? 0 : 20, 
                  opacity: 1,
                  zIndex: isFront ? 10 : 0
                }}
                exit={{ x: lastDirection === 'right' ? 500 : -500, opacity: 0, rotate: lastDirection === 'right' ? 30 : -30 }}
                drag={isFront ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, { offset }) => {
                  if (offset.x > 100) handleSwipe('right');
                  else if (offset.x < -100) handleSwipe('left');
                }}
              >
                {/* Image background - blurred */}
                <div className="absolute inset-0 w-full h-full">
                  <img 
                    src={profile.photo} 
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                {/* Enhanced Match Score Badge - Top Right */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setComparisonProfile(profile)}
                  className="absolute top-6 right-6 z-20 group cursor-pointer"
                >
                  <div className="bg-white/95 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 transition-all group-hover:border-amber-200">
                    <div className="relative">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-amber-400/20 blur-md rounded-full"
                      />
                      <Flame className="w-5 h-5 text-amber-600 fill-amber-600 relative z-10" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-maroon-900 font-bold text-base font-serif">
                        {profile.match}%
                      </span>
                      <span className="text-[9px] text-amber-700 font-sans font-bold uppercase tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        Compatibility <Info className="w-2 h-2" />
                      </span>
                    </div>
                  </div>
                </motion.button>

                <div className="absolute inset-0 p-6 flex flex-col justify-end text-white pb-32 pointer-events-none">
                  <h3 className="text-3xl font-serif font-bold tracking-wide mb-1">
                    {profile.name}, {profile.age}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm opacity-90 mt-2 font-sans font-medium">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.city}
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {profile.profession}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 mb-4">
                    {profile.interests?.map(interest => (
                      <span key={interest} className="text-[10px] bg-white/10 backdrop-blur-md px-2 py-1 rounded-full font-medium border border-white/20">
                        {interest}
                      </span>
                    ))}
                  </div>

                  {/* Profile Prompts */}
                  {profile.prompts && Object.entries(profile.prompts).length > 0 && (
                    <div className="space-y-4 mt-2">
                       {Object.entries(profile.prompts).slice(0, 2).map(([q, a], idx) => (
                         <div key={idx} className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 shadow-lg">
                           <p className="text-[8px] font-sans font-bold text-amber-400 uppercase tracking-widest mb-1">{q}</p>
                           <p className="text-sm font-serif italic leading-snug">"{a}"</p>
                         </div>
                       ))}
                    </div>
                  )}
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>
        
        <AnimatePresence>
          {comparisonProfile && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-0 z-50 bg-ivory rounded-[32px] overflow-hidden flex flex-col"
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
                        {currentUserPhoto ? (
                          <img src={currentUserPhoto} alt="You" className="w-full h-full object-cover" />
                        ) : (
                          'You'
                        )}
                      </div>
                      <span className="text-[10px] font-sans font-medium text-neutral-400">Your Answer</span>
                   </div>
                   <div className="h-px w-8 bg-neutral-100" />
                   <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full bg-maroon-900 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold">
                        {comparisonProfile.name[0]}
                      </div>
                      <span className="text-[10px] font-sans font-medium text-neutral-400">Their Answer</span>
                   </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100">
                  <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-4">Common Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {comparisonProfile.interests?.map((interest: string) => (
                      <span key={interest} className="px-3 py-1.5 bg-neutral-50 text-maroon-900 rounded-full text-[10px] font-bold border border-neutral-100 uppercase tracking-tight">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {QUESTIONS.map((q, idx) => {
                  const yourAnswerIdx = currentUserAnswers[idx];
                  const theirAnswerIdx = comparisonProfile.quizAnswers[idx];
                  const isSame = yourAnswerIdx === theirAnswerIdx;

                  return (
                    <div key={idx} className="space-y-3">
                      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isYou = yourAnswerIdx === optIdx;
                          const isThem = theirAnswerIdx === optIdx;
                          
                          if (!isYou && !isThem) return null; // Only show their answers if different, or just one if same

                          return (
                            <div 
                              key={optIdx} 
                              className={`p-4 rounded-2xl border transition-all flex items-center gap-3 ${
                                isSame 
                                  ? 'bg-amber-50 border-amber-200 text-amber-900' 
                                  : isYou 
                                    ? 'bg-white border-neutral-100 text-neutral-600'
                                    : 'bg-maroon-50 border-maroon-100 text-maroon-900'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isSame 
                                ? 'bg-amber-500 text-white' 
                                : isYou ? 'bg-neutral-200 text-neutral-600' : 'bg-maroon-900 text-white'
                              }`}>
                                {isSame ? 'MATCH' : isYou ? 'YOU' : comparisonProfile.name[0]}
                              </div>
                              <span className="text-sm font-medium">{opt}</span>
                            </div>
                          );
                        })}
                        {/* If different, we need to show both. The logic above hides non-selected ones. 
                            Wait, the logic above works because it iterates through options and only renders the ones selected by either person. */}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {cards.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
            <Compass className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-serif text-lg">No more profiles nearby.</p>
          </div>
        )}

      </div>

      {cards.length > 0 && !comparisonProfile && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 z-20">
          <button 
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border border-neutral-100 text-neutral-400 hover:text-black hover:scale-105 transition-all active:scale-95"
          >
            <XIcon className="w-8 h-8" strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => handleSwipe('right')}
            className="w-16 h-16 bg-gradient-to-tr from-maroon-900 to-amber-600 rounded-full flex items-center justify-center shadow-lg text-white hover:scale-105 transition-all active:scale-95"
          >
            <Heart className="w-8 h-8" strokeWidth={2.5} />
          </button>
        </div>
      )}
      {/* Filter Modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl serif font-bold text-maroon-900">Filters</h3>
                 <button onClick={() => setShowFilters(false)} className="text-neutral-400 hover:text-black">
                   <XIcon className="w-6 h-6" />
                 </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Looking For</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Man', 'Woman', 'Both'].map(g => (
                      <button
                        key={g}
                        onClick={() => setFilters({ ...filters, gender: g })}
                        className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                          filters.gender === g ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-neutral-50 text-neutral-500'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Age Range</label>
                    <span className="text-sm font-bold text-maroon-900">{filters.minAge} - {filters.maxAge}</span>
                   </div>
                   <input 
                    type="range" 
                    min="18" 
                    max="60" 
                    value={filters.maxAge}
                    onChange={(e) => setFilters({...filters, maxAge: parseInt(e.target.value)})}
                    className="w-full accent-amber-600" 
                   />
                </div>

                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full py-4 bg-maroon-900 text-white rounded-2xl font-bold shadow-lg shadow-maroon-900/20 active:scale-95 transition-all mt-4"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
