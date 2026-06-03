import { NavLink } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Calendar,
  CalendarCheck,
  UserPlus,
  Map,
  Mail,
  LogOut,
} from "lucide-react";

const navLinks = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/plans/create", label: "New Plan", icon: Calendar },
  { to: "/plans/created", label: "My Plans", icon: CalendarCheck },
  { to: "/plans/invited", label: "Invited Plans", icon: UserPlus },
  { to: "/map", label: "Map", icon: Map },
  { to: "/invitations", label: "Invitations", icon: Mail },
];

interface SideSheetNavProps {
  userName?: string;
  userEmail?: string;
  onLinkClick: () => void;
  onSignOut: () => void;
}

export function SideSheetNav({
  userName,
  userEmail,
  onLinkClick,
  onSignOut,
}: SideSheetNavProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-5">
        <Avatar className="size-10">
          <AvatarFallback>{userName?.charAt(0) ?? "?"}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">
            {userName}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {userEmail}
          </span>
        </div>
      </div>

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onLinkClick}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-l-2 border-l-primary bg-muted pl-[10px] text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={onSignOut}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
