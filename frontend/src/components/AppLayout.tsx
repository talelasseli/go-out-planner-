import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu, Settings, LogOut } from "lucide-react";
import { SideSheetNav } from "./SideSheetNav";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

export default function AppLayout() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSignOut = async () => {
    setSheetOpen(false);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => navigate("/login"),
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen} disablePointerDismissal={true} modal={false}>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open navigation menu" />}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="!w-76 p-0">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <SideSheetNav
                userName={session?.user?.name}
                userEmail={session?.user?.email}
                userImage={session?.user?.image}
                onLinkClick={() => {}}
                onSignOut={handleSignOut}
              />
            </SheetContent>
          </Sheet>
          <Link to="/dashboard">
            <span className="text-lg font-bold tracking-tight text-primary">
              Go Out Planner
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu" />}
            >
              <Avatar className="size-8">
                <AvatarImage
                  src={session?.user?.image ?? undefined}
                  alt={session?.user?.name ?? "User avatar"}
                />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {session?.user?.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {session?.user?.email}
                  </span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2 text-muted-foreground">
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-muted-foreground">
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col animate-in fade-in duration-200">
        <Outlet />
      </main>
    </div>
  );
}
