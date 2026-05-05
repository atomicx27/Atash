import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Sparkles, ChevronRight, Save, Flame, Edit3, Camera, Hash, Share2, Copy, LogOut, Plus } from 'lucide-react';
import { CitySearch } from './CitySearch';

const INTEREST_OPTIONS = ['Hiking', 'Art', 'Music', 'Foodie', 'Travel', 'Cooking', 'Yoga', 'Photography', 'Gaming', 'Dance'];

const PROMPT_OPTIONS = [
  "The fastest way to my heart is...",
  "My favorite Zoroastrian tradition is...",
  "I'm looking for someone who...",
  "Fun fact about me...",
  "My typical Sunday involves..."
];

import { supabase } from '../lib/supabase';
import { UserProfile } from './AppContainer';
import { QUESTIONS } from './Quiz';

interface ProfileSettingsProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  quizAnswers: Record<number, number>;
  onUpdateQuiz: (answers: Record<number, number>) => void;
}

export function ProfileSettings({ profile, onUpdateProfile, quizAnswers, onUpdateQuiz }: ProfileSettingsProps) {
  const [editingBasic, setEditingBasic] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
  const [editingQuiz, setEditingQuiz] = useState<number | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [tempPromptAnswer, setTempPromptAnswer] = useState('');
  const [showPromptAdder, setShowPromptAdder] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpdatePrompt = (q: string) => {
    onUpdateProfile({ 
      ...profile, 
      prompts: { ...profile.prompts, [q]: tempPromptAnswer } 
    });
    setEditingPrompt(null);
  };

  const handleAddPrompt = (q: string) => {
    setEditingPrompt(q);
    setTempPromptAnswer('');
    setShowPromptAdder(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const updated = { ...tempProfile, photo: url };
      setTempProfile(updated);
      onUpdateProfile(updated);
    }
  };

  const handleSaveBasic = () => {
    onUpdateProfile(tempProfile);
    setEditingBasic(false);
  };

  const toggleInterest = (interest: string) => {
    const updatedInterests = profile.interests.includes(interest)
      ? profile.interests.filter(i => i !== interest)
      : [...profile.interests, interest];
    onUpdateProfile({ ...profile, interests: updatedInterests });
  };

  const handleUpdateQuiz = (qIdx: number, oIdx: number) => {
    const newAnswers = { ...quizAnswers, [qIdx]: oIdx };
    onUpdateQuiz(newAnswers);
    setEditingQuiz(null);
  };

  return (
    <div className="min-h-full p-6 pt-16 bg-ivory">
      <div className="flex items-center gap-4 mb-8">
        <div className="relative group">
          <div className="w-16 h-16 rounded-full bg-maroon-900 overflow-hidden flex items-center justify-center text-white text-2xl font-serif">
            {profile.photo ? (
              <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              profile.name?.[0] || 'A'
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoChange} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-sm border-2 border-ivory hover:bg-amber-600 transition-colors"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl text-maroon-900 serif font-bold tracking-tight">{profile.name || 'Anonymous Atash User'}</h2>
          <p className="text-xs text-neutral-400 font-sans uppercase tracking-widest leading-none mt-1">Profile & Preferences</p>
        </div>
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
          }}
          className="p-3 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors shadow-sm"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6 pb-12">
        {/* Dating Prompts Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-maroon-900 font-serif font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Dating Prompts
            </h3>
            <button 
              onClick={() => setShowPromptAdder(!showPromptAdder)}
              className="text-amber-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          <AnimatePresence>
            {showPromptAdder && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 space-y-2 overflow-hidden"
              >
                <p className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-2">Choose a prompt</p>
                {PROMPT_OPTIONS.filter(opt => !profile.prompts?.[opt]).map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAddPrompt(opt)}
                    className="w-full text-left p-3 rounded-xl border border-neutral-100 text-xs font-medium text-neutral-600 hover:border-amber-200 hover:bg-amber-50 transition-all flex items-center justify-between group"
                  >
                    {opt}
                    <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {/* New Prompt Entry being added */}
            {editingPrompt && !profile.prompts?.[editingPrompt] && (
              <div className="group">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-sans font-bold text-amber-600 uppercase tracking-widest leading-none">{editingPrompt}</span>
                </div>
                <div className="space-y-3">
                  <textarea 
                    className="w-full bg-neutral-50 border border-amber-200 rounded-2xl p-4 italic text-sm text-neutral-700 outline-none focus:border-amber-500 shadow-inner min-h-[100px] resize-none"
                    value={tempPromptAnswer}
                    onChange={e => setTempPromptAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                     <button 
                      onClick={() => setEditingPrompt(null)}
                      className="px-4 py-2 rounded-full text-xs font-bold text-neutral-400 hover:text-neutral-600 uppercase tracking-widest"
                     >
                       Cancel
                     </button>
                     <button 
                      onClick={() => handleUpdatePrompt(editingPrompt)}
                      className="px-6 py-2 bg-amber-500 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95"
                     >
                       Save
                     </button>
                  </div>
                </div>
              </div>
            )}

            {Object.entries(profile.prompts || {}).map(([q, a], idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-sans font-bold text-amber-600 uppercase tracking-widest leading-none">{q}</span>
                  {editingPrompt !== q && (
                    <button 
                      onClick={() => {
                        setEditingPrompt(q);
                        setTempPromptAnswer(a);
                      }}
                      className="text-amber-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>
                
                {editingPrompt === q ? (
                  <div className="space-y-3">
                    <textarea 
                      className="w-full bg-neutral-50 border border-amber-200 rounded-2xl p-4 italic text-sm text-neutral-700 outline-none focus:border-amber-500 shadow-inner min-h-[100px] resize-none"
                      value={tempPromptAnswer}
                      onChange={e => setTempPromptAnswer(e.target.value)}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                       <button 
                        onClick={() => setEditingPrompt(null)}
                        className="px-4 py-2 rounded-full text-xs font-bold text-neutral-400 hover:text-neutral-600 uppercase tracking-widest"
                       >
                         Cancel
                       </button>
                       <button 
                        onClick={() => handleUpdatePrompt(q)}
                        className="px-6 py-2 bg-amber-500 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95"
                       >
                         Update
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 italic text-sm text-neutral-700 relative">
                     "{a}"
                  </div>
                )}
              </div>
            ))}
            {(!profile.prompts || Object.keys(profile.prompts).length === 0) && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-100">
                  <Plus className="w-6 h-6 text-neutral-300" />
                </div>
                <p className="text-sm text-neutral-500 font-serif italic mb-4">No prompts answered yet.</p>
                <button 
                  onClick={() => setShowPromptAdder(true)}
                  className="px-6 py-2 bg-maroon-900 text-white rounded-full text-xs font-bold uppercase tracking-widest"
                >
                  Add your first prompt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Voucher Sharing Section */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 shadow-lg shadow-amber-500/20 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-4 h-4" />
            <h3 className="font-serif font-bold text-lg">Invite Others</h3>
          </div>
          <p className="text-white/80 text-xs mb-4 leading-relaxed font-medium">
            Atash is a private community. Share your unique voucher code with fellow Parsi Zoroastrians to invite them.
          </p>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold block mb-1">Your Voucher Code</span>
              <span className="text-2xl font-mono font-bold tracking-widest">{profile.voucherCode}</span>
            </div>
            <button 
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(profile.voucherCode || '');
                  alert('Voucher code copied to clipboard!');
                } catch (err) {
                  console.error('Failed to copy: ', err);
                }
              }}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors shadow-inner active:scale-90"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] mt-4 text-white/60 font-medium italic">
            Joined via {profile.referredByCode === '21040721' ? 'Master Founder Code' : `Voucher: ${profile.referredByCode}`}
          </p>
        </div>

        {/* Community Impact / Referrals */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Community Impact</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Invited By</span>
              <span className="text-sm font-bold text-maroon-900 truncate block">
                {profile.referredByCode === '21040721' ? 'Master Founder' : profile.referredByCode}
              </span>
            </div>
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Status</span>
              <span className="text-sm font-bold text-green-600">Verified Member</span>
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-maroon-900 font-serif font-bold text-lg flex items-center gap-2">
              <User className="w-4 h-4" /> Personal Info
            </h3>
            {!editingBasic ? (
              <button 
                onClick={() => setEditingBasic(true)}
                className="text-amber-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            ) : (
              <button 
                onClick={handleSaveBasic}
                className="text-white bg-maroon-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-md"
              >
                <Save className="w-3 h-3" /> Save
              </button>
            )}
          </div>

          <div className="space-y-4">
            <InfoItem 
              label="Full Name" 
              value={editingBasic ? null : profile.name} 
              editNode={
                <input 
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500"
                  value={tempProfile.name}
                  onChange={e => setTempProfile({...tempProfile, name: e.target.value})}
                />
              }
              editing={editingBasic}
            />
            <div className="grid grid-cols-2 gap-4">
              <InfoItem 
                label="Age" 
                value={editingBasic ? null : profile.age} 
                editNode={
                  <input 
                    type="number"
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500"
                    value={tempProfile.age}
                    onChange={e => setTempProfile({...tempProfile, age: e.target.value})}
                  />
                }
                editing={editingBasic}
              />
              <InfoItem 
                label="City" 
                value={editingBasic ? null : profile.city} 
                editNode={
                  <CitySearch 
                    value={tempProfile.city} 
                    onChange={val => setTempProfile({...tempProfile, city: val})} 
                    placeholder="Search city..."
                  />
                }
                editing={editingBasic}
              />
            </div>
            <InfoItem 
              label="Profession" 
              value={editingBasic ? null : profile.profession} 
              editNode={
                <input 
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500"
                  value={tempProfile.profession}
                  onChange={e => setTempProfile({...tempProfile, profession: e.target.value})}
                />
              }
              editing={editingBasic}
            />
            <InfoItem 
              label="Job Title" 
              value={editingBasic ? null : profile.jobTitle} 
              editNode={
                <input 
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500"
                  value={tempProfile.jobTitle}
                  onChange={e => setTempProfile({...tempProfile, jobTitle: e.target.value})}
                />
              }
              editing={editingBasic}
            />
            <InfoItem 
              label="Company" 
              value={editingBasic ? null : profile.company} 
              editNode={
                <input 
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500"
                  value={tempProfile.company}
                  onChange={e => setTempProfile({...tempProfile, company: e.target.value})}
                />
              }
              editing={editingBasic}
            />
            <InfoItem 
              label="Education" 
              value={editingBasic ? null : profile.education} 
              editNode={
                <input 
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500"
                  value={tempProfile.education}
                  onChange={e => setTempProfile({...tempProfile, education: e.target.value})}
                />
              }
              editing={editingBasic}
            />
             <InfoItem 
              label="Fire Temple" 
              value={editingBasic ? null : profile.temple} 
              editNode={
                <input 
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500"
                  value={tempProfile.temple}
                  onChange={e => setTempProfile({...tempProfile, temple: e.target.value})}
                />
              }
              editing={editingBasic}
            />
            <div className="grid grid-cols-2 gap-4">
              <InfoItem 
                label="Gender" 
                value={editingBasic ? null : profile.gender} 
                editNode={
                  <select 
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500"
                    value={tempProfile.gender}
                    onChange={e => setTempProfile({...tempProfile, gender: e.target.value})}
                  >
                    <option value="">Select</option>
                    <option value="Man">Man</option>
                    <option value="Woman">Woman</option>
                  </select>
                }
                editing={editingBasic}
              />
              <InfoItem 
                label="Looking For" 
                value={editingBasic ? null : profile.lookingFor} 
                editNode={
                  <select 
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500"
                    value={tempProfile.lookingFor}
                    onChange={e => setTempProfile({...tempProfile, lookingFor: e.target.value})}
                  >
                    <option value="">Select</option>
                    <option value="Man">Man</option>
                    <option value="Woman">Woman</option>
                    <option value="Both">Both</option>
                  </select>
                }
                editing={editingBasic}
              />
            </div>
          </div>
        </div>

        {/* Interests Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100">
          <h3 className="text-maroon-900 font-serif font-bold text-lg mb-4 flex items-center gap-2">
            <Hash className="w-4 h-4" /> Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(interest => {
              const isSelected = profile.interests?.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    isSelected 
                    ? 'bg-amber-100 border-amber-500 text-amber-900' 
                    : 'bg-neutral-50 border-neutral-100 text-neutral-500 hover:border-neutral-200 shadow-sm'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quiz Answers Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-maroon-900 font-serif font-bold text-lg">Compatibility Profile</h3>
          </div>
          
          <div className="space-y-3">
            {QUESTIONS.map((q, idx) => {
              const currentAns = quizAnswers[idx];
              const isEditing = editingQuiz === idx;

              return (
                <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 transition-all">
                  <div className="flex justify-between items-start mb-2 group">
                    <p className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">{q.question}</p>
                    {!isEditing && (
                      <button 
                        onClick={() => setEditingQuiz(idx)}
                        className="text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                         <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {!isEditing ? (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="flex items-center justify-between"
                        onClick={() => setEditingQuiz(idx)}
                      >
                         <span className="text-sm font-medium text-neutral-900">
                           {currentAns !== undefined ? q.options[currentAns] : 'Not answered'}
                         </span>
                         <ChevronRight className="w-4 h-4 text-neutral-300" />
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        className="space-y-2 pt-2"
                      >
                        {q.options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() => handleUpdateQuiz(idx, oIdx)}
                            className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-colors ${
                              currentAns === oIdx 
                              ? 'bg-maroon-50 border-maroon-300 text-maroon-900 shadow-inner' 
                              : 'bg-neutral-50 border-neutral-100 text-neutral-600 hover:border-neutral-200'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-6 space-y-4">
             <div className="w-full py-4 border-t border-neutral-100 flex flex-col items-center gap-1 opacity-40">
                <Flame className="w-6 h-6 text-neutral-300" />
                <span className="text-[8px] font-sans font-medium uppercase tracking-[0.2em] text-neutral-400">Parsi Matrimony Preservation</span>
             </div>
        </div>
        <div className="pt-8">
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
            }}
            className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors shadow-sm active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
          <p className="text-center text-[10px] text-neutral-400 mt-4 px-4 uppercase tracking-widest leading-relaxed">
            You can sign back in at any time with your Google account.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, editNode, editing }: { label: string, value: string | null, editNode: React.ReactNode, editing: boolean }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest block">{label}</span>
      {editing ? editNode : <span className="text-sm font-medium text-neutral-900 block border-b border-transparent pb-1">{value || 'Not set'}</span>}
    </div>
  );
}
