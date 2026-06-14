import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Clock } from 'lucide-react';
import {
  DAY_ORDER,
  DAY_LABELS_AR,
  type DayKey,
  type WeekSchedule,
  parseWorkingHours,
  formatWorkingHours,
} from '@/lib/workingHours';

interface Props {
  open: boolean;
  initialValue: string | null | undefined;
  saving?: boolean;
  onClose: () => void;
  onSave: (value: string, valueEn: string) => void;
}

function defaultSchedule(): WeekSchedule {
  const s: WeekSchedule = {};
  for (const d of DAY_ORDER) s[d] = { open: '10:00', close: '22:00' };
  return s;
}

export default function WorkingHoursEditor({ open, initialValue, saving, onClose, onSave }: Props) {
  const [schedule, setSchedule] = useState<WeekSchedule>(defaultSchedule());

  useEffect(() => {
    if (!open) return;
    const parsed = parseWorkingHours(initialValue);
    setSchedule(parsed && Object.keys(parsed).length > 0 ? parsed : defaultSchedule());
  }, [open, initialValue]);

  const toggleDay = (day: DayKey, isOpen: boolean) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: isOpen ? { open: '10:00', close: '22:00' } : { closed: true },
    }));
  };

  const updateTime = (day: DayKey, field: 'open' | 'close', value: string) => {
    setSchedule((prev) => {
      const cur = prev[day];
      const base = cur && !('closed' in cur && cur.closed)
        ? (cur as { open: string; close: string })
        : { open: '10:00', close: '22:00' };
      return { ...prev, [day]: { ...base, [field]: value } };
    });
  };

  const handleSave = () => {
    const valueAr = formatWorkingHours(schedule, 'ar').join(' • ');
    const valueEn = formatWorkingHours(schedule, 'en').join(' • ');
    // Store JSON in value (parsed on read), keep a readable EN summary.
    onSave(JSON.stringify(schedule), valueEn || valueAr);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            تعديل ساعات العمل
          </DialogTitle>
          <DialogDescription>
            حدّد ساعات العمل لكل يوم، أو أغلق الأيام التي لا تعملون فيها.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {DAY_ORDER.map((day) => {
            const cur = schedule[day];
            const isOpen = !!cur && !('closed' in cur && cur.closed);
            return (
              <div
                key={day}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex items-center gap-3 min-w-[110px]">
                  <Switch checked={isOpen} onCheckedChange={(c) => toggleDay(day, c)} />
                  <Label className="font-medium">{DAY_LABELS_AR[day]}</Label>
                </div>
                {isOpen ? (
                  <div className="flex items-center gap-2" dir="ltr">
                    <Input
                      type="time"
                      value={(cur as { open: string }).open}
                      onChange={(e) => updateTime(day, 'open', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">—</span>
                    <Input
                      type="time"
                      value={(cur as { close: string }).close}
                      onChange={(e) => updateTime(day, 'close', e.target.value)}
                      className="w-32"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">مغلق</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
          {formatWorkingHours(schedule, 'ar').map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}