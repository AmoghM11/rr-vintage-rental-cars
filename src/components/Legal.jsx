import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import { SITE } from '../data.js'

const COPY = {
  privacy: {
    title: 'Privacy',
    body: [
      `${SITE.name} collects the details you send through the enquiry form (name, phone number, event date, venue and message) only to answer your booking request.`,
      'We do not sell or share your details with third parties. Enquiries are kept only as long as needed to plan and deliver your booking.',
      `To ask for your details to be removed, write to ${SITE.email}.`,
    ],
  },
  terms: {
    title: 'Terms',
    body: [
      'A booking is confirmed once the date, car, timings and route are agreed in writing and any advance is received.',
      'Cars are supplied for the agreed hours and route. Changes on the day depend on availability and may be charged.',
      'Vintage cars are driven with care; timings may allow extra margin for traffic and weather.',
    ],
  },
}

export default function Legal({ kind }) {
  const c = COPY[kind]
  return (
    <main className="min-h-screen bg-night px-5 py-16 text-ivory">
      <div className="mx-auto max-w-2xl">
        <Link to="/" aria-label="Back to home">
          <Logo />
        </Link>
        <h1 className="display mt-16 text-6xl uppercase">{c.title}</h1>
        <div className="rule my-8" />
        <div className="space-y-5 text-lg leading-relaxed text-ivory/75">
          {c.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <Link to="/" className="btn-ghost mt-12">
          Back to the showroom
        </Link>
      </div>
    </main>
  )
}
