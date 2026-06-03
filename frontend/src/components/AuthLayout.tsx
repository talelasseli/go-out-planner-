import { type ReactNode } from "react";
import { CalendarPlus } from "lucide-react";

interface Feature {
  icon: ReactNode;
  text: string;
}

interface AuthLayoutProps {
  headline: string;
  children: ReactNode;
  features: Feature[];
}

export function AuthLayout({ headline, children, features }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="flex flex-col justify-center gap-4 border-b bg-gradient-to-b from-primary/[0.04] to-background px-6 py-8 lg:w-1/2 lg:border-b-0 lg:border-r lg:px-12 lg:py-0 lg:gap-6">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary lg:size-12">
          <CalendarPlus className="size-5 lg:size-6" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold tracking-tight lg:text-2xl">
            {headline}
          </h2>
          <p className="text-sm text-muted-foreground lg:text-base">
            Plan something memorable, invite your friends, and keep everyone in
            sync.
          </p>
        </div>
        <ul className="hidden flex-col gap-3 lg:flex">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                {feature.icon}
              </span>
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
        <p className="hidden text-xs text-muted-foreground lg:block">
          Go Out Planner
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
