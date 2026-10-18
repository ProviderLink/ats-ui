import type { PipelineTemplate, StageShape } from '@/store/types';
import { useEffect, useState } from 'react';

const NEW_STAGE_COLOR = '#6366f1';
let stageCounter = 100;

export interface PipelineTemplateFormData {
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  stages: StageShape[];
}

export function usePipelineTemplateForm(
  open: boolean,
  template?: PipelineTemplate
) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [stages, setStages] = useState<StageShape[]>([]);

  useEffect(() => {
    if (open) {
      setName(template?.name ?? '');
      setDescription(template?.description ?? '');
      setIsDefault(template?.isDefault ?? false);
      setIsActive(template?.isActive ?? true);
      setStages(template?.stages ? [...template.stages] : []);
    }
  }, [open, template]);

  // A default must be active (the server enforces this), so turning default
  // on also activates the template.
  function changeDefault(value: boolean) {
    setIsDefault(value);
    if (value) setIsActive(true);
  }

  function addStage() {
    stageCounter++;
    setStages(prev => [
      ...prev,
      {
        _id: `new-${stageCounter}`,
        name: '',
        color: NEW_STAGE_COLOR,
        order: prev.length + 1,
        isActive: true,
        icon: 'FileText',
      },
    ]);
  }

  function removeStage(id: string) {
    setStages(prev =>
      prev.filter(s => s._id !== id).map((s, i) => ({ ...s, order: i + 1 }))
    );
  }

  function updateStage(id: string, patch: Partial<StageShape>) {
    setStages(prev => prev.map(s => (s._id === id ? { ...s, ...patch } : s)));
  }

  function getData(): PipelineTemplateFormData | null {
    if (!name.trim()) return null;
    return {
      name: name.trim(),
      description: description.trim(),
      isDefault,
      isActive,
      stages,
    };
  }

  return {
    name,
    setName,
    description,
    setDescription,
    isDefault,
    isActive,
    setIsActive,
    stages,
    changeDefault,
    addStage,
    removeStage,
    updateStage,
    getData,
  };
}
