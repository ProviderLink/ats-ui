import { XIcon } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

export function SkillsInput({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
}) {
  const [input, setInput] = useState('');

  function addSkill(raw: string) {
    const trimmed = raw.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
    }
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(input);
    } else if (e.key === 'Backspace' && !input && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 p-2 rounded-md border bg-background min-h-9 cursor-text"
      onClick={() => document.getElementById('skills-input')?.focus()}
    >
      {skills.map(s => (
        <span
          key={s}
          className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded border border-border/60"
        >
          {s}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onChange(skills.filter(x => x !== s));
            }}
            className="text-muted-foreground/50 hover:text-destructive"
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <input
        id="skills-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input.trim()) addSkill(input);
        }}
        placeholder={skills.length === 0 ? 'Type skill + Enter or comma' : ''}
        className="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring rounded"
      />
    </div>
  );
}
