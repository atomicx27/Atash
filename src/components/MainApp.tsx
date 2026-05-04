import React, { useState, useEffect } from 'react';
import { Compass, Calendar, Sparkles, User, Heart, MessageSquare } from 'lucide-react';
import { Discover } from './Discover';
import { Events } from './Events';
import { Quiz } from './Quiz';
import { ProfileSettings } from './ProfileSettings';
import { Likes } from './Likes';
import { Matches } from './Matches';
import { UserProfile } from './AppContainer';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export type TabState = 'discover' | 'likes' | 'matches' | 'events' | 'profile';

interface MainAppProps {
  currentUserAnswers?: Record<number, number>;
  userProfile?: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  onUpdateQuiz?: (answers: Record<number, number>) => void;
}

export function MainApp({ 
  currentUserAnswers = {}, 
  userProfile = { id: '', uid: '', name: '', email: '', age: '', city: '', profession: '', jobTitle: '', company: '', education: '', prompts: {}, temple: '', interests: [], gender: '', lookingFor: '', voucherCode: '', referredByCode: '', quizAnswers: {} },
  onUpdateProfile = () => {},
  onUpdateQuiz = () => {}
}: MainAppProps) {
  const [activeTab, setActiveTab] = useState<TabState>('discover');
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const { data, error } = await supabase.from('messages')
        .select('id')
        .eq('receiverId', user.id)
        .eq('read', false)
        .limit(1);
      
      if (active && !error) {
         setHasUnread(data && data.length > 0);
      }
    };

    fetchUnread();
    
    const channel = supabase.channel('unread_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchUnread();
      })
      .subscribe();
      
    return () => {
       active = false;
       supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="h-full flex flex-col relative w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto w-full h-full pb-20">
        {activeTab === 'discover' && <Discover 
          currentUserAnswers={currentUserAnswers} 
          currentUserPhoto={userProfile.photo} 
          currentUserLookingFor={userProfile.lookingFor}
        />}
        {activeTab === 'likes' && <Likes />}
        {activeTab === 'matches' && <Matches />}
        {activeTab === 'events' && <Events />}
        {activeTab === 'profile' && (
          <ProfileSettings 
            profile={userProfile} 
            onUpdateProfile={onUpdateProfile}
            quizAnswers={currentUserAnswers}
            onUpdateQuiz={onUpdateQuiz}
          />
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-white/80 backdrop-blur-xl border-t border-white/20 flex justify-around items-center px-4 pb-8 pt-2 z-40">
        <TabButton icon={<Compass />} label="Discover" active={activeTab === 'discover'} onClick={() => setActiveTab('discover')} />
        <TabButton icon={<Heart />} label="Liked" active={activeTab === 'likes'} onClick={() => setActiveTab('likes')} />
        <TabButton 
          icon={<MessageSquare />} 
          label="Chat" 
          active={activeTab === 'matches'} 
          onClick={() => setActiveTab('matches')} 
          hasBadge={hasUnread}
        />
        <TabButton icon={<Calendar />} label="Events" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
        <TabButton icon={<User />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick, hasBadge }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, hasBadge?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-14 gap-1 transition-all duration-300 relative ${active ? 'text-maroon-900 scale-110' : 'text-neutral-400 opacity-60 hover:opacity-100'}`}
    >
      <motion.div 
        initial={false}
        animate={active ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
        className={`p-2 rounded-2xl flex items-center justify-center ${active ? 'bg-maroon-900 text-white shadow-lg shadow-maroon-900/20' : 'bg-transparent'}`}
      >
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5', strokeWidth: active ? 2.5 : 2 })}
      </motion.div>
      {hasBadge && (
        <span className="absolute top-0 right-2 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full shadow-sm" />
      )}
      <span className={`text-[8px] font-bold uppercase tracking-tighter transition-all ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        {label}
      </span>
    </button>
  );
}
