import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import type { ScorecardFormValues } from '../../_utils/scorecard-form';
import { ScorecardField } from './scorecard-field';

const PERIODS = [
  { value: 'hour', label: 'per hour' },
  { value: 'week', label: 'per week' },
  { value: 'bi-weekly', label: 'bi-weekly' },
  { value: 'month', label: 'per month' },
  { value: 'year', label: 'per year' },
] as const;

const STORED = /^\$([\d,]+(?:\.\d+)?)\/(hour|week|bi-weekly|month|year)$/;

/** "$5/hour" / "$1,500/month" — empty when there is no amount. */
function build(amount: string, period: string): string {
  const n = Number(amount);
  if (!amount || Number.isNaN(n)) return '';
  // Show cents as soon as any decimal is typed: "1500.5" -> "$1,500.50".
  const decimals = amount.split('.')[1] ? 2 : 0;
  const text = n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2,
  });
  return `$${text}/${period}`;
}

function parse(value: string) {
  const m = STORED.exec(value);
  return m
    ? { amount: m[1].replace(/,/g, ''), period: m[2] }
    : { amount: '', period: 'hour' };
}

/**
 * Amount + pay period, stored as one text value like "$25/hour" so the backend
 * field (and older free-text values) stay unchanged.
 */
export function CompensationField() {
  const { control } = useFormContext<ScorecardFormValues>();

  return (
    <Controller
      control={control}
      name="compensationExpectation"
      render={({ field }) => (
        <CompensationInputs
          value={field.value ?? ''}
          onChange={field.onChange}
        />
      )}
    />
  );
}

function CompensationInputs({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [amount, setAmount] = useState(() => parse(value).amount);
  const [period, setPeriod] = useState(() => parse(value).period);

  // Pick up external changes (form reset / edit load). Typing never trips
  // this: every keystroke updates local state and the form value together.
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    if (value !== build(amount, period)) {
      const p = parse(value);
      setAmount(p.amount);
      setPeriod(p.period);
    }
  }

  const legacy = value !== '' && !STORED.test(value);

  return (
    <ScorecardField
      label="Compensation expectation"
      hint={legacy ? `Previously entered: "${value}" — enter an amount to replace it.` : undefined}
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            $
          </span>
          <Input
            inputMode="decimal"
            placeholder="0"
            className="pl-6"
            value={amount}
            onChange={e => {
              const next = e.target.value.replace(/[^\d.]/g, '');
              // one decimal point at most
              const cleaned = next.replace(/^(\d*\.\d*).*$/, '$1');
              setAmount(cleaned);
              onChange(build(cleaned, period));
            }}
          />
        </div>
        <Select
          value={period}
          onValueChange={p => {
            setPeriod(p);
            onChange(build(amount, p));
          }}
        >
          <SelectTrigger className="w-32 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {PERIODS.map(p => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </ScorecardField>
  );
}
