import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/store';
import { BotIcon, CheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings?.ai) {
      setProvider(settings.ai.provider);
      setResumeValidation(settings.ai.resumeValidation);
      setCandidateScoring(settings.ai.candidateScoring);
      setResumeParsing(settings.ai.resumeParsing);
    }
  }, [settings?.ai]);

  async function handleSave() {
    if (!settings) return;
    try {
      await update({
        ai: { provider, resumeValidation, candidateScoring, resumeParsing },
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
          <BotIcon className="size-4 text-muted-foreground" />
          AI Settings
        </CardTitle>
        <CardDescription>
          Control AI-powered features for resume processing and candidate
          evaluation
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Provider */}
        <div className="flex flex-col gap-1.5 rounded-lg border px-4 py-3">
          <Label htmlFor="ai-provider">AI Provider</Label>
          <Select
            value={provider}
            onValueChange={v => setProvider(v as 'claude' | 'openai')}
            disabled={loading || !settings}
          >
            <SelectTrigger id="ai-provider" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude">Anthropic Claude</SelectItem>
              <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            All AI features will use this provider. Set the corresponding API
            key in your environment.
          </p>
        </div>
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
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
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
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
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
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
    </Card>
  );
}
