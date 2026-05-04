import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessagesSquare, MapPin, User, ChevronRight, Star, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../components/AppContainer';

interface LikedProfile extends UserProfile {
  likeId: string;
}

export function Likes() {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [receivedLikes, setReceivedLikes] = useState<LikedProfile[]>([]);
  const [sentLikes, setSentLikes] = useState<LikedProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchLikes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const [receivedSnap, sentSnap] = await Promise.all([
          supabase.from('likes').select('fromId').eq('toId', user.id),
          supabase.from('likes').select('toId').eq('fromId', user.id)
        ]);

        if (receivedSnap.error) console.error("Received likes error:", receivedSnap.error);
        if (sentSnap.error) console.error("Sent likes error:", sentSnap.error);

        const receivedLikesData = receivedSnap.data || [];
        const sentLikesData = sentSnap.data || [];

        const receivedIds = receivedLikesData.map((l: any) => l.fromId);
        const sentIds = sentLikesData.map((l: any) => l.toId);

        const allIds = Array.from(new Set([...receivedIds, ...sentIds]));
        
        if (allIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase.from('users').select('*').in('id', allIds);
          if (usersError) console.error("Users fetch error in Likes:", usersError);
          
          const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]));

          const received = receivedLikesData.map((like: any) => {
            const u = usersMap.get(like.fromId);
            return u ? { ...u, likeId: `${like.fromId}-${user.id}` } : null;
          }).filter(Boolean);

          const sent = sentLikesData.map((like: any) => {
            const u = usersMap.get(like.toId);
            return u ? { ...u, likeId: `${user.id}-${like.toId}` } : null;
          }).filter(Boolean);

          if (active) {
            setReceivedLikes(received as LikedProfile[]);
            setSentLikes(sent as LikedProfile[]);
          }
        } else if (active) {
          setReceivedLikes([]);
          setSentLikes([]);
        }
      } catch (error) {
        console.error("Error fetching likes:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchLikes();

    const channel = supabase.channel('likes_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
         fetchLikes();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLikeBack = async (targetUserId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      await supabase.from('likes').upsert({
        fromId: user.id,
        toId: targetUserId
      });
    } catch (error) {
      console.error("Error matching back:", error);
    }
  };

  const matches = sentLikes.filter(sent => 
    receivedLikes.some(received => (received.id || received.uid) === (sent.id || sent.uid))
  );

  return (
    <div className="relative h-full w-full bg-ivory overflow-hidden flex flex-col pt-12 px-4 pb-20">
      {/* Immersive Background Decor */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-5%] right-[-10%] w-[30%] h-[30%] bg-amber-200/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] bg-maroon-100/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 mb-8 px-2">
        <h2 className="text-2xl text-maroon-900 serif font-bold tracking-tight">Your Likes</h2>
        <p className="text-sm text-neutral-400 mt-1">People interested in preserving the faith.</p>
      </div>

      <div className="relative z-10 flex bg-white/40 backdrop-blur-md p-1 rounded-2xl mb-8 border border-white/40 shadow-sm">
        <button 
          onClick={() => setActiveTab('received')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${activeTab === 'received' ? 'bg-white text-maroon-900 shadow-md ring-1 ring-neutral-100' : 'text-neutral-400 hover:text-neutral-600'}`}
        >
          Interested ({receivedLikes.length})
        </button>
        <button 
          onClick={() => setActiveTab('sent')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${activeTab === 'sent' ? 'bg-white text-maroon-900 shadow-md ring-1 ring-neutral-100' : 'text-neutral-400 hover:text-neutral-600'}`}
        >
          My Likes ({sentLikes.length})
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-1">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-maroon-900/20" />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-4"
            >
              {(activeTab === 'received' ? receivedLikes : sentLikes).map((profile) => {
                const isMatch = matches.some(m => (m.id || m.uid) === (profile.id || profile.uid));
                
                return (
                  <motion.div
                    key={profile.id || profile.uid}
                    layout
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-[28px] overflow-hidden shadow-xl shadow-maroon-900/5 border border-white flex flex-col group transition-all"
                  >
                    <div className="aspect-[4/5] relative">
                      <img 
                        src={profile.photo || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80'} 
                        alt={profile.name}
                        className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                      />
                      {isMatch && (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg border border-white/40">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <p className="font-serif font-bold text-base leading-tight">{profile.name.split(' ')[0]}, {profile.age}</p>
                        <div className="flex items-center gap-1 opacity-70 mt-1">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="text-[9px] font-bold uppercase tracking-widest truncate">{profile.city.split(',')[0]}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white">
                      {activeTab === 'received' && !isMatch ? (
                        <button 
                          onClick={() => handleLikeBack(profile.id || profile.uid)}
                          className="w-full py-3 bg-maroon-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-maroon-900/20"
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                          Spark Back
                        </button>
                      ) : isMatch ? (
                        <div className="w-full py-3 bg-amber-50 text-amber-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-amber-100">
                          <Sparkles className="w-3.5 h-3.5" />
                          Matched
                        </div>
                      ) : (
                        <div className="py-3 text-center text-[10px] text-neutral-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
                          Sent
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {(activeTab === 'received' ? receivedLikes : sentLikes).length === 0 && (
                <div className="col-span-2 py-32 text-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mx-auto mb-6">
                    <Heart className="w-8 h-8 text-neutral-200" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-maroon-900/30">
                    {activeTab === 'received' ? 'Waiting for Sparks' : 'Find your Match'}
                  </h3>
                  <p className="text-sm text-neutral-400 mt-2 font-serif italic">
                    {activeTab === 'received' ? 'The light of attraction will find its way...' : 'Go discover fellow Parsis in the main tab!'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
