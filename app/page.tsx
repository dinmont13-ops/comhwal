"use client";

import { useState } from "react";

/* ───────── 기본 구성 (여기만 고치면 화면에 반영돼요) ───────── */

const SUBJECTS = ["컴퓨터 일반", "스프레드시트 일반", "데이터베이스 일반"];
const QUESTIONS_PER_SUBJECT = 20;

type Exam = { id: string; label: string };

// 필기01회 ~ 필기10회
const ROUNDS: Exam[] = Array.from({ length: 10 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return { id: n, label: `필기${n}회` };
});
// 마지막 11번째 시험
const RANDOM_EXAM: Exam = { id: "random", label: "전체랜덤" };

// 푸는 방식
const MODES = [
  { id: "exam", name: "시험 모드", desc: "문제를 풀며 보기를 선택" },
  { id: "answer", name: "답안 모드", desc: "1번부터 끝번까지 정답을 바로 보여줌" },
  { id: "subject", name: "과목별 풀기", desc: "과목을 골라 해당 과목만 풀기" },
];

const MARKS = ["①", "②", "③", "④", "⑤"];

/* ───────── 문제 데이터 ───────── */

type Problem = {
  id: string;
  question: string;
  choices: string[];
  answer: number; // 1부터 시작하는 정답 번호
};

type Section = {
  title: string; // "1과목 컴퓨터 일반"
  start: number; // 이 과목 첫 문제의 화면 번호
  problems: Problem[];
};

// TODO: 지금은 화면 확인용 샘플 문제예요. 진짜 문제 데이터가 생기면 이 함수만 바꾸면 돼요.
// roundId 회차의 subjectIdx 과목 문제를 돌려줍니다.
function getRoundSubject(roundId: string, subjectIdx: number): Problem[] {
  return Array.from({ length: QUESTIONS_PER_SUBJECT }, (_, i) => {
    const n = i + 1;
    return {
      id: `${roundId}-${subjectIdx}-${n}`,
      question: `[필기${roundId}회 ${subjectIdx + 1}과목] 샘플 문제 ${n}`,
      choices: ["보기 A", "보기 B", "보기 C", "보기 D"],
      answer: (n % 4) + 1,
    };
  });
}

/* ───────── 섞기 ───────── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 보기 순서를 섞고, 바뀐 위치에 맞춰 정답 번호도 같이 바꿔요.
function shuffleChoices(p: Problem): Problem {
  const order = shuffle(p.choices.map((c, i) => ({ c, correct: i + 1 === p.answer })));
  return {
    ...p,
    choices: order.map((o) => o.c),
    answer: order.findIndex((o) => o.correct) + 1,
  };
}

// 과목 구분은 그대로 두고, 섞기는 과목 안에서만 해요.
function buildSections(
  examId: string,
  randomize: boolean,
  onlySubject: number | null
): Section[] {
  const indexes =
    onlySubject === null ? SUBJECTS.map((_, i) => i) : [onlySubject];

  let counter = 1;
  return indexes.map((si) => {
    // 전체랜덤: 10회 전체에서 같은 과목 문제만 모아 무작위로 뽑음
    let problems =
      examId === "random"
        ? shuffle(ROUNDS.flatMap((r) => getRoundSubject(r.id, si))).slice(
            0,
            QUESTIONS_PER_SUBJECT
          )
        : getRoundSubject(examId, si);

    if (randomize) {
      problems = shuffle(problems).map(shuffleChoices);
    }

    const section: Section = {
      title: `${si + 1}과목 ${SUBJECTS[si]}`,
      start: counter,
      problems,
    };
    counter += problems.length;
    return section;
  });
}

/* ───────── 스타일 ───────── */

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";

function boxClass(active: boolean) {
  return `rounded-lg border p-4 text-left transition-colors ${focus} ${
    active
      ? "border-teal-700 bg-teal-50 ring-1 ring-teal-700"
      : "border-stone-300 bg-white hover:bg-stone-100"
  }`;
}

/* ───────── 화면 ───────── */

export default function Home() {
  const [screen, setScreen] = useState<"main" | "quiz">("main");
  const [examId, setExamId] = useState<string | null>(null);
  const [modeId, setModeId] = useState<string | null>(null);
  const [subjectIdx, setSubjectIdx] = useState<number | null>(null);
  const [randomize, setRandomize] = useState(false);

  const [sections, setSections] = useState<Section[]>([]);
  const [picked, setPicked] = useState<Record<string, number>>({});

  const exam = [...ROUNDS, RANDOM_EXAM].find((e) => e.id === examId);
  const mode = MODES.find((m) => m.id === modeId);
  const needSubject = modeId === "subject";
  const ready = Boolean(exam && mode && (!needSubject || subjectIdx !== null));

  const totalPerRound = SUBJECTS.length * QUESTIONS_PER_SUBJECT;

  function startQuiz() {
    if (!exam || !mode) return;
    setSections(
      buildSections(exam.id, randomize, needSubject ? subjectIdx : null)
    );
    setPicked({});
    setScreen("quiz");
    window.scrollTo({ top: 0 });
  }

  /* ───── 문제풀이 화면 ───── */
  if (screen === "quiz" && exam && mode) {
    const answerMode = modeId === "answer";
    const count = sections.reduce((s, sec) => s + sec.problems.length, 0);

    return (
      <main className="min-h-screen bg-stone-50 text-stone-900">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
          <button
            onClick={() => setScreen("main")}
            className={`text-sm text-stone-600 underline underline-offset-2 hover:text-stone-900 ${focus}`}
          >
            메인으로
          </button>

          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            {exam.label} · {mode.name}
          </h1>
          <p className="mt-1 text-stone-600">
            총 {count}문제
            {randomize && " · 순서 랜덤(과목 안에서만)"}
          </p>

          {sections.map((sec) => (
            <section key={sec.title} className="mt-10">
              <h2 className="border-b-2 border-teal-700 pb-2 text-xl font-bold">
                {sec.title}
              </h2>

              <ol className="mt-4 space-y-4">
                {sec.problems.map((p, j) => {
                  const num = sec.start + j;
                  return (
                    <li
                      key={p.id}
                      className="rounded-lg border border-stone-200 bg-white p-4"
                    >
                      <p className="whitespace-pre-wrap font-medium leading-relaxed">
                        <span className="mr-2 text-teal-800">{num}.</span>
                        {p.question}
                      </p>

                      <ul className="mt-3 space-y-1.5">
                        {p.choices.map((c, i) => {
                          const n = i + 1;
                          const isAnswer = n === p.answer;

                          if (answerMode) {
                            return (
                              <li
                                key={i}
                                className={`flex gap-2 rounded-md px-3 py-2 ${
                                  isAnswer
                                    ? "bg-teal-50 font-medium text-teal-900 ring-1 ring-teal-700"
                                    : "text-stone-700"
                                }`}
                              >
                                <span>{MARKS[i]}</span>
                                <span className="whitespace-pre-wrap">{c}</span>
                                {isAnswer && (
                                  <span className="ml-auto text-sm">정답</span>
                                )}
                              </li>
                            );
                          }

                          const on = picked[p.id] === n;
                          return (
                            <li key={i}>
                              <button
                                aria-pressed={on}
                                onClick={() =>
                                  setPicked((prev) => ({ ...prev, [p.id]: n }))
                                }
                                className={`flex w-full gap-2 rounded-md border px-3 py-2 text-left transition-colors ${focus} ${
                                  on
                                    ? "border-teal-700 bg-teal-50"
                                    : "border-transparent hover:bg-stone-100"
                                }`}
                              >
                                <span>{MARKS[i]}</span>
                                <span className="whitespace-pre-wrap">{c}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </main>
    );
  }

  /* ───── 메인 화면 ───── */
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <h1 className="text-2xl font-bold tracking-tight">컴퓨터활용능력 필기</h1>
        <p className="mt-2 text-stone-600">
          회차당 {SUBJECTS.length}과목, 과목당 {QUESTIONS_PER_SUBJECT}문제
          (총 {totalPerRound}문제)
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 text-sm text-stone-500">
          {SUBJECTS.map((s, i) => (
            <li key={s}>
              {i + 1}과목 {s}
            </li>
          ))}
        </ul>

        {/* 1. 시험 선택 */}
        <section className="mt-10" aria-labelledby="exam-title">
          <h2 id="exam-title" className="text-lg font-semibold">
            시험 선택
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {ROUNDS.map((r) => (
              <button
                key={r.id}
                aria-pressed={examId === r.id}
                onClick={() => setExamId(r.id)}
                className={`${boxClass(examId === r.id)} font-medium`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            aria-pressed={examId === RANDOM_EXAM.id}
            onClick={() => setExamId(RANDOM_EXAM.id)}
            className={`${boxClass(examId === RANDOM_EXAM.id)} mt-2 w-full`}
          >
            <span className="font-medium">{RANDOM_EXAM.label}</span>
            <span className="ml-2 text-sm text-stone-500">
              10회 전체에서 과목별로 랜덤 출제
            </span>
          </button>
        </section>

        {/* 2. 푸는 방식 선택 */}
        <section className="mt-10" aria-labelledby="mode-title">
          <h2 id="mode-title" className="text-lg font-semibold">
            푸는 방식
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {MODES.map((m) => (
              <button
                key={m.id}
                aria-pressed={modeId === m.id}
                onClick={() => setModeId(m.id)}
                className={boxClass(modeId === m.id)}
              >
                <span className="block font-medium">{m.name}</span>
                <span className="mt-1 block text-sm text-stone-500">
                  {m.desc}
                </span>
              </button>
            ))}
          </div>

          {needSubject && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-stone-700">과목 선택</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {SUBJECTS.map((s, i) => (
                  <button
                    key={s}
                    aria-pressed={subjectIdx === i}
                    onClick={() => setSubjectIdx(i)}
                    className={boxClass(subjectIdx === i)}
                  >
                    {i + 1}과목 {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 3. 옵션 */}
        <section className="mt-10" aria-labelledby="opt-title">
          <h2 id="opt-title" className="text-lg font-semibold">
            옵션
          </h2>
          <label
            className={`mt-3 flex cursor-pointer items-start gap-3 rounded-lg border border-stone-300 bg-white p-4 ${focus}`}
          >
            <input
              type="checkbox"
              checked={randomize}
              onChange={(e) => setRandomize(e.target.checked)}
              className="mt-1 size-4 accent-teal-700"
            />
            <span>
              <span className="block font-medium">순서 랜덤</span>
              <span className="mt-1 block text-sm text-stone-500">
                문제 순서와 보기 순서를 섞어요. 섞기는 각 과목 안에서만
                적용되고 과목 구분은 그대로 유지돼요.
              </span>
            </span>
          </label>
        </section>

        {/* 4. 시작 */}
        <section className="mt-10 border-t border-stone-200 pt-6">
          <p className="text-sm text-stone-600" role="status">
            {ready
              ? `${exam!.label} · ${mode!.name}${
                  needSubject ? ` · ${subjectIdx! + 1}과목` : ""
                }${randomize ? " · 순서 랜덤" : ""}`
              : needSubject && exam && subjectIdx === null
                ? "과목을 선택해 주세요."
                : "시험과 푸는 방식을 선택해 주세요."}
          </p>
          <button
            disabled={!ready}
            onClick={startQuiz}
            className={`mt-3 w-full rounded-lg bg-teal-700 px-4 py-3 font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-10 ${focus}`}
          >
            문제풀기
          </button>
        </section>
      </div>
    </main>
  );
}
