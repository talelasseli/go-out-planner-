import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/Spinner";
import { AuthLayout } from "@/components/AuthLayout";
import { AlertCircle, Calendar, Users, Clock } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    await authClient.signIn.email(
      { email, password },
      {
        onSuccess: () => navigate("/dashboard"),
        onError: (ctx) => setError(ctx.error.message),
      },
    );

    setLoading(false);
  };

  const handleGoogleSignIn = () => {
    authClient.signIn.social({
      provider: "google",
      callbackURL: `${import.meta.env.VITE_APP_URL}/dashboard`,
    });
  };

  return (
    <AuthLayout
      headline="Ready for your next night out?"
      features={[
        { icon: <Calendar className="size-3.5" />, text: "Create plans in seconds" },
        { icon: <Users className="size-3.5" />, text: "Invite friends and track responses" },
        { icon: <Clock className="size-3.5" />, text: "Keep every outing organized" },
      ]}
    >
      <Card>
        <CardHeader className="text-center lg:text-left">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Pick up where your plans left off.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Spinner size="sm" />}
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-xs uppercase">or</span>
            <Separator className="flex-1" />
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full"
          >
            Continue with Google
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
