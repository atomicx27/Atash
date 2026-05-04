import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessagesSquare, MapPin, User, ChevronRight, Star } from 'lucide-react';
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
      alert("It's a Match! You can now message them.");
    } catch (error) {
      console.error("Error matching back:", error);
    }
  };

  const matches = sentLikes.filter(sent => 
    receivedLikes.some(received => (received.id || received.uid) === (sent.id || sent.uid))
  );

  return (
    <div className="h-full w-full flex flex-col pt-12 px-4 pb-20">
      <div className="mb-8 px-2">
        <h2 className="text-2xl text-maroon-900 serif font-bold tracking-tight">Your Likes</h2>
        <p className="text-sm text-neutral-400 mt-1">People interested in preserving the faith.</p>
      </div>

      <div className="flex bg-neutral-100 p-1 rounded-2xl mb-8">
        <button 
          onClick={() => setActiveTab('received')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'received' ? 'bg-white text-maroon-900 shadow-sm' : 'text-neutral-400'}`}
        >
          Interested ({receivedLikes.length})
        </button>
        <button 
          onClick={() => setActiveTab('sent')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'sent' ? 'bg-white text-maroon-900 shadow-sm' : 'text-neutral-400'}`}
        >
          My Likes ({sentLikes.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-900" />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-2 gap-4"
            >
              {(activeTab === 'received' ? receivedLikes : sentLikes).map((profile) => {
                const isMatch = matches.some(m => (m.id || m.uid) === (profile.id || profile.uid));
                
                return (
                  <motion.div
                    key={profile.id || profile.uid}
                    layout
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100 flex flex-col group"
                  >
                    <div className="aspect-[3/4] relative">
                      <img 
                        src={profile.photo || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80'} 
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                      {isMatch && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                          <Star className="w-3 h-3 fill-current" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 text-white">
                        <p className="font-serif font-bold text-sm">{profile.name}, {profile.age}</p>
                        <div className="flex items-center gap-1 opacity-80 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="text-[10px] font-medium">{profile.city.split(',')[0]}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3">
                      {activeTab === 'received' && !isMatch ? (
                        <button 
                          onClick={() => handleLikeBack(profile.id || profile.uid)}
                          className="w-full py-2 bg-maroon-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-maroon-900/10"
                        >
                          <Heart className="w-3 h-3 fill-current" />
                          Like Back
                        </button>
                      ) : isMatch ? (
                        <button 
                          className="w-full py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                          disabled
                        >
                          <MessagesSquare className="w-3 h-3 fill-current" />
                          Matched
                        </button>
                      ) : (
                        <div className="py-2 text-center text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                          Pending
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {(activeTab === 'received' ? receivedLikes : sentLikes).length === 0 && (
                <div className="col-span-2 py-20 text-center text-neutral-400">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-serif italic">
                    {activeTab === 'received' ? 'Waiting for the light of attraction...' : 'Go find a fellow Parsi in Discover!'}
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
