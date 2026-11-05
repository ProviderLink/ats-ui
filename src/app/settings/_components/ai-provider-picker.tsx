import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';
import { RadioGroup } from 'radix-ui';

type AiProvider = 'claude' | 'openai';

const ANTHROPIC_MARK =
  'M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z';

const OPENAI_MARK =
  'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z';

// Brand colours stay the same in light and dark themes. Class names are written
// out in full for Tailwind.
const PROVIDERS: {
  value: AiProvider;
  name: string;
  mark: string;
  card: string;
  tile: string;
  indicator: string;
}[] = [
  {
    // Anthropic: ivory, slate and clay.
    value: 'claude',
    name: 'Anthropic',
    mark: ANTHROPIC_MARK,
    card: 'border-[#E3DACC] bg-[#F0EEE6] text-[#141413] hover:border-[#D97757] data-[state=checked]:border-[#D97757] data-[state=checked]:ring-[#D97757]',
    tile: 'bg-[#D97757] text-[#FAF9F5]',
    indicator:
      'border-[#B0AEA5] group-data-[state=checked]:border-[#D97757] group-data-[state=checked]:bg-[#D97757] group-data-[state=checked]:text-[#FAF9F5]',
  },
  {
    // OpenAI: black and white, with its green as the accent.
    value: 'openai',
    name: 'OpenAI',
    mark: OPENAI_MARK,
    card: 'border-[#0D0D0D] bg-[#0D0D0D] text-white hover:border-[#10A37F] data-[state=checked]:border-[#10A37F] data-[state=checked]:ring-[#10A37F]',
    tile: 'bg-white text-[#0D0D0D]',
    indicator:
      'border-white/50 group-data-[state=checked]:border-[#10A37F] group-data-[state=checked]:bg-[#10A37F] group-data-[state=checked]:text-white',
  },
];

interface AiProviderPickerProps {
  value: AiProvider;
  onChange: (value: AiProvider) => void;
  disabled?: boolean;
  labelledBy: string;
}

/** The AI provider as two selectable cards, each with its logo and name. */
export function AiProviderPicker({
  value,
  onChange,
  disabled,
  labelledBy,
}: AiProviderPickerProps) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={v => onChange(v as AiProvider)}
      disabled={disabled}
      aria-labelledby={labelledBy}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {PROVIDERS.map(({ value: id, name, mark, card, tile, indicator }) => (
        <RadioGroup.Item
          key={id}
          value={id}
          className={cn(
            'group flex cursor-pointer items-center gap-3.5 rounded-xl border p-4 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:ring-2',
            card
          )}
        >
          <span
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-lg',
              tile
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
              aria-hidden
            >
              <path d={mark} />
            </svg>
          </span>
          <span className="min-w-0 flex-1 truncate text-base font-semibold">
            {name}
          </span>
          <span
            aria-hidden
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-full border',
              indicator
            )}
          >
            <CheckIcon className="hidden size-3.5 group-data-[state=checked]:block" />
          </span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
