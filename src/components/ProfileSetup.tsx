import React, { useState } from 'react';
import { ChevronRight, Camera, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CitySearch } from './CitySearch';

interface ProfileSetupProps {
  onComplete: (data: any) => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', age: '', city: '', profession: '',
    jobTitle: '', company: '', education: '',
    prompts: {} as Record<string, string>,
    temple: '', languages: [] as string[],
    navjote: null as boolean | null,
    diet: '', familyKnows: false,
    photo: '', photoFile: null as File | null, gender: '', lookingFor: '', interests: [] as string[]
  });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const PROMPT_OPTIONS = [
    "The fastest way to my heart is...",
    "My favorite Zoroastrian tradition is...",
    "I'm looking for someone who...",
    "Fun fact about me...",
    "My typical Sunday involves..."
  ];

  const INTEREST_OPTIONS = ['Hiking', 'Art', 'Music', 'Foodie', 'Travel', 'Cooking', 'Yoga', 'Photography', 'Gaming', 'Dance'];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, photo: url, photoFile: file }));
      setError(null);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const update = (field: string, val: any) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    setError(null);
  };

  const updatePrompt = (question: string, answer: string) => {
    setFormData(prev => ({
      ...prev,
      prompts: { ...prev.prompts, [question]: answer }
    }));
  };

  const toggleLanguage = (lang: string) => {
    if (formData.languages.includes(lang)) {
      update('languages', formData.languages.filter(l => l !== lang));
    } else {
      update('languages', [...formData.languages, lang]);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.photo) {
        setError("A profile picture is compulsory to join the community.");
        return;
      }
      if (!formData.name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (!formData.age) {
        setError("Please enter your age.");
        return;
      }
      if (!formData.city) {
        setError("Please select your city.");
        return;
      }
    }
    setError(null);
    if (step < 8) setStep(step + 1);
    else onComplete(formData);
  };

  return (
    <div className="min-h-full flex flex-col p-6 pt-16">
      {/* Header / Progress */}
      <div className="mb-8">
        <h2 className="text-2xl text-maroon-900 mb-2">Create Profile</h2>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? 'bg-amber-500' : 'bg-neutral-200'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 -mx-6 px-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-center mb-6">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border-2 border-dashed overflow-hidden transition-all ${
                      formData.photo ? 'border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-neutral-100 text-neutral-400 border-neutral-300'
                    }`}
                  >
                    {formData.photo ? (
                      <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 mb-1" />
                        <span className="text-xs font-medium">Add Photo</span>
                      </>
                    )}
                  </button>
                  {error && !formData.photo && (
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider text-center">Compulsory</p>
                  )}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-neutral-700 mb-1 block">First Name</span>
                <input type="text" value={formData.name} onChange={e => update('name', e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-sans" placeholder="Rustom" />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-neutral-700 mb-1 block">Age</span>
                  <input type="number" value={formData.age} onChange={e => update('age', e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-sans" placeholder="28" />
                </label>
                <div className="block">
                  <span className="text-sm font-medium text-neutral-700 mb-1 block">City</span>
                  <CitySearch 
                    value={formData.city} 
                    onChange={val => update('city', val)} 
                    placeholder="e.g. Mumbai, India"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-xl serif font-semibold text-neutral-900 mb-4">Career & Education</h3>
              
              <label className="block">
                <span className="text-sm font-medium text-neutral-700 mb-1 block">Job Title</span>
                <input type="text" value={formData.jobTitle} onChange={e => update('jobTitle', e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-sans" placeholder="e.g. Senior Software Engineer" />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-neutral-700 mb-1 block">Company / Workplace</span>
                <input type="text" value={formData.company} onChange={e => update('company', e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-sans" placeholder="e.g. TATA" />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-neutral-700 mb-1 block">Education / Highest Degree</span>
                <input type="text" value={formData.education} onChange={e => update('education', e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-sans" placeholder="e.g. MBA from IIM" />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-neutral-700 mb-1 block">Broad Profession</span>
                <input type="text" value={formData.profession} onChange={e => update('profession', e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-sans" placeholder="e.g. Technology" />
              </label>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-xl serif font-semibold text-neutral-900">Community details</h3>
              
              <label className="block">
                <span className="text-sm font-medium text-neutral-700 mb-1 block">Fire Temple Affiliation</span>
                <input type="text" value={formData.temple} onChange={e => update('temple', e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-sans" placeholder="Your primary Agiary" />
              </label>

              <div>
                <span className="text-sm font-medium text-neutral-700 mb-2 block">Languages Spoken</span>
                <div className="flex flex-wrap gap-2">
                  {['English', 'Gujarati', 'Dari'].map(lang => (
                    <button key={lang} onClick={() => toggleLanguage(lang)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors
                        ${formData.languages.includes(lang) ? 'bg-amber-100 border-amber-500 text-amber-900' : 'bg-white border-neutral-200 text-neutral-600'}`}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-neutral-700 mb-2 block">Observe Navjote?</span>
                <div className="flex gap-3">
                  <button onClick={() => update('navjote', true)} className={`flex-1 py-3 rounded-xl border font-medium ${formData.navjote === true ? 'bg-maroon-50 border-maroon-800 text-maroon-900' : 'bg-white border-neutral-200 text-neutral-600'}`}>Yes</button>
                  <button onClick={() => update('navjote', false)} className={`flex-1 py-3 rounded-xl border font-medium ${formData.navjote === false ? 'bg-maroon-50 border-maroon-800 text-maroon-900' : 'bg-white border-neutral-200 text-neutral-600'}`}>No</button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
               <h3 className="text-xl serif font-semibold text-neutral-900">Lifestyle</h3>

               <div>
                <span className="text-sm font-medium text-neutral-700 mb-2 block">Dietary Preferences</span>
                <div className="grid grid-cols-2 gap-3">
                  {['Non-Vegetarian', 'Vegetarian', 'Eggetarian', 'Vegan'].map(diet => (
                    <button key={diet} onClick={() => update('diet', diet)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-colors
                        ${formData.diet === diet ? 'bg-amber-100 border-amber-500 text-amber-900' : 'bg-white border-neutral-200 text-neutral-600'}`}>
                      {diet}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-900 mb-1">Family matches</div>
                  <div className="text-xs text-neutral-500">"Family knows I'm here"</div>
                </div>
                <button 
                  onClick={() => update('familyKnows', !formData.familyKnows)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${formData.familyKnows ? 'bg-amber-500' : 'bg-neutral-200'}`}
                >
                  <motion.div 
                    layout
                    className="w-4 h-4 rounded-full bg-white absolute top-1"
                    initial={false}
                    animate={{ left: formData.familyKnows ? '26px' : '4px' }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-xl serif font-semibold text-neutral-900">Preferences</h3>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-neutral-700">I am a...</span>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {['Man', 'Woman'].map(g => (
                      <button
                        key={g}
                        onClick={() => update('gender', g)}
                        className={`py-3 rounded-xl border-2 transition-all ${
                          formData.gender === g ? 'border-maroon-900 bg-maroon-50' : 'border-neutral-100'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </label>
                <label className="block mt-6">
                  <span className="text-sm font-medium text-neutral-700">Looking for a...</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['Man', 'Woman', 'Both'].map(l => (
                      <button
                        key={l}
                        onClick={() => update('lookingFor', l)}
                        className={`py-3 rounded-xl border-2 transition-all ${
                          formData.lookingFor === l ? 'border-amber-600 bg-amber-50' : 'border-neutral-100'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </label>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h3 className="text-xl serif font-bold text-maroon-900">Interests</h3>
                <p className="text-sm text-neutral-500">What do you love?</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {INTEREST_OPTIONS.map(interest => {
                  const isSelected = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all border ${
                        isSelected 
                        ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-sm' 
                        : 'bg-white border-neutral-100 text-neutral-500'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="mb-4">
                <h3 className="text-xl serif font-bold text-maroon-900">Dating Prompts</h3>
                <p className="text-sm text-neutral-500">Help people get to know you better. Answer at least two!</p>
              </div>
              
              <div className="space-y-6">
                {PROMPT_OPTIONS.slice(0, 3).map((q, idx) => (
                  <div key={idx} className="space-y-2">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">{q}</span>
                    <textarea 
                      value={formData.prompts[q] || ''} 
                      onChange={e => updatePrompt(q, e.target.value)}
                      className="w-full bg-white border border-neutral-100 rounded-2xl p-4 text-sm font-sans outline-none focus:border-amber-500 min-h-[100px] shadow-sm resize-none"
                      placeholder="Write your answer here..."
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 8 && (
            <motion.div
              key="step8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-4 py-8">
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Heart className="w-10 h-10 fill-current" />
                </div>
                <h2 className="text-2xl font-serif text-maroon-900 font-bold">Profile Ready!</h2>
                <p className="text-neutral-500 text-sm italic">"May your union be blessed with the light of Ahura Mazda."</p>
                <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100 mt-6">
                   <p className="text-[10px] text-amber-700 uppercase tracking-[0.2em] font-bold">Verification Pending</p>
                   <p className="text-xs text-neutral-600 mt-1">Our community moderators will verify your reference soon.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-xs text-red-600 text-center font-medium">{error}</p>
        </div>
      )}
      <div className="mt-4 pb-2 z-10 bg-ivory">
        <button
          onClick={nextStep}
          className="w-full bg-maroon-900 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 hover:bg-maroon-800 transition-all active:scale-[0.98] shadow-lg shadow-maroon-900/20"
        >
          <span>{step === 8 ? 'Finish Setup' : 'Continue'}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
