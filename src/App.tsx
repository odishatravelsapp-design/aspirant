import { useEffect, useState } from 'react'
import type {
  AppConfig,
  Exam,
  QuestionBank,
  Question,
  AnswerRecord,
  Attempt,
  CurrentAffairsDay,
  ReviewItem,
  Difficulty,
} from './types'
import { loadConfig, loadQuestionBank, loadCurrentAffairs, shuffle, setAutoApprove } from './lib/data'
import {
  saveAttempt,
  makeId,
  getAttemptsForExam,
  weakTopics,
  dueReviews,
  dueReviewsForExam,
  recordQuizForReview,
  markActiveToday,
} from './lib/storage'
import { useOnline } from './hooks/useOnline'
import { setReportConfig } from './lib/appMeta'
import { useT } from './i18n/LanguageContext'
import { LANGUAGES, type LangCode } from './i18n/translations'
import { Home } from './components/Home'
import { ExamDetail } from './components/ExamDetail'
import { Quiz } from './components/Quiz'
import { ExamMock } from './components/ExamMock'
import { Results } from './components/Results'
import { History } from './components/History'
import { Insights } from './components/Insights'
import { predictedQuestions } from './lib/insights'
import { CurrentAffairs } from './components/CurrentAffairs'
import { AccountButton } from './components/AccountButton'
import { InstallPrompt } from './components/InstallPrompt'
import { Settings } from './components/Settings'
import { About } from './components/About'

type View =
  | 'loading'
  | 'home'
  | 'exam'
  | 'quiz'
  | 'results'
  | 'history'
  | 'currentAffairs'
  | 'insights'
  | 'settings'
  | 'about'

const QUESTION_COUNT = { mock: 20, practice: 10, fullmock: 25 }
const NEGATIVE_MARK = 0.25 // banking-style penalty per wrong answer in mock mode
const SECONDS_PER_Q = 45 // timer budget per question in timed modes

type QuizMode = 'mock' | 'practice' | 'fullmock'
interface QuizParams {
  mode: QuizMode
  section: string | null
  difficulty: Difficulty | null
}
interface QuizContext {
  examId: string
  examName: string
  negativeMark: number
  timeLimitSec?: number
}

export default function App() {
  const online = useOnline()
  const { lang, setLang, t } = useT()
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('loading')

  const [exam, setExam] = useState<Exam | null>(null)
  const [bank, setBank] = useState<QuestionBank | null>(null)
  const [caDay, setCaDay] = useState<CurrentAffairsDay | null>(null)

  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
  const [quizParams, setQuizParams] = useState<QuizParams | null>(null)
  const [quizContext, setQuizContext] = useState<QuizContext | null>(null)
  const [quizReturn, setQuizReturn] = useState<View>('exam')
  const [quizStartedAt, setQuizStartedAt] = useState<number>(0)
  const [lastAttempt, setLastAttempt] = useState<Attempt | null>(null)

  useEffect(() => {
    // Load config first so the auto-approve switch is set before content loads.
    loadConfig()
      .then(async (c) => {
        setAutoApprove(c.autoApprove ?? false)
        setReportConfig(c.report)
        setConfig(c)
        setCaDay(await loadCurrentAffairs())
        setView('home')
      })
      .catch(() => setError('Could not load app data.'))
  }, [])

  async function pickExam(e: Exam) {
    setExam(e)
    setError(null)
    try {
      const b = await loadQuestionBank(e.id)
      setBank(b)
      setView('exam')
    } catch {
      setError(`Questions for ${e.name} are not available yet.`)
      setView('home')
    }
  }

  // Generic quiz launcher used by exams, current affairs and revision.
  function startQuiz(questions: Question[], params: QuizParams, ctx: QuizContext, returnTo: View) {
    if (questions.length === 0) return
    setQuizQuestions(questions)
    setQuizParams(params)
    setQuizContext(ctx)
    setQuizReturn(returnTo)
    setQuizStartedAt(Date.now())
    setView('quiz')
  }

  function startExamQuiz(params: QuizParams) {
    if (!bank || !exam) return
    const pool = bank.questions.filter(
      (q) =>
        (!params.section || q.section === params.section) &&
        (!params.difficulty || q.difficulty === params.difficulty),
    )
    const count = Math.min(QUESTION_COUNT[params.mode], pool.length)
    const picked = shuffle(pool).slice(0, count)
    const timed = params.mode === 'mock' || params.mode === 'fullmock'
    const ctx: QuizContext = {
      examId: exam.id,
      examName: exam.name,
      negativeMark: timed ? NEGATIVE_MARK : 0,
      timeLimitSec: timed ? picked.length * SECONDS_PER_Q : undefined,
    }
    startQuiz(picked, params, ctx, 'exam')
  }

  // Practice only the topics the student is currently weak in (for this exam).
  function startWeakPractice() {
    if (!bank || !exam) return
    const weak = new Set(weakTopics(getAttemptsForExam(exam.id)))
    const pool = bank.questions.filter((q) => weak.has(q.topic))
    if (pool.length === 0) return
    const picked = shuffle(pool).slice(0, QUESTION_COUNT.practice)
    startQuiz(
      picked,
      { mode: 'practice', section: null, difficulty: null },
      { examId: exam.id, examName: exam.name, negativeMark: 0 },
      'exam',
    )
  }

  // Practice the questions most likely to appear, by PYQ weightage.
  function startPredictedQuiz() {
    if (!bank || !exam) return
    const picked = predictedQuestions(bank.questions, QUESTION_COUNT.practice)
    startQuiz(
      picked,
      { mode: 'practice', section: null, difficulty: null },
      { examId: exam.id, examName: exam.name, negativeMark: 0 },
      'insights',
    )
  }

  function startCAQuiz() {
    if (!caDay || caDay.quiz.length === 0) return
    startQuiz(
      shuffle(caDay.quiz),
      { mode: 'practice', section: null, difficulty: null },
      { examId: 'current-affairs', examName: t('ca.title'), negativeMark: 0 },
      'currentAffairs',
    )
  }

  // Revise due mistakes (spaced repetition). `items` may span exams (global) or one exam.
  function startReview(items: ReviewItem[], returnTo: View) {
    if (items.length === 0) return
    const picked = shuffle(items.map((r) => r.question)).slice(0, QUESTION_COUNT.mock)
    startQuiz(
      picked,
      { mode: 'practice', section: null, difficulty: null },
      { examId: 'revision', examName: t('review.title'), negativeMark: 0 },
      returnTo,
    )
  }

  function finishQuiz(answers: AnswerRecord[]) {
    if (!quizContext || !quizParams) return
    const correctCount = answers.filter((a) => a.correct).length
    const attempt: Attempt = {
      id: makeId(),
      examId: quizContext.examId,
      examName: quizContext.examName,
      mode: quizParams.mode === 'practice' ? 'practice' : 'mock',
      section: quizParams.section,
      startedAt: quizStartedAt,
      finishedAt: Date.now(),
      total: answers.length,
      correctCount,
      answers,
      negativeMark: quizContext.negativeMark,
    }
    saveAttempt(attempt)

    // Feed the mistakes notebook + keep the daily streak alive.
    const qById = new Map(quizQuestions.map((q) => [q.id, q]))
    const graded = answers
      .map((a) => {
        const question = qById.get(a.questionId)
        return question ? { question, selected: a.selected, correct: a.correct } : null
      })
      .filter((x): x is { question: Question; selected: number | null; correct: boolean } => x !== null)
    recordQuizForReview(graded, quizContext.examId, quizContext.examName)
    markActiveToday()

    setLastAttempt(attempt)
    setView('results')
  }

  function retry() {
    if (!quizParams || !quizContext) return
    if (quizReturn === 'currentAffairs') startCAQuiz()
    else if (quizContext.examId === 'revision') startReview(dueReviews(), quizReturn)
    else startExamQuiz(quizParams)
  }

  function goBack() {
    if (view === 'history' || view === 'insights') setView('exam')
    else if (view === 'about') setView('settings')
    else if (view === 'exam' || view === 'currentAffairs' || view === 'settings') setView('home')
    else if (view === 'quiz' || view === 'results') setView(quizReturn)
  }

  const showBack = view !== 'home' && view !== 'loading'

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          {showBack && (
            <button className="icon-btn" aria-label={t('app.back')} onClick={goBack}>
              ←
            </button>
          )}
          <h1>🎯 {config?.appName ?? 'Aspirant'}</h1>
          <select
            className="lang-select"
            value={lang}
            onChange={(e) => setLang(e.target.value as LangCode)}
            aria-label="Language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <AccountButton />
          <button
            className="icon-btn"
            aria-label={t('settings.title')}
            onClick={() => setView('settings')}
          >
            ⚙
          </button>
          <span
            className={`net-dot ${online ? '' : 'offline'}`}
            title={online ? t('app.online') : t('app.offline')}
          />
        </div>
      </header>

      {error && (
        <div className="screen">
          <div className="card center" style={{ color: 'var(--bad)' }}>
            {error}
          </div>
        </div>
      )}

      {view === 'loading' && <div className="screen center muted">{t('app.loading')}</div>}

      {view === 'home' && config && (
        <Home
          exams={config.exams}
          tagline={config.tagline}
          hasCurrentAffairs={!!caDay}
          dueReviewCount={dueReviews().length}
          qotdPool={caDay?.quiz ?? []}
          onPick={pickExam}
          onOpenCurrentAffairs={() => setView('currentAffairs')}
          onRevise={() => startReview(dueReviews(), 'home')}
        />
      )}

      {view === 'exam' && exam && bank && (
        <ExamDetail
          exam={exam}
          bank={bank}
          dueReviewCount={dueReviewsForExam(exam.id).length}
          onStart={(mode, section, difficulty) => startExamQuiz({ mode, section, difficulty })}
          onViewHistory={() => setView('history')}
          onViewInsights={() => setView('insights')}
          onPracticeWeak={startWeakPractice}
          onRevise={() => startReview(dueReviewsForExam(exam.id), 'exam')}
        />
      )}

      {view === 'insights' && bank && (
        <Insights bank={bank} onPracticePredicted={startPredictedQuiz} />
      )}

      {view === 'currentAffairs' && <CurrentAffairs day={caDay} onTakeQuiz={startCAQuiz} />}

      {view === 'quiz' && quizParams && quizContext && quizParams.mode === 'fullmock' && (
        <ExamMock
          questions={quizQuestions}
          negativeMark={quizContext.negativeMark}
          timeLimitSec={quizContext.timeLimitSec}
          onFinish={finishQuiz}
        />
      )}

      {view === 'quiz' && quizParams && quizContext && quizParams.mode !== 'fullmock' && (
        <Quiz
          questions={quizQuestions}
          mode={quizParams.mode}
          negativeMark={quizContext.negativeMark}
          timeLimitSec={quizContext.timeLimitSec}
          onFinish={finishQuiz}
        />
      )}

      {view === 'results' && lastAttempt && (
        <Results
          attempt={lastAttempt}
          questions={quizQuestions}
          onRetry={retry}
          onHome={() => setView('home')}
        />
      )}

      {view === 'history' && exam && <History exam={exam} />}

      {view === 'settings' && <Settings onAbout={() => setView('about')} />}

      {view === 'about' && <About version={config?.version ?? '0.1.0'} />}

      {view === 'home' && <InstallPrompt />}

      <footer className="footer">
        <button className="footer-link" onClick={() => setView('about')}>
          {t('app.footer')}
        </button>
      </footer>
    </>
  )
}
