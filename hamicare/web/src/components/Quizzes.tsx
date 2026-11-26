// Quizzes do Bem-estar, na tela desenhada pela dona do app: fundo lilás com nuvens, o Lumbi espiando com o
// balão "Vamos descobrir mais sobre você?", os cartões de quiz e, no fim, o recadinho "Você merece se conhecer
// melhor". Durante o quiz, o Lumbi muda de pose a cada pergunta e pula quando você responde.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import { Glyph } from './art';
import { Hamster } from './Hamster';
import { PetAct, type Trick } from './LivePet';
import { useApp } from '../lib/store';
import { QUIZZES, type QuizDef } from '../data/quizzes';
import { play } from '../lib/sound';

const QUESTION_ACTS: Trick[] = ['curioso', 'estrela', 'coracao', 'acenar', 'late', 'musica'];
const RESULT_ACTS: Trick[] = ['comemora', 'danca', 'coracao', 'estrela'];

function Paws() {
  return (
    <span className="qz-paws" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <svg key={i} viewBox="0 0 24 24" width="26" height="26" style={{ transform: `translate(${i * 18}px, ${-i * 16}px) rotate(${20 - i * 8}deg)` }}>
          <ellipse cx="12" cy="16" rx="5.4" ry="4.6" />
          <circle cx="5.6" cy="10.4" r="2.4" />
          <circle cx="9.6" cy="6.4" r="2.4" />
          <circle cx="14.4" cy="6.4" r="2.4" />
          <circle cx="18.4" cy="10.4" r="2.4" />
        </svg>
      ))}
    </span>
  );
}

export function Quizzes({ onClose }: { onClose: () => void }) {
  const s = useApp();
  const [quiz, setQuiz] = useState<QuizDef | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [hop, setHop] = useState(0);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  const start = (q: QuizDef) => {
    setQuiz(q);
    setAnswers([]);
  };
  const qi = answers.length;
  const done = !!quiz && qi >= quiz.questions.length;
  const top = done && quiz ? Object.entries(answers.reduce<Record<string, number>>((m, a) => ((m[a] = (m[a] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1])[0][0] : null;
  const result = quiz && top ? quiz.results[top] : null;
  useEffect(() => {
    if (done) play('conquista');
  }, [done]);

  return createPortal(
    <div className="qz" role="dialog" aria-modal="true" aria-label="Quizzes">
      <span className="qz-cloud is-a" aria-hidden="true" />
      <span className="qz-cloud is-b" aria-hidden="true" />
      <span className="qz-cloud is-c" aria-hidden="true" />
      <div className="qz-in">
        {!quiz && (
          <>
            <header className="qz-head">
              <div>
                <h1>Quizzes</h1>
                <p>Para se conhecer melhor</p>
              </div>
              <button className="qz-x" onClick={onClose} aria-label="Sair">
                <X size={20} />
              </button>
            </header>
            <div className="qz-hero">
              <p className="qz-bubble">
                Vamos descobrir mais sobre você? <span aria-hidden="true">💜</span>
              </p>
              <span className="qz-spark" aria-hidden="true" />
              {/* o Lumbi de verdade espiando por cima do morrinho, vivo */}
              <span className="qz-peek" aria-hidden="true">
                <Hamster fur={s.pet.fur} outfit={s.pet.outfit} mood="risada" size={190} label="" />
              </span>
            </div>
            <p className="qz-note">
              Não são testes de saúde e não dão diagnóstico.
              <br />
              São só para pensar com carinho.
            </p>
            <span className="qz-rule" aria-hidden="true">
              <i />
              <b>♥</b>
              <i />
            </span>
            <div className="qz-list">
              {QUIZZES.map((q) => (
                <button key={q.id} className="qz-card" onClick={() => start(q)}>
                  <span className="qz-ico" style={{ background: q.color }} aria-hidden="true">
                    <Glyph e={q.emoji} size={34} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b>{q.title}</b>
                    <small>{q.questions.length} perguntas · 1 minutinho</small>
                  </span>
                  <ChevronRight size={22} />
                </button>
              ))}
            </div>
            <div className="qz-foot">
              <Paws />
              <p>
                Você merece se conhecer melhor <span aria-hidden="true">💜</span>
              </p>
            </div>
          </>
        )}

        {quiz && !done && (
          <>
            <header className="qz-head">
              <button className="qz-x" onClick={() => (qi ? setAnswers(answers.slice(0, -1)) : setQuiz(null))} aria-label="Voltar">
                <ChevronLeft size={22} />
              </button>
              <div className="qz-bar" aria-label={`Pergunta ${qi + 1} de ${quiz.questions.length}`}>
                {quiz.questions.map((_, k) => (
                  <i key={k} className={k < qi ? 'is-done' : k === qi ? 'is-now' : ''} />
                ))}
              </div>
              <button className="qz-x" onClick={onClose} aria-label="Sair">
                <X size={20} />
              </button>
            </header>
            <p className="qz-qtitle">{quiz.title}</p>
            {qi === 0 && <p className="qz-intro">{quiz.intro}</p>}
            <div className="qz-ask">
              <PetAct key={hop} t={QUESTION_ACTS[qi % QUESTION_ACTS.length]} size={130} className="qz-pose" quiet />
              <p className="qz-q" key={qi}>
                {quiz.questions[qi].q}
              </p>
            </div>
            <div className="qz-opts">
              {quiz.questions[qi].a.map(([label, key], k) => (
                <button
                  key={label}
                  className="qz-opt"
                  style={{ animationDelay: `${k * 50}ms` }}
                  onClick={() => {
                    play('acerto');
                    setHop((h) => h + 1);
                    setAnswers([...answers, key]);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {quiz && done && result && (
          <>
            <header className="qz-head">
              <span />
              <p className="qz-qtitle !m-0">Seu resultado</p>
              <button className="qz-x" onClick={onClose} aria-label="Sair">
                <X size={20} />
              </button>
            </header>
            <div className="qz-result">
              <span className="qz-burst" aria-hidden="true" />
              <PetAct t={RESULT_ACTS[quiz.id.length % RESULT_ACTS.length]} size={180} every={3200} className="qz-rpose" />
              <small>{quiz.title}</small>
              <h2>{result.title}</h2>
              <p>{result.text}</p>
              <div className="qz-tip">
                <b>Dica pra hoje</b>
                <span>{result.tip}</span>
              </div>
              <div className="grid w-full gap-2">
                <button className="qz-btn" onClick={() => setQuiz(null)}>
                  Ver outros quizzes
                </button>
                <button className="qz-btn is-ghost" onClick={() => setAnswers([])}>
                  <RotateCcw size={16} /> Refazer este quiz
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
