import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { User as UserIcon, MoreHorizontal, Shield, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AppRole } from '@/types/database';
import { AdminTable, AdminTableBody, AdminTableRow, AdminTableCell } from './AdminTable';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  nationality: string | null;
  created_at: string;
  roles: AppRole[];
}

interface CustomersTableProps {
  users: UserWithRole[];
  onViewProfile: (user: UserWithRole) => void;
  onAddRole: (user: UserWithRole) => void;
  isAdmin: boolean;
}

export function CustomersTable({
  users,
  onViewProfile,
  onAddRole,
  isAdmin,
}: CustomersTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        لا يوجد عملاء مطابقين للبحث
      </div>
    );
  }

  return (
    <AdminTable
      minWidth="900px"
      columns={[
        { width: '280px', label: 'العميل' },
        { width: '160px', label: 'رقم الجوال' },
        { width: '160px', label: 'الجنسية' },
        { width: '160px', label: 'تاريخ التسجيل' },
        { width: '80px', label: 'إجراءات' },
      ]}
    >
      <AdminTableBody>
          {users.map((userItem) => (
            <AdminTableRow key={userItem.id} className="group h-[68px]">
              <AdminTableCell className="align-middle">
                <div className="flex items-center gap-3 min-h-[40px] min-w-0">
                  <button 
                    onClick={() => onViewProfile(userItem)}
                    className="h-10 w-10 flex-shrink-0 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer"
                    title="عرض الملف الشخصي"
                  >
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <div className="min-w-0">
                    <button 
                      onClick={() => onViewProfile(userItem)}
                      className="font-medium hover:text-primary transition-colors cursor-pointer text-right block truncate w-full"
                    >
                      {userItem.full_name || 'غير محدد'}
                    </button>
                    <p className="text-xs text-muted-foreground">{userItem.user_id.slice(0, 8)}...</p>
                  </div>
                </div>
              </AdminTableCell>
              <AdminTableCell dir="ltr" className="text-right align-middle text-sm tabular-nums">{userItem.phone || '-'}</AdminTableCell>
              <AdminTableCell className="align-middle text-sm truncate">{userItem.nationality || '-'}</AdminTableCell>
              <AdminTableCell className="align-middle text-sm whitespace-nowrap">
                {format(new Date(userItem.created_at), 'dd MMM yyyy', { locale: ar })}
              </AdminTableCell>
              <AdminTableCell className="align-middle">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onViewProfile(userItem)}>
                      <UserCog className="h-4 w-4 ml-2" />
                      عرض وتعديل الملف
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onAddRole(userItem)}>
                          <Shield className="h-4 w-4 ml-2" />
                          ترقية لموظف
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </AdminTableCell>
            </AdminTableRow>
          ))}
      </AdminTableBody>
    </AdminTable>
  );
}
