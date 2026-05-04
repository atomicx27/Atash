import React, { useState, useEffect } from 'react';
import { Compass, Calendar, Sparkles, User, Heart, MessageSquare } from 'lucide-react';
import { Discover } from './Discover';
import { Events } from './Events';
import { Quiz } from './Quiz';
import { ProfileSettings } from './ProfileSettings';
import { Likes } from './Likes';
import { Matches } from './Matches';
import { UserProfile } from '../App';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export type TabState = 'discover' | 'likes' | 'matches' | 'events' | 'profile';

interface MainAppProps {
  currentUserAnswers?: Record<number, number>;
  userProfile?: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  onUpdateQuiz?: (answers: Record<number, number>) => void;
}

export function MainApp({ 
  currentUserAnswers = {}, 
  userProfile = { uid: '', name: '', email: '', age: '', city: '', profession: '', jobTitle: '', company: '', education: '', prompts: {}, temple: '', interests: [], gender: '', lookingFor: '', voucherCode: '', referredByCode: '', quizAnswers: {} },
  onUpdateProfile = () => {},
  onUpdateQuiz = () => {}
}: MainAppProps) {
  const [activeTab, setActiveTab] = useState<TabState>('discover');
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'messages'),
      where('receiverId', '==', auth.currentUser.uid),
      where('read', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setHasUnread(!snap.empty);
    });
    return () => unsub();
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

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-neutral-100 flex justify-around items-center px-4 pb-4 pt-2 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
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
      className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors relative ${active ? 'text-maroon-900' : 'text-neutral-400 hover:text-neutral-600'}`}
    >
      <div className={`p-1.5 rounded-full ${active ? 'bg-maroon-50' : 'bg-transparent'}`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6', strokeWidth: active ? 2.5 : 2 })}
      </div>
      {hasBadge && (
        <span className="absolute top-1 right-3 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full shadow-sm" />
      )}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
