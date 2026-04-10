"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Host, Sponsor } from "@/types/game";
import { ACCEPTED_IMAGE_TYPES, MAX_LOGO_SIZE } from "@/lib/constants";

export default function BrandingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [host, setHost] = useState<Host | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [primaryColor, setPrimaryColor] = useState("#e8b931");
  const [accentColor, setAccentColor] = useState("#a78bfa");
  const [defaultTitle, setDefaultTitle] = useState("Trivia Night");
  const [openJoin, setOpenJoin] = useState(false);

  // Sponsor form
  const [newSponsorName, setNewSponsorName] = useState("");
  const [newSponsorFile, setNewSponsorFile] = useState<File | null>(null);
  const [addingSponsor, setAddingSponsor] = useState(false);

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: hostData } = await supabase
      .from("hosts")
      .select("*")
      .eq("id", user.id)
      .single();

    if (hostData) {
      setHost(hostData);
      setPrimaryColor(hostData.primary_color);
      setAccentColor(hostData.accent_color);
      setDefaultTitle(hostData.default_game_title);
      setOpenJoin(hostData.open_join);
    }

    const { data: sponsorData } = await supabase
      .from("sponsors")
      .select("*")
      .eq("host_id", user.id)
      .order("created_at", { ascending: true });

    if (sponsorData) setSponsors(sponsorData);
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !host) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Please upload a PNG, SVG, JPG, or WebP image");
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setError("Logo must be under 2MB");
      return;
    }

    setError(null);
    const ext = file.name.split(".").pop();
    const path = `${host.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("host-logos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError("Failed to upload logo: " + uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("host-logos").getPublicUrl(path);

    await supabase.from("hosts").update({ logo_url: publicUrl }).eq("id", host.id);
    setHost({ ...host, logo_url: publicUrl });
    setSuccess("Logo updated");
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleSaveSettings = async () => {
    if (!host) return;
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("hosts")
      .update({
        primary_color: primaryColor,
        accent_color: accentColor,
        default_game_title: defaultTitle,
        open_join: openJoin,
      })
      .eq("id", host.id);

    if (updateError) {
      setError("Failed to save: " + updateError.message);
    } else {
      setSuccess("Settings saved");
      setTimeout(() => setSuccess(null), 2000);
    }
    setSaving(false);
  };

  const handleAddSponsor = async () => {
    if (!host || !newSponsorName.trim() || !newSponsorFile) return;
    setAddingSponsor(true);
    setError(null);

    if (!ACCEPTED_IMAGE_TYPES.includes(newSponsorFile.type)) {
      setError("Please upload a PNG, SVG, JPG, or WebP image");
      setAddingSponsor(false);
      return;
    }
    if (newSponsorFile.size > MAX_LOGO_SIZE) {
      setError("Sponsor logo must be under 2MB");
      setAddingSponsor(false);
      return;
    }

    const ext = newSponsorFile.name.split(".").pop();
    const path = `${host.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("sponsor-logos")
      .upload(path, newSponsorFile, { upsert: true });

    if (uploadError) {
      setError("Failed to upload: " + uploadError.message);
      setAddingSponsor(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("sponsor-logos").getPublicUrl(path);

    const { error: insertError } = await supabase.from("sponsors").insert({
      host_id: host.id,
      name: newSponsorName.trim(),
      logo_url: publicUrl,
    });

    if (insertError) {
      setError("Failed to add sponsor: " + insertError.message);
    } else {
      setNewSponsorName("");
      setNewSponsorFile(null);
      await loadData();
    }
    setAddingSponsor(false);
  };

  const handleDeleteSponsor = async (sponsorId: string) => {
    const { error: deleteError } = await supabase
      .from("sponsors")
      .delete()
      .eq("id", sponsorId);

    if (deleteError) {
      setError("Failed to delete: " + deleteError.message);
    } else {
      setSponsors(sponsors.filter((s) => s.id !== sponsorId));
    }
  };

  if (!host) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-text-mid">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 text-sm text-text-mid hover:text-text"
        >
          &larr; Back to Dashboard
        </button>
        <h1 className="font-display text-2xl text-accent">Branding</h1>
        <p className="mt-1 text-text-mid">
          Customize your trivia night appearance
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-correct/10 px-4 py-3 text-sm text-correct">
          {success}
        </div>
      )}

      {/* Logo */}
      <Card className="mb-6">
        <h2 className="mb-4 text-lg font-bold">Logo</h2>
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-surface-border bg-surface-hi">
            {host.logo_url ? (
              <img
                src={host.logo_url}
                alt="Host logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl text-text-dim">?</span>
            )}
          </div>
          <div>
            <label className="cursor-pointer">
              <Button variant="secondary" size="sm" className="pointer-events-none">
                Upload Logo
              </Button>
              <input
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
            <p className="mt-2 text-xs text-text-dim">
              PNG, SVG, or WebP. 400x400px min, 2MB max.
            </p>
          </div>
        </div>
      </Card>

      {/* Colors & Settings */}
      <Card className="mb-6">
        <h2 className="mb-4 text-lg font-bold">Settings</h2>
        <div className="grid gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-mid">
              Default Game Title
            </span>
            <input
              type="text"
              value={defaultTitle}
              onChange={(e) => setDefaultTitle(e.target.value)}
              className="rounded-lg border border-surface-border bg-surface-hi px-4 py-2.5 text-text outline-none focus:border-accent"
            />
          </label>

          <div className="flex gap-6">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-mid">
                Primary Color
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border-none bg-transparent"
                />
                <span className="font-mono text-sm text-text-dim">
                  {primaryColor}
                </span>
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-text-mid">
                Accent Color
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border-none bg-transparent"
                />
                <span className="font-mono text-sm text-text-dim">
                  {accentColor}
                </span>
              </div>
            </label>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={openJoin}
              onChange={(e) => setOpenJoin(e.target.checked)}
              className="h-5 w-5 rounded border-surface-border bg-surface-hi accent-accent"
            />
            <div>
              <span className="text-sm font-medium text-text">Open Join</span>
              <p className="text-xs text-text-dim">
                When enabled, teams don&apos;t need a PIN to join
              </p>
            </div>
          </label>

          <Button onClick={handleSaveSettings} disabled={saving} size="md">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </Card>

      {/* Sponsors */}
      <Card>
        <h2 className="mb-4 text-lg font-bold">Sponsors</h2>

        {sponsors.length > 0 && (
          <div className="mb-5 grid gap-3">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-hi px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-surface-border">
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="font-semibold">{sponsor.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSponsor(sponsor.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-surface-border p-4">
          <p className="text-sm font-medium text-text-mid">Add Sponsor</p>
          <input
            type="text"
            placeholder="Sponsor name"
            value={newSponsorName}
            onChange={(e) => setNewSponsorName(e.target.value)}
            className="rounded-lg border border-surface-border bg-surface px-4 py-2.5 text-text outline-none focus:border-accent"
          />
          <input
            type="file"
            accept="image/png,image/svg+xml,image/jpeg,image/webp"
            onChange={(e) => setNewSponsorFile(e.target.files?.[0] ?? null)}
            className="text-sm text-text-mid file:mr-3 file:rounded-md file:border-0 file:bg-surface-hi file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text"
          />
          <Button
            onClick={handleAddSponsor}
            disabled={addingSponsor || !newSponsorName.trim() || !newSponsorFile}
            size="sm"
          >
            {addingSponsor ? "Adding..." : "Add Sponsor"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
