// apps/docs/src/components/Playground.tsx
'use client';

import { useState } from 'react';

const DEFAULT = `/**
 * Welcome to the NeatSuite Playground!
 * Write any JS with a function named main() that returns a value.
 * We'll call main() and print the result as JSON.
 */
function main() {
  return { message: "You did it! This is a fake response from the demo." };
}
`;

export default function Playground() {
  const [code, setCode] = useState(DEFAULT);
  const [out, setOut] = useState('Your results will appear here!');
  const [err, setErr] = useState('');
  const [running, setRunning] = useState(false);

  const run = () => {
    setErr('');
    setRunning(true);
    try {
      const wrapped = `"use strict";
        let __res;
        (function(){
          ${code}
          if (typeof main !== 'function') {
            throw new Error("Define main() so we can run it.");
          }
          __res = main();
        })();
        return __res;`;
      // WARNING: local demo only; do not expose to untrusted users.
      const fn = new Function(wrapped);
      const res = fn();
      setOut(JSON.stringify(res, null, 2));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="grid min-h-[70vh] gap-4 lg:grid-cols-2">
      {/* LEFT: editor */}
      <div className="flex min-w-0 flex-col">
        <h2 className="mb-2 text-lg font-semibold">Code</h2>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="min-h-[360px] flex-1 w-full rounded-lg border border-zinc-200 p-3 font-mono text-sm leading-6 dark:border-white/10"
        />
      </div>

      {/* RIGHT: run + output */}
      <div className="flex w-full max-w-full flex-col gap-3 lg:pl-2">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Runner</div>
          <button
            onClick={run}
            disabled={running}
            className="rounded-lg border border-zinc-900/80 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20"
          >
            {running ? 'Running…' : 'RUN'}
          </button>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Demo only — we call <code className="font-mono">main()</code> and print the return value. No network calls.
        </p>

        <div className="font-semibold">Output</div>
        <pre className="min-h-[240px] flex-1 overflow-auto rounded-lg bg-zinc-950 p-3 text-sm leading-6 text-zinc-100 dark:bg-black">
{err ? `Error: ${err}` : out}
        </pre>
      </div>
    </div>
  );
}
