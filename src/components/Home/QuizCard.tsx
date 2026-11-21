'use client'

import React, { useState } from 'react'
import { Check, Flame, Star, X, Zap } from 'lucide-react'

const QUESTIONS = [
  { q: 'What is 10% of 50?', options: ['5', '10', '50'], answer: 0 },
  { q: 'What is 50% of 30?', options: ['15', '20', '30'], answer: 0 },
  { q: 'What is 25% of 80?', options: ['16', '20', '25'], answer: 1 },
  { q: 'What is 75% of 40?', options: ['25', '30', '35'], answer: 1 },
  { q: 'What is 20% of 150?', options: ['20', '30', '40'], answer: 1 },
]

export function QuizCard() {
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)

  const done = step >= QUESTIONS.length
  const current = QUESTIONS[step]

  const choose = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    if (i === current.answer) setScore((s) => s + 1)
    setTimeout(() => {
      setPicked(null)
      setStep((s) => s + 1)
    }, 900)
  }

  const reset = () => {
    setStep(0)
    setScore(0)
    setPicked(null)
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl p-6 md:p-8">
      {!done ? (
        <>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-neutral-500">
            <span>
              Question {step + 1} of {QUESTIONS.length}
            </span>
            <span>{score} correct</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-black dark:bg-white transition-all"
              style={{ width: `${(step / QUESTIONS.length) * 100}%` }}
            />
          </div>

          <h3 className="mt-6 text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
            {current.q}
          </h3>

          <div className="mt-5 grid grid-cols-1 gap-3">
            {current.options.map((opt, i) => {
              const isAnswer = picked !== null && i === current.answer
              const isWrong = picked === i && i !== current.answer
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => choose(i)}
                  className={[
                    'flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-lg font-semibold transition-colors',
                    isAnswer
                      ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                      : isWrong
                        ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white hover:border-black dark:hover:border-white',
                  ].join(' ')}
                >
                  <span>{opt}</span>
                  {isAnswer && <Check size={18} />}
                  {isWrong && <X size={18} />}
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Lesson complete
          </p>
          <div className="mt-4 flex justify-center gap-1 text-amber-400">
            {[0, 1, 2].map((i) => (
              <Star
                key={i}
                size={32}
                fill={i < Math.ceil((score / QUESTIONS.length) * 3) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-4">
              <Zap className="mx-auto text-amber-500" size={22} />
              <p className="mt-1 text-xl font-black text-neutral-900 dark:text-white">
                +{score * 10} XP
              </p>
            </div>
            <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-4">
              <Flame className="mx-auto text-orange-500" size={22} />
              <p className="mt-1 text-xl font-black text-neutral-900 dark:text-white">
                12 day streak
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="mt-6 w-full rounded-full bg-black px-6 py-3 font-semibold text-white dark:bg-white dark:text-black"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
