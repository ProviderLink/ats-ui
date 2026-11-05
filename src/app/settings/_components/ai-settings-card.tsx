import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/store';
import { BotIcon, CheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AiProviderPicker } from './ai-provider-picker';

export function AiSettingsCard() {
  const settings = useSettingsStore(s => s.settings);
  const loading = useSettingsStore(s => s.loading);
  const mutating = useSettingsStore(s => s.mutating);
  const update = useSettingsStore(s => s.update);
  const [provider, setProvider] = useState(
    settings?.ai.provider ?? 'claude'
  );
  const [resumeValidation, setResumeValidation] = useState(
    settings?.ai.resumeValidation ?? true
  );
  const [candidateScoring, setCandidateScoring] = useState(
    settings?.ai.candidateScoring ?? true
  );
  const [resumeParsing, setResumeParsing] = useState(
    settings?.ai.resumeParsing ?? true
  );
  const [reviewWorkText, setReviewWorkText] = useState(
    settings?.ai.reviewWorkText ?? false
  );
  const [saved, setSaved] = useState(false);
  // The radio stays on the current provider until the switch is confirmed.
  const [switchTo, setSwitchTo] = useState(provider);
  const [confirmSwitch, setConfirmSwitch] = useState(false);
  const switchToName = switchTo === 'openai' ? 'OpenAI' : 'Anthropic';

  useEffect(() => {
    if (settings?.ai) {
      setProvider(settings.ai.provider);
      setResumeValidation(settings.ai.resumeValidation);
      setCandidateScoring(settings.ai.candidateScoring);
      setResumeParsing(settings.ai.resumeParsing);
      setReviewWorkText(settings.ai.reviewWorkText ?? false);
    }
  }, [settings?.ai]);

  async function handleSave() {
    if (!settings) return;
    try {
      await update({
        ai: {
          provider,
          resumeValidation,
          candidateScoring,
          resumeParsing,
          reviewWorkText,
        },
      });
      toast.success('AI settings saved');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save AI settings');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BotIcon className="size-4 text-pine-teal-700 dark:text-muted-foreground" />
          AI Settings
        </CardTitle>
        <CardDescription>
          Control AI-powered features for resume processing and candidate
          evaluation
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Provider */}
        <div className="flex flex-col gap-3 rounded-lg border border-gray-300 bg-gray-50 px-4 py-4 dark:border-border dark:bg-transparent">
          <div>
            <p id="ai-provider" className="text-sm font-semibold">
              AI Provider
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              All AI features will use this provider. Set the corresponding API
              key in your environment.
            </p>
          </div>
          <AiProviderPicker
            value={provider}
            onChange={next => {
              setSwitchTo(next);
              setConfirmSwitch(true);
            }}
            disabled={loading || !settings}
            labelledBy="ai-provider"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 dark:border-border dark:bg-transparent">
          <div>
            <p className="text-sm font-medium">Resume validation</p>
            <p className="text-xs text-muted-foreground">
              Automatically validate resumes against job requirements
            </p>
          </div>
          <Switch
            checked={resumeValidation}
            onCheckedChange={setResumeValidation}
            disabled={loading || !settings}
            aria-label="Resume validation"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 dark:border-border dark:bg-transparent">
          <div>
            <p className="text-sm font-medium">Candidate scoring</p>
            <p className="text-xs text-muted-foreground">
              AI-powered fit scoring and recommendations for each application
            </p>
          </div>
          <Switch
            checked={candidateScoring}
            onCheckedChange={setCandidateScoring}
            disabled={loading || !settings}
            aria-label="Candidate scoring"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 dark:border-border dark:bg-transparent">
          <div>
            <p className="text-sm font-medium">Resume parsing</p>
            <p className="text-xs text-muted-foreground">
              AI-powered extraction of structured data from uploaded resumes
              (skills, experience, education)
            </p>
          </div>
          <Switch
            checked={resumeParsing}
            onCheckedChange={setResumeParsing}
            disabled={loading || !settings}
            aria-label="Resume parsing"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 dark:border-border dark:bg-transparent">
          <div>
            <p className="text-sm font-medium">Work text in AI reviews</p>
            <p className="text-xs text-muted-foreground">
              Send what VAs write in daily reports to the AI when drafting
              performance reviews. Turn on only once your AI provider agreement
              covers patient data. Hours and task counts are always used.
            </p>
          </div>
          <Switch
            checked={reviewWorkText}
            onCheckedChange={setReviewWorkText}
            disabled={loading || !settings}
            aria-label="Work text in AI reviews"
          />
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleSave}
            disabled={mutating || !settings}
          >
            {saved ? <CheckIcon className="size-3.5" /> : null}
            {saved ? 'Saved' : mutating ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </CardContent>
      <ConfirmDialog
        open={confirmSwitch}
        onOpenChange={setConfirmSwitch}
        title={`Switch AI provider to ${switchToName}?`}
        description={`After you save, all AI features will use ${switchToName}. Make sure its API key is set in your environment, or they will stop working.`}
        confirmLabel={`Switch to ${switchToName}`}
        onConfirm={() => {
          setProvider(switchTo);
          setConfirmSwitch(false);
        }}
      />
    </Card>
  );
}
