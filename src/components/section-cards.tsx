import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

type CardData = {
  title: string;
  value: string;
  badge: string;
  trend: 'up' | 'down';
  trendText: string;
  description: string;
};

const cards: CardData[] = [
  {
    title: 'Total Revenue',
    value: '$1,250.00',
    badge: '+12.5%',
    trend: 'up',
    trendText: 'Trending up this month',
    description: 'Visitors for the last 6 months',
  },
  {
    title: 'New Customers',
    value: '1,234',
    badge: '-20%',
    trend: 'down',
    trendText: 'Down 20% this period',
    description: 'Acquisition needs attention',
  },
  {
    title: 'Active Accounts',
    value: '45,678',
    badge: '+12.5%',
    trend: 'up',
    trendText: 'Strong user retention',
    description: 'Engagement exceed targets',
  },
  {
    title: 'Growth Rate',
    value: '4.5%',
    badge: '+4.5%',
    trend: 'up',
    trendText: 'Steady performance increase',
    description: 'Meets growth projections',
  },
];

function MetricCard({
  title,
  value,
  badge,
  trend,
  trendText,
  description,
}: CardData) {
  const TrendIcon = trend === 'up' ? TrendingUpIcon : TrendingDownIcon;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <TrendIcon />
            {badge}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {trendText} <TrendIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">{description}</div>
      </CardFooter>
    </Card>
  );
}

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {cards.map(card => (
        <MetricCard key={card.title} {...card} />
      ))}
    </div>
  );
}
