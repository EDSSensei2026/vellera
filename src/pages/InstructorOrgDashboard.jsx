import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Activity, ClipboardList, BarChart3, AlertCircle } from 'lucide-react';
import BackButton from '../components/BackButton';
import StudentRoster from '../components/instructor/StudentRoster';
import StudentProgressLogs from '../components/instructor/StudentProgressLogs';
import SquadHealthOverview from '../components/instructor/SquadHealthOverview';

const TABS = [
  { id: 'students', label: 'Students', icon: Users },
  { id: 'progress', label: 'Progress', icon: ClipboardList },
  { id: 'health', label: 'Squad Health', icon: Activity },
];

export default function InstructorOrgDashboard() {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);

      const members = await base44.entities.OrganizationMember.filter({
        user_email: me.email,
        member_type: 'INSTRUCTOR',
      });

      if (members.length > 0) {
        const orgId = members[0].org_id;
        const [orgs, studentMembers] = await Promise.all([
          base44.entities.Organization.filter({ id: orgId }),
          base44.entities.OrganizationMember.filter({ org_id: orgId, member_type: 'STUDENT' }),
        ]);
        if (orgs.length > 0) setOrg(orgs[0]);
        setStudents(studentMembers);
      }

      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-commander-dark">
        <div className="w-8 h-8 border-4 border-vellera-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-4 max-w-lg mx-auto pt-16">
        <BackButton to="/" />
        <div className="bg-commander-surface border border-commander-border rounded-xl p-8 text-center mt-8">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <p className="text-white font-bold text-lg">No Organization Found</p>
          <p className="text-commander-muted text-sm mt-1">You're not assigned as an instructor to any organization.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-commander-dark pb-24">
      {/* Header */}
      <div className="bg-commander-surface border-b border-commander-border px-4 pt-4 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <BackButton to="/" />
          <div>
            <h1 className="text-white text-xl font-black">{org.name}</h1>
            <p className="text-commander-muted text-xs">{students.length} students · Instructor Dashboard</p>
          </div>
        </div>

        {/* Summary Pills */}
        <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 bg-vellera-blue/10 border border-vellera-blue/30 rounded-full px-3 py-1 shrink-0">
            <Users className="w-3 h-3 text-vellera-blue" />
            <span className="text-vellera-blue text-xs font-bold">{students.length} Students</span>
          </div>
          <div className="flex items-center gap-1.5 bg-vellera-green/10 border border-vellera-green/30 rounded-full px-3 py-1 shrink-0">
            <BarChart3 className="w-3 h-3 text-vellera-green" />
            <span className="text-vellera-green text-xs font-bold">{org.industry || 'General'}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
                  active
                    ? 'border-vellera-blue text-white'
                    : 'border-transparent text-commander-muted hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 max-w-2xl mx-auto">
        {activeTab === 'students' && (
          <StudentRoster students={students} coachEmail={user?.email} orgId={org.id} />
        )}
        {activeTab === 'progress' && (
          <StudentProgressLogs students={students} coachEmail={user?.email} />
        )}
        {activeTab === 'health' && (
          <SquadHealthOverview students={students} />
        )}
      </div>
    </div>
  );
}