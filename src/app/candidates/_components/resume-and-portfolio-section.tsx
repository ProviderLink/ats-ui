import { PortfolioSection } from '@/components/portfolio-section';
import { ResumeViewer } from '@/components/resume-viewer';
import type { Candidate } from '@/store/types';
import { VideoIcon } from 'lucide-react';
import { IntroVideo } from './intro-video';
import { SectionLabel } from './section-label';

export function ResumeAndPortfolioSection({ candidate: c }: { candidate: Candidate }) {
  return (
    <>
      <div className="flex flex-col gap-3">
        <SectionLabel>Resume & Intro Video</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
          <ResumeViewer
            url={c.resumeUrl}
            filename={c.resumeOriginalName}
          />
          {c.videoIntroUrl ? (
            <IntroVideo
              url={c.videoIntroUrl}
              source={c.videoIntroSource}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-muted/20 h-96 p-4 text-center">
              <VideoIcon className="size-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                No intro video available.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio — always shown so an absent portfolio is visible */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Portfolio</SectionLabel>
        <PortfolioSection
          url={c.portfolioUrl}
          fileUrl={c.portfolioFileUrl}
          fileName={c.portfolioFileName}
        />
      </div>
    </>
  );
}
