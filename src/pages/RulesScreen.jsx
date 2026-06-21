import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './RulesScreen.css'

const RULES = [
  {
    title: 'Spontane Runden',
    text: 'Während der Session startet das Spiel automatisch zufällige Runden – ihr müsst nicht ständig aufs Handy schauen.'
  },
  {
    title: 'Annehmen oder trinken',
    text: 'Wer ausgewählt wird, akzeptiert die Challenge oder nimmt die Strafe.'
  },
  {
    title: 'Beweisvideo',
    text: 'Bei Annahme: kurzes Video aufnehmen (5–20 Sekunden) als Beweis.'
  },
  {
    title: 'Abstimmung',
    text: 'Alle anderen Spieler stimmen ab, ob die Challenge geschafft wurde.'
  },
  {
    title: 'Medien sind temporär',
    text: 'Videos werden nach der Abstimmung automatisch gelöscht. Nur Punktestand und Statistik bleiben.'
  }
]

export default function RulesScreen({}) {
  const navigate = useNavigate()

  return (
    <div className="rules-screen">
      <div className="rules-screen__top-row">
        <button className="rules-screen__back" onClick={() => navigate(-1)}>
          ← Zurück
        </button>
      </div>

      <h1 className="rules-screen__title">Rules</h1>

      <div className="rules-screen__list">
        {RULES.map((rule, i) => (
          <motion.div
            key={rule.title}
            className="rules-screen__item glass"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06, ease: 'easeOut' }}
          >
            <span className="rules-screen__item-title">{rule.title}</span>
            <p className="rules-screen__item-text">{rule.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
