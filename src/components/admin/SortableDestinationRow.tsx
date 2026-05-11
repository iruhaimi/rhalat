import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TableCell, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';

interface HeroDestination {
  id: string;
  name: string;
  name_en: string | null;
  country: string;
  country_en: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SortableDestinationRowProps {
  destination: HeroDestination;
  index: number;
  onEdit: (dest: HeroDestination) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, is_active: boolean) => void;
}

export function SortableDestinationRow({
  destination,
  index,
  onEdit,
  onDelete,
  onToggleActive,
}: SortableDestinationRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: destination.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={`h-16 ${isDragging ? 'bg-muted' : ''}`}>
      <TableCell className="align-middle">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="w-6 text-center font-medium">{index + 1}</span>
        </div>
      </TableCell>
      <TableCell className="align-middle">
        <img
          src={destination.image_url}
          alt={destination.name}
          className="h-8 w-12 object-cover rounded border"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
      </TableCell>
      <TableCell className="align-middle font-medium">{destination.name}</TableCell>
      <TableCell className="align-middle">
        <Badge variant="outline" className="font-mono">{destination.country}</Badge>
      </TableCell>
      <TableCell className="align-middle">
        <div className="flex items-center gap-2">
          <Switch
            checked={destination.is_active}
            onCheckedChange={(checked) => onToggleActive(destination.id, checked)}
          />
          {destination.is_active ? (
            <Eye className="h-4 w-4 text-green-600" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </TableCell>
      <TableCell className="align-middle">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(destination)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => {
              if (confirm('هل أنت متأكد من حذف هذه الوجهة؟')) {
                onDelete(destination.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
