import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MapPin, ChevronLeft, Loader2, Heart, MessageCircle } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, query, where, getDocs, addDoc, serverTimestamp, 
  onSnapshot, orderBy, limit, doc, getDoc, deleteDoc, updateDoc
} from 'firebase/firestore';
import { UserProfile } from '../App';
import { MoreVertical, ShieldAlert, UserX, Trash2, Info } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: any;
  read?: boolean;
}

interface ChatProps {
  partner: UserProfile;
  onBack: () => void;
}

function Chat({ partner, onBack }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [reportMode, setReportMode] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'messages'),
      where('senderId', 'in', [auth.currentUser.uid, partner.uid]),
      where('receiverId', 'in', [auth.currentUser.uid, partner.uid]),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      const filtered = msgs.filter(m => 
        (m.senderId === auth.currentUser?.uid && m.receiverId === partner.uid) ||
        (m.senderId === partner.uid && m.receiverId === auth.currentUser?.uid)
      );
      setMessages(filtered);
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      // Mark unread messages as read
      const unread = snapshot.docs.filter(d => {
        const data = d.data();
        return data.receiverId === auth.currentUser?.uid && !data.read;
      });
      unread.forEach(d => {
        updateDoc(d.ref, { read: true });
      });
    }, (error) => {
      console.error("Chat listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [partner.uid]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: auth.currentUser.uid,
        receiverId: partner.uid,
        text: text,
        createdAt: serverTimestamp(),
        read: false
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleUnmatch = async () => {
    if (!auth.currentUser || !window.confirm('Are you sure you want to unmatch? This action cannot be undone.')) return;
    try {
      const q = query(collection(db, 'likes'), where('fromId', '==', auth.currentUser.uid), where('toId', '==', partner.uid));
      const snaps = await getDocs(q);
      await Promise.all(snaps.docs.map(d => deleteDoc(d.ref)));
      onBack();
    } catch (error) {
      console.error("Unmatch error:", error);
    }
  };

  const handleBlock = async () => {
    if (!auth.currentUser || !window.confirm('Block this user? You will no longer see each other.')) return;
    try {
      await addDoc(collection(db, 'blocks'), {
        blockerId: auth.currentUser.uid,
        blockedUserId: partner.uid,
        createdAt: serverTimestamp()
      });
      // Also unmatch
      const q = query(collection(db, 'likes'), where('fromId', '==', auth.currentUser.uid), where('toId', '==', partner.uid));
      const snaps = await getDocs(q);
      await Promise.all(snaps.docs.map(d => deleteDoc(d.ref)));
      onBack();
    } catch (error) {
      console.error("Block error:", error);
    }
  };

  const handleReport = async () => {
    if (!auth.currentUser || !reportReason.trim()) return;
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: auth.currentUser.uid,
        reportedUserId: partner.uid,
        reason: reportReason,
        createdAt: serverTimestamp()
      });
      alert('Report submitted. Thank you for keeping our community safe.');
      setReportMode(false);
      setShowMenu(false);
      handleBlock();
    } catch (error) {
      console.error("Report error:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ivory flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-maroon-900">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-100">
              <img src={partner.photo} alt={partner.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-maroon-900 leading-none">{partner.name}</h4>
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Matched</span>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-neutral-400">
            <MoreVertical className="w-5 h-5" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-neutral-100 py-2 z-50 overflow-hidden"
                >
                  <button onClick={handleUnmatch} className="w-full px-4 py-3 text-left text-sm text-neutral-600 hover:bg-neutral-50 flex items-center gap-3">
                    <Trash2 className="w-4 h-4" /> Unmatch
                  </button>
                  <button onClick={() => setReportMode(true)} className="w-full px-4 py-3 text-left text-sm text-neutral-600 hover:bg-neutral-50 flex items-center gap-3">
                    <ShieldAlert className="w-4 h-4 text-amber-600" /> Report
                  </button>
                  <button onClick={handleBlock} className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                    <UserX className="w-4 h-4" /> Block
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {reportMode && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-maroon-900/40 backdrop-blur-sm" 
               onClick={() => setReportMode(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-serif font-bold text-maroon-900 mb-2">Report Content</h3>
              <p className="text-sm text-neutral-500 mb-6 font-sans">Please help us understand what's happening. Your report is anonymous.</p>
              
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Reason for report..."
                className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-4 text-sm outline-none focus:border-maroon-900/30 font-sans min-h-[120px] mb-6"
              />
              
              <div className="flex gap-3">
                <button onClick={() => setReportMode(false)} className="flex-1 py-3 text-neutral-400 font-bold text-sm">Cancel</button>
                <button 
                  onClick={handleReport}
                  disabled={!reportReason.trim()}
                  className="flex-1 py-3 bg-red-600 text-white rounded-full font-bold text-sm disabled:opacity-50"
                >
                  Submit & Block
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex flex-col items-center py-6 text-center opacity-40">
           <Heart className="w-6 h-6 text-amber-600 mb-2" />
           <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Match Protected by Spiritual Integrity</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-maroon-900/20" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-amber-200" />
            </div>
            <p className="text-neutral-400 text-sm italic font-serif">"A conversation is a bridge between two worlds."</p>
            <p className="text-[10px] text-neutral-300 uppercase tracking-widest mt-2">Break the ice!</p>
          </div>
        ) : messages.map((msg) => {
          const isMe = msg.senderId === auth.currentUser?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                isMe 
                ? 'bg-maroon-900 text-white rounded-br-none' 
                : 'bg-white border border-neutral-100 text-neutral-800 rounded-bl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-neutral-100 safe-bottom">
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a message..."
            className="w-full bg-neutral-50 border border-neutral-100 rounded-full px-6 py-3 pr-12 text-sm outline-none focus:border-maroon-900/30 font-sans"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-maroon-900 text-white rounded-full flex items-center justify-center disabled:opacity-30 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export function Matches() {
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<UserProfile | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!auth.currentUser) return;

    let active = true;
    let receivedIds: string[] = [];
    let sentIds: string[] = [];
    let blockedIds: string[] = [];
    let blockedMeIds: string[] = [];
    let lastMatchIdsStr = '';

    const updateMatches = async () => {
      // Exclude blocked users from matches
      const matchIds = sentIds.filter(id => 
        receivedIds.includes(id) && 
        !blockedIds.includes(id) && 
        !blockedMeIds.includes(id)
      ).sort();

      const matchIdsStr = matchIds.join(',');
      
      if (matchIdsStr === lastMatchIdsStr) return;
      lastMatchIdsStr = matchIdsStr;

      if (matchIds.length === 0) {
        if (active) {
          setMatches([]);
          setLoading(false);
        }
        return;
      }

      try {
        const profileDocs = await Promise.all(
          matchIds.map(id => getDoc(doc(db, 'users', id)))
        );
        if (active) {
          const profiles = profileDocs.map(d => d.data() as UserProfile).filter(p => !!p);
          setMatches(profiles);
        }
      } catch (error) {
        console.error("Error fetching match profiles:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    const qReceived = query(collection(db, 'likes'), where('toId', '==', auth.currentUser.uid));
    const unsubReceived = onSnapshot(qReceived, (snapshot) => {
      receivedIds = snapshot.docs.map(doc => doc.data().fromId);
      updateMatches();
    });

    const qSent = query(collection(db, 'likes'), where('fromId', '==', auth.currentUser.uid));
    const unsubSent = onSnapshot(qSent, (snapshot) => {
      sentIds = snapshot.docs.map(doc => doc.data().toId);
      updateMatches();
    });

    const qBlocks = query(collection(db, 'blocks'), where('blockerId', '==', auth.currentUser.uid));
    const unsubBlocks = onSnapshot(qBlocks, (snapshot) => {
      blockedIds = snapshot.docs.map(doc => doc.data().blockedUserId);
      updateMatches();
    });

    const qBlockedMe = query(collection(db, 'blocks'), where('blockedUserId', '==', auth.currentUser.uid));
    const unsubBlockedMe = onSnapshot(qBlockedMe, (snapshot) => {
      blockedMeIds = snapshot.docs.map(doc => doc.data().blockerId);
      updateMatches();
    });

    const qUnread = query(
      collection(db, 'messages'), 
      where('receiverId', '==', auth.currentUser.uid),
      where('read', '==', false)
    );
    const unsubUnread = onSnapshot(qUnread, (snap) => {
      const counts: Record<string, boolean> = {};
      snap.docs.forEach(d => {
        const sid = d.data().senderId;
        counts[sid] = true;
      });
      setUnreadCounts(counts);
    });

    return () => {
      active = false;
      unsubReceived();
      unsubSent();
      unsubBlocks();
      unsubBlockedMe();
      unsubUnread();
    };
  }, []);

  if (selectedPartner) {
    return <Chat partner={selectedPartner} onBack={() => setSelectedPartner(null)} />;
  }

  return (
    <div className="h-full w-full flex flex-col pt-12 px-4 pb-20 overflow-y-auto">
      <div className="mb-8 px-2">
        <h2 className="text-2xl text-maroon-900 serif font-bold tracking-tight">Your Matches</h2>
        <p className="text-sm text-neutral-400 mt-1">Spiritual connections recognized.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-maroon-900/10" />
          </div>
        ) : matches.length > 0 ? (
          matches.map((profile) => (
            <motion.button
              key={profile.uid}
              onClick={() => setSelectedPartner(profile)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-white rounded-3xl p-4 flex items-center gap-4 shadow-sm border border-neutral-100 hover:border-amber-200 transition-colors group text-left relative"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md">
                <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-maroon-900">{profile.name}, {profile.age}</h4>
                <div className="flex items-center gap-1 text-neutral-400 text-[10px] uppercase font-bold tracking-widest mt-1">
                  <MapPin className="w-2.5 h-2.5" />
                  {profile.city.split(',')[0]}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 px-2">
                {unreadCounts[profile.uid] && (
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-sm animate-pulse" />
                )}
                <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-4 h-4 fill-current" />
                </div>
              </div>
            </motion.button>
          ))
        ) : (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-amber-200" />
            </div>
            <p className="text-neutral-400 font-serif italic">
              "When two sparks find each other, a holy flame begins."
            </p>
            <p className="text-sm text-neutral-300 mt-2 font-sans">No matches yet. Keep exploring!</p>
          </div>
        )}
      </div>
    </div>
  );
}
