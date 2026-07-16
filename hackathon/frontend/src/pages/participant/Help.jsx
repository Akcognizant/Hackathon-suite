// Static help / FAQ page for participants, reached from the profile menu.

const FAQS = [
  {
    q: 'How do I take part in a hackathon?',
    a: 'Open Events to browse active and upcoming hackathons, then go to Teams to create a team for an event or join an existing one. Once you’re on a team you can submit a project.',
  },
  {
    q: 'How many projects can my team submit?',
    a: 'One project per team, per hackathon. Submitting again simply updates your existing entry — it never creates a second one.',
  },
  {
    q: 'Can I edit my submission after sending it?',
    a: 'Yes. Go to My Submissions and click Edit on your project (or re-open Submit Project) to update the title, description, or repository link any time before judging.',
  },
  {
    q: 'What happens after I submit?',
    a: 'Admins and judges review each submission (Pending → Approved/Rejected) and assign a score. You’ll see the status and score update on the My Submissions page.',
  },
  {
    q: 'Where do I see my teams?',
    a: 'Open the profile menu (top-right avatar) and choose My Teams to see every team you belong to and its members.',
  },
  {
    q: 'How did I get here without signing up?',
    a: 'Access to the hackathon portal is granted by passing the assessment. Your identity is carried over securely, so no separate hackathon login is needed.',
  },
]

function Help() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </span>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Help &amp; FAQ</h1>
            <p className="mt-1 text-sm text-blue-100">Everything you need to make the most of the hackathon portal.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {FAQS.map(({ q, a }) => (
          <div key={q} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="flex items-start gap-2 font-semibold text-slate-900">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">?</span>
              {q}
            </h3>
            <p className="mt-1.5 pl-7 text-sm leading-relaxed text-slate-600">{a}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
        </span>
        <div>
          <h3 className="font-semibold text-slate-900">Still need help?</h3>
          <p className="mt-1 text-sm text-slate-600">
            Reach the organizers at{' '}
            <a href="mailto:hackathon-support@cognizant.com" className="font-medium text-blue-600 hover:text-blue-700">
              hackathon-support@cognizant.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

export default Help
