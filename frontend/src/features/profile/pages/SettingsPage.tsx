import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/Spinner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import MapPicker from "@/components/MapPicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  type UpdateProfilePayload,
} from "@/features/profile/api/profile";
import {
  getAvatarUploadUrl,
  completeAvatarUpload,
} from "@/features/profile/api/avatar";
import {
  User,
  Lock,
  Trash2,
  AlertCircle,
  MapPin,
  Upload,
  Camera,
} from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [displayUsername, setDisplayUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [deletePassword, setDeletePassword] = useState("");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getProfile()
      .then((data) => {
        if (cancelled) return;
        const p = data.profile;
        setName(p.name ?? "");
        setUsername(p.username ?? "");
        setDisplayUsername(p.displayUsername ?? "");
        setBio(p.bio ?? "");
        setLocation(p.location);
        setAvatarPreview(p.image ?? null);
        setProfileError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setProfileError(
          err instanceof Error ? err.message : "Failed to load profile",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF images are allowed");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned upload URL
      setUploadProgress(10);
      const { uploadUrl, objectKey } = await getAvatarUploadUrl(avatarFile.type);

      // Step 2: Upload directly to storage
      setUploadProgress(30);
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", avatarFile.type);
        xhr.setRequestHeader("x-amz-acl", "public-read");

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(30 + Math.round((e.loaded / e.total) * 60));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.send(avatarFile);
      });

      // Step 3: Notify backend to complete
      setUploadProgress(95);
      const { publicUrl } = await completeAvatarUpload(objectKey);

      setUploadProgress(100);
      toast.success("Avatar updated");

      setAvatarPreview(publicUrl || null);
      setAvatarFile(null);

      // Refresh the auth session to pick up new image
      await authClient.getSession().catch(() => {});
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload avatar",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const payload: UpdateProfilePayload = {};
      if (name.trim()) payload.name = name.trim();
      if (username.trim()) payload.username = username.trim();
      if (displayUsername.trim()) payload.displayUsername = displayUsername.trim();
      if (bio.trim()) payload.bio = bio.trim();
      if (location) payload.location = location;

      await updateProfile(payload);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword.length > 128) {
      setPasswordError("New password must be at most 128 characters");
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const openDeleteDialog = () => {
    setDeleteError(null);
    if (!deletePassword) {
      setDeleteError("Please enter your password to confirm");
      return;
    }
    setDeleteDialogOpen(true);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      toast.success("Account deleted");
      setDeleteDialogOpen(false);
      await authClient.signOut().catch(() => {});
      navigate("/login");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete account",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardContent className="flex items-center gap-2 py-6 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{profileError}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-b from-primary/[0.04] to-background p-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, password, and account.
          </p>
        </div>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1">
            <User className="mr-2 size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="flex-1">
            <Lock className="mr-2 size-4" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
              <CardDescription>
                Upload a profile picture. JPEG, PNG, WebP, or GIF — max 5MB.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Avatar size="lg" className="size-24">
                <AvatarImage
                  src={avatarPreview ?? undefined}
                  alt="Avatar preview"
                />
                <AvatarFallback className="text-2xl">
                  {session?.user.name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col gap-3 w-full sm:w-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Camera className="mr-2 size-4" />
                    Choose Image
                  </Button>

                  {avatarFile && (
                    <Button
                      size="sm"
                      onClick={handleUploadAvatar}
                      disabled={uploading}
                    >
                      {uploading && <Spinner size="sm" />}
                      <Upload className="mr-2 size-4" />
                      Upload
                    </Button>
                  )}
                </div>

                {avatarFile && (
                  <p className="text-xs text-muted-foreground">
                    {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}

                {uploading && (
                  <div className="w-full max-w-64">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your name, username, bio, and location.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your-username"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="displayUsername">Display Name</Label>
                <Input
                  id="displayUsername"
                  value={displayUsername}
                  onChange={(e) => setDisplayUsername(e.target.value)}
                  placeholder="Display name"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className="text-xs text-muted-foreground">
                  {bio.length}/500
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <Label>
                  <MapPin className="mr-1 inline size-3.5" />
                  Location
                </Label>
                <p className="mb-1 text-xs text-muted-foreground">
                  Click on the map to set your location.
                </p>
                <MapPicker
                  latitude={location?.latitude}
                  longitude={location?.longitude}
                  onPick={(lat, lng) =>
                    setLocation({ latitude: lat, longitude: lng })
                  }
                />
                {location && (
                  <p className="text-xs text-muted-foreground">
                    {location.latitude.toFixed(4)},{" "}
                    {location.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="self-start"
              >
                {savingProfile && <Spinner size="sm" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your account password.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {passwordError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="Current password"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="New password (min 8 characters)"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="self-start"
              >
                {changingPassword && <Spinner size="sm" />}
                Change Password
              </Button>
            </CardContent>
          </Card>

          <Separator />

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data.
                This cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {deleteError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="deletePassword">
                  Enter your password to confirm
                </Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError(null);
                  }}
                  placeholder="Your password"
                />
              </div>
              <Button
                variant="destructive"
                onClick={openDeleteDialog}
                disabled={deleting}
                className="self-start"
              >
                <Trash2 className="mr-2 size-4" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Account"
        description="Are you sure you want to permanently delete your account? This action cannot be undone."
        confirmLabel="Delete Account"
        destructive
        loading={deleting}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
