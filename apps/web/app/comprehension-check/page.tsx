"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestJson } from "../components/api";

const questions = [
  {
    prompt: "How many rounds are in a Parcel Society season?",
    options: [["a", "3 rounds"], ["b", "7 rounds"], ["c", "10 rounds"]],
  },
  {
    prompt: "How many action points can you use each round?",
    options: [["a", "1"], ["b", "2"], ["c", "3"]],
  },
  {
    prompt: "What does productive investment do?",
    options: [["a", "It exits the game immediately"], ["b", "It builds productive capital for future output"], ["c", "It is a chat message"]],
  },
  {
    prompt: "Compared with informal contracts, formal contracts usually have...",
    options: [["a", "A fee and lower default risk"], ["b", "No fee and higher default risk"], ["c", "No target player"]],
  },
  {
    prompt: "What must happen before joining a research server?",
    options: [["a", "Choose a real-money payout"], ["b", "Send a chat message"], ["c", "Pass this comprehension check"]],
  },
] as const;

type Result = { passed: boolean; score: number; total: number };

export default function ComprehensionCheckPage() {
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const complete = answers.every(Boolean);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    if (!complete) {
      setError("Answer all 5 questions before submitting.");
      return;
    }
    setLoading(true);
    try {
      const data = await requestJson<Result>("/api/comprehension-check", {
        method: "POST",
        body: JSON.stringify({ answers }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit check.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-bold text-slate-950">Comprehension Check</h1>
        <p className="mt-3 text-slate-700">
          You must answer all 5 questions correctly before joining a research server.
        </p>
      </div>

      <form className="space-y-4" onSubmit={submit}>
        {questions.map((question, questionIndex) => (
          <fieldset className="rounded-2xl border border-slate-200 bg-white p-5" key={question.prompt}>
            <legend className="font-semibold text-slate-950">{questionIndex + 1}. {question.prompt}</legend>
            <div className="mt-4 space-y-2">
              {question.options.map(([value, label]) => (
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50" key={value}>
                  <input
                    checked={answers[questionIndex] === value}
                    className="h-4 w-4 accent-emerald-700"
                    name={`question-${questionIndex}`}
                    onChange={() => setAnswers((current) => current.map((answer, index) => index === questionIndex ? value : answer))}
                    type="radio"
                    value={value}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {result ? (
          <div className={`rounded-lg border p-4 text-sm ${result.passed ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
            {result.passed ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>You passed with {result.score}/{result.total}. You may now join a server.</p>
                <Link className="rounded-md bg-emerald-700 px-4 py-2 text-center font-semibold text-white" href="/join">Continue to Join</Link>
              </div>
            ) : (
              <p>You scored {result.score}/{result.total}. Review the tutorial notes, correct your answers, and retry.</p>
            )}
          </div>
        ) : null}

        <button
          className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={loading}
          type="submit"
        >
          {loading ? "Submitting..." : "Submit Check"}
        </button>
      </form>
    </section>
  );
}
