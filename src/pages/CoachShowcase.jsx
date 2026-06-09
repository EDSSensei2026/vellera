import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Award, Users, Calendar, MessageCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

/**
 * CoachShowcase: Public-facing coach profile (lead capture)
 * Accessible via /coach/{coachId} - no auth required
 * Shows: bio, credentials, students, testimonials, contact
 */
export default function CoachShowcase() {
  const { coachId } = useParams();
  const [coach, setCoach] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Fetch coach profile
      const coaches = await base44.entities.Coach.filter({ id: coachId });
      if (coaches.length > 0) {
        setCoach(coaches[0]);

        // Fetch student reviews/testimonials (from StudentFeedback if exists)
        const feedbacks = await base44.entities.StudentFeedback?.filter?.({ coach_email: coaches[0].coach_email }).catch(() => []);
        setStudents(feedbacks || []);
      }
      setLoading(false);
    };
    init();
  }, [coachId]);

  const handleContact = async (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) return;

    setSending(true);
    try {
      // Send message to coach
      await base44.entities.Message.create({
        from_email: contactEmail,
        to_email: coach.coach_email,
        content: `${contactName} (${contactEmail}): ${contactMsg}`,
        message_type: 'text',
      });

      setContactName('');
      setContactEmail('');
      setContactMsg('');
      alert('Message sent! Coach will contact you soon.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center pt-24">
        <p className="text-white font-bold">Coach not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vellera-dark text-white pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-b from-vellera-blue/20 to-transparent p-6 text-center space-y-4">
        <div className="w-24 h-24 bg-commander-surface border-4 border-vellera-blue rounded-full mx-auto flex items-center justify-center">
          <span className="text-4xl">👨‍🏫</span>
        </div>
        <h1 className="text-3xl font-black">{coach.coach_name}</h1>
        <p className="text-vellera-green font-bold capitalize">{coach.specialty}</p>
        {coach.bio && <p className="text-commander-muted max-w-md mx-auto">{coach.bio}</p>}
      </div>

      {/* Stats */}
      <div className="px-4 py-6 max-w-lg mx-auto grid grid-cols-3 gap-3">
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 text-center">
          <Users className="w-5 h-5 text-vellera-blue mx-auto mb-2" />
          <p className="text-white text-2xl font-black">{coach.active_students || 0}</p>
          <p className="text-commander-muted text-xs">Active Students</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 text-center">
          <Award className="w-5 h-5 text-vellera-green mx-auto mb-2" />
          <p className="text-white text-2xl font-black">{coach.total_sessions || 0}</p>
          <p className="text-commander-muted text-xs">Sessions</p>
        </div>
        <div className="bg-commander-surface border border-commander-border rounded-xl p-4 text-center">
          <Calendar className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
          <p className="text-white text-2xl font-black">${coach.hourly_rate || 0}</p>
          <p className="text-commander-muted text-xs">Per Hour</p>
        </div>
      </div>

      {/* About */}
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <div className="bg-commander-surface border border-commander-border rounded-xl p-6">
          <h2 className="text-xl font-black mb-4">About</h2>
          <p className="text-commander-muted leading-relaxed">
            {coach.bio || 'Experienced coach specializing in ' + coach.specialty}
          </p>
        </div>

        {/* Contact Form */}
        <div className="bg-commander-surface border border-commander-border rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Get in Touch
          </h2>
          <form onSubmit={handleContact} className="space-y-3">
            <input
              type="text"
              placeholder="Your name"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue"
              required
            />
            <input
              type="email"
              placeholder="Your email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue"
              required
            />
            <textarea
              placeholder="Tell us about your goals..."
              value={contactMsg}
              onChange={e => setContactMsg(e.target.value)}
              rows={4}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue resize-none"
              required
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 bg-vellera-blue text-black font-black rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
          <p className="text-commander-muted text-xs text-center">
            <Mail className="w-3 h-3 inline mr-1" />
            {coach.coach_email}
          </p>
        </div>
      </div>
    </div>
  );
}