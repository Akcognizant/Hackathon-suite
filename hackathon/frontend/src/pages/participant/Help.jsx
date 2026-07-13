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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Help &amp; FAQ</h1>
        <p className="mt-1 text-sm text-slate-500">Everything you need to make the most of the hackathon portal.</p>
      </div>

      <div className="space-y-3">
        {FAQS.map(({ q, a }) => (
          <div key={q} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">{q}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{a}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
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
  )
}

export default Help
