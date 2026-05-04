import React from 'react';
import { Calendar as CalendarIcon, MapPin, Users } from 'lucide-react';
import { motion } from 'motion/react';

const EVENTS = [
  {
    id: 1,
    title: 'Navroze Eve Dinner Gala',
    date: 'Mar 20',
    time: '7:30 PM',
    location: 'Ripon Club, Mumbai',
    attendees: 142,
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80',
    tag: 'Celebration'
  },
  {
    id: 2,
    title: 'Global Parsi Youth Meetup',
    date: 'Apr 05',
    time: '6:00 PM',
    location: 'Virtual / Zoom',
    attendees: 350,
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80',
    tag: 'Networking'
  },
  {
    id: 3,
    title: 'Heritage Walk & Parsi Cafe Trail',
    date: 'Apr 12',
    time: '8:00 AM',
    location: 'Fort, Mumbai',
    attendees: 45,
    image: 'https://images.unsplash.com/photo-1515542622106-78bfa8cb36eb?w=800&q=80',
    tag: 'Culture'
  }
];

export function Events() {
  return (
    <div className="min-h-full flex flex-col p-6 pt-16 bg-ivory">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl text-maroon-900 serif font-bold tracking-tight mb-1">Community</h2>
          <p className="text-sm text-neutral-500 font-sans">Connect in the real world.</p>
        </div>
        <button className="bg-amber-100 text-amber-900 px-3 py-2 rounded-xl text-xs font-semibold shadow-sm">
          My RSVPs
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pb-4">
        {EVENTS.map((event, i) => (
          <motion.div 
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-neutral-100 block group"
          >
            <div className="h-32 w-full relative">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-maroon-900 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                {event.tag}
              </div>
            </div>
            <div className="p-5">
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center bg-amber-50 rounded-xl px-4 py-2 text-center h-fit border border-amber-100">
                  <span className="text-amber-600 text-xs font-bold uppercase">{event.date.split(' ')[0]}</span>
                  <span className="text-maroon-900 text-xl font-serif font-bold leading-none mt-0.5">{event.date.split(' ')[1]}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-serif font-bold text-neutral-900 leading-tight mb-2">
                    {event.title}
                  </h3>
                  <div className="space-y-1.5 text-xs text-neutral-500 font-medium font-sans">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-700 mt-2">
                      <Users className="w-3.5 h-3.5" />
                      {event.attendees} attending
                    </div>
                  </div>
                </div>
              </div>
              <button className="w-full mt-5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium py-3 rounded-xl text-sm transition-colors active:scale-[0.98]">
                RSVP & Invite Match
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
