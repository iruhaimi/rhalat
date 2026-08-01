import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Globe, BarChart3, List, TrendingUp } from 'lucide-react';

interface Application {
  visa_type?: {
    country?: {
      name: string;
    };
  };
  status?: string;
}

interface CountryApplicationsChartProps {
  applications: Application[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(38, 92%, 50%)',
  'hsl(var(--destructive))',
  'hsl(340, 82%, 52%)',
  'hsl(160, 84%, 39%)',
  'hsl(280, 70%, 50%)',
  'hsl(20, 90%, 50%)',
];

export default function CountryApplicationsChart({ applications }: CountryApplicationsChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [showAll, setShowAll] = useState(false);

  const chartData = useMemo(() => {
    const countryCounts: Record<string, { total: number; approved: number; pending: number }> = {};
    
    applications.forEach(app => {
      const countryName = app.visa_type?.country?.name || 'غير محدد';
      if (!countryCounts[countryName]) {
        countryCounts[countryName] = { total: 0, approved: 0, pending: 0 };
      }
      countryCounts[countryName].total += 1;
      if (app.status === 'approved') {
        countryCounts[countryName].approved += 1;
      }
      if (['submitted', 'under_review', 'processing'].includes(app.status || '')) {
        countryCounts[countryName].pending += 1;
      }
    });
    
    return Object.entries(countryCounts)
      .map(([country, counts]) => ({
        country,
        ...counts,
        approvalRate: counts.total > 0 ? (counts.approved / counts.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [applications]);

  const displayData = showAll ? chartData : chartData.slice(0, 8);
  const maxCount = Math.max(...chartData.map(d => d.total));
  const totalApps = chartData.reduce((sum, d) => sum + d.total, 0);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          الطلبات حسب الدولة
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-normal">
            {chartData.length} دولة
          </Badge>
          <div className="flex bg-muted rounded-lg p-0.5">
            <Button
              variant={viewMode === 'chart' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('chart')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'chart' ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={displayData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-muted" opacity={0.5} />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="country" 
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={75}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium mb-2">{data.country}</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between gap-4">
                              <span>إجمالي:</span>
                              <span className="font-medium">{data.total} طلب</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-success">معتمدة:</span>
                              <span className="font-medium">{data.approved}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-warning">قيد المعالجة:</span>
                              <span className="font-medium">{data.pending}</span>
                            </div>
                            <div className="flex justify-between gap-4 pt-1 border-t">
                              <span>نسبة الطلبات المكتملة:</span>
                              <span className="font-medium">{data.approvalRate.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} className="cursor-pointer">
                  {displayData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {displayData.map((item, index) => (
              <div key={item.country} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{item.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {item.total}
                    </Badge>
                    <span className="text-xs text-muted-foreground w-12 text-left">
                      {((item.total / totalApps) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(item.total / maxCount) * 100} 
                    className="h-1.5 flex-1"
                  />
                  {item.approvalRate > 0 && (
                    <span className="text-xs text-success flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      {item.approvalRate.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {chartData.length > 8 && (
          <div className="mt-4 pt-3 border-t flex justify-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'عرض أقل' : `عرض الكل (${chartData.length})`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
