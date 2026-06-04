"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Lock, Download, Upload, Trash2, Palette,
  Info, ChevronRight, Shield, HardDrive, Fingerprint, Users, UserPlus,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { useSettings } from "@/hooks/useSettings"
import { setPIN, verifyPIN, removePIN } from "@/lib/auth"
import { exportToJSON } from "@/lib/utils"
import { useEntries } from "@/hooks/useEntries"
import { MagicButton } from "@/components/ui/MagicButton"
import { showToast } from "@/components/ui/Toast"
import { cn } from "@/lib/utils"
import { applyTheme, THEME_OPTIONS } from "@/lib/theme"
import { clearAllMedia, getStorageStats } from "@/lib/storage"
import { validateImportEntry } from "@/lib/validation"
import type { Entry } from "@/types"

export default function SettingsPage() {
  const router = useRouter()
  const { settings, lock, clearAllData, profiles, activeProfileId, removeProfile, addProfile } = useAppStore()
  const { updateSettings, toggleAnimations, setTheme } = useSettings()
  const { entries } = useEntries()

  const [showChangePIN, setShowChangePIN]   = useState(false)
  const [oldPin, setOldPin]                 = useState("")
  const [newPin, setNewPin]                 = useState("")
  const [confirmPin, setConfirmPin]         = useState("")
  const [newPinLength, setNewPinLength]     = useState<4 | 6>(settings.pinLength)
  const [pinError, setPinError]             = useState("")
  const [changingPin, setChangingPin]       = useState(false)
  const [storageInfo, setStorageInfo]       = useState({
    entryCount: 0, mediaCount: 0,
    entriesBytes: 0, mediaBytes: 0, totalBytes: 0,
  })

  useEffect(() => {
    let mounted = true
    getStorageStats(entries)
      .then((d) => { if (mounted) setStorageInfo(d) })
      .catch(() => {
        if (mounted) setStorageInfo({
          entryCount: entries.length, mediaCount: 0,
          entriesBytes: 0, mediaBytes: 0, totalBytes: 0,
        })
      })
    return () => { mounted = false }
  }, [entries])

  useEffect(() => { setNewPinLength(settings.pinLength) }, [settings.pinLength])

  const formattedStorage = useMemo(() => formatBytes(storageInfo.totalBytes), [storageInfo.totalBytes])

  // ─── Export / Import ─────────────────────────────────────────────────────────
  const handleExport = () => {
    exportToJSON(entries)
    showToast("Backup exported! 💾")
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type   = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      if (file.size > 50 * 1024 * 1024) {
        showToast("File too large (max 50 MB)", "error")
        return
      }

      try {
        const text = await file.text()
        const data = JSON.parse(text) as unknown

        // Validate structure
        if (
          !data ||
          typeof data !== "object" ||
          !Array.isArray((data as Record<string, unknown>).entries)
        ) {
          showToast("Invalid backup file — missing entries array", "error")
          return
        }

        const rawEntries = (data as { entries: unknown[] }).entries
        const validEntries = rawEntries.filter(validateImportEntry) as Entry[]

        if (validEntries.length === 0) {
          showToast("No valid entries found in backup", "error")
          return
        }

        if (validEntries.length !== rawEntries.length) {
          showToast(
            `Imported ${validEntries.length} of ${rawEntries.length} entries (${rawEntries.length - validEntries.length} invalid)`,
            "info",
          )
        }

        const { loadEntries, saveEntries } = await import("@/lib/storage")
        const existing = loadEntries()
        const ids      = new Set(existing.map((e) => e.id))
        const newOnes  = validEntries.filter((e) => !ids.has(e.id))

        if (newOnes.length === 0) {
          showToast("All entries are already in your diary", "info")
          return
        }

        saveEntries([...existing, ...newOnes])
        showToast(`Imported ${newOnes.length} new entries! ✨`)
        window.location.reload()
      } catch {
        showToast("Failed to parse backup file", "error")
      }
    }
    input.click()
  }

  // ─── Clear data ───────────────────────────────────────────────────────────────
  const handleClearData = () => {
    if (!confirm(
      "This will permanently delete ALL your diary entries and settings. This cannot be undone. Are you absolutely sure?"
    )) return
    if (!confirm("Last chance — are you sure you want to delete everything?")) return
    clearAllMedia()
      .catch(() => undefined)
      .finally(() => {
        clearAllData()
        showToast("All diaries cleared")
        router.replace("/onboarding")
      })
  }

  // ─── PIN management ───────────────────────────────────────────────────────────
  const handleChangePIN = async () => {
    setPinError("")
    if (settings.hasPIN) {
      const valid = await verifyPIN(oldPin)
      if (!valid) { setPinError("Current PIN is incorrect"); return }
    }
    if (!/^\d+$/.test(newPin))                { setPinError("PIN must contain only digits"); return }
    if (newPin.length !== newPinLength)        { setPinError(`PIN must be exactly ${newPinLength} digits`); return }
    if (newPin !== confirmPin)                 { setPinError("PINs do not match"); return }

    setChangingPin(true)
    try {
      await setPIN(newPin, newPinLength)
      updateSettings({ hasPIN: true, pinLength: newPinLength })
      showToast("PIN updated! 🔒")
      setShowChangePIN(false)
      setOldPin(""); setNewPin(""); setConfirmPin("")
    } finally {
      setChangingPin(false)
    }
  }

  const handleRemovePIN = async () => {
    if (!confirm("Remove PIN protection? Your diary will be accessible without a PIN.")) return
    const valid = await verifyPIN(oldPin)
    if (!valid) { setPinError("Current PIN is incorrect"); return }
    removePIN()
    updateSettings({ hasPIN: false, pinLength: 4 })
    showToast("PIN removed")
    setShowChangePIN(false)
    setOldPin("")
  }

  const handleThemeChange = (id: typeof settings.theme) => {
    setTheme(id)
    applyTheme(id)
  }

  return (
    <div className="min-h-screen px-4 pt-12 pb-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-2xl font-bold gradient-text mb-1">Settings</h1>
        <p className="text-fairy-text-muted text-sm">Personalize your diary</p>
      </motion.div>

      <div className="space-y-5">

        {/* Diaries / profiles */}
        <Section title="Diaries on this device" icon={<Users size={16} />}>
          <SettingRow
            icon={<Users size={16} className="text-fairy-purple" />}
            label="Switch diary"
            sub={`${profiles.length} ${profiles.length === 1 ? "diary" : "diaries"} — pick who is writing`}
            onClick={() => {
              lock()
              router.replace("/profiles")
            }}
          />
          <SettingRow
            icon={<UserPlus size={16} className="text-emerald-400" />}
            label="Add another diary"
            sub="New private journal with its own PIN"
            onClick={() => {
              const name = prompt("Name for the new diary:", "My Diary")
              if (!name?.trim()) return
              addProfile(name.trim())
              showToast("Set up your new diary ✨")
              router.replace("/onboarding")
            }}
          />
          {profiles.length > 1 && activeProfileId && (
            <div className="px-4 py-3">
              <MagicButton
                variant="danger"
                size="sm"
                className="w-full"
                onClick={async () => {
                  const current = profiles.find((p) => p.id === activeProfileId)
                  if (!current) return
                  if (!confirm(`Delete "${current.displayName}" and all its entries on this device?`)) return
                  if (!confirm("This cannot be undone. Delete this diary?")) return
                  await removeProfile(activeProfileId)
                  showToast("Diary deleted")
                  router.replace("/profiles")
                }}
              >
                Delete this diary only
              </MagicButton>
            </div>
          )}
        </Section>

        {/* Privacy & Security */}
        <Section title="Privacy & Security" icon={<Shield size={16} />}>
          <SettingRow
            icon={<Lock size={16} className="text-fairy-purple" />}
            label={settings.hasPIN ? "Change PIN" : "Set up PIN"}
            sub={settings.hasPIN ? `Update your ${settings.pinLength}-digit PIN` : "Protect your diary with a PIN"}
            onClick={() => setShowChangePIN(!showChangePIN)}
          />
          {showChangePIN && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden px-4 pb-4 space-y-3"
            >
              {settings.hasPIN && (
                <input
                  type="password"
                  placeholder="Current PIN"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="current-password"
                  className="w-full glass rounded-xl px-3 py-2 text-sm text-fairy-text placeholder-fairy-text-muted/40 focus:outline-none border border-fairy-border"
                  aria-label="Current PIN"
                />
              )}
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="New PIN length">
                {([4, 6] as const).map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => { setNewPinLength(len); setNewPin(""); setConfirmPin(""); setPinError("") }}
                    className={cn(
                      "rounded-xl py-2 text-xs border",
                      newPinLength === len
                        ? "border-fairy-purple text-fairy-purple bg-fairy-purple/10"
                        : "border-fairy-border text-fairy-text-muted",
                    )}
                    aria-pressed={newPinLength === len}
                  >
                    {len}-digit PIN
                  </button>
                ))}
              </div>
              <input
                type="password"
                placeholder={`New PIN (${newPinLength} digits)`}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, newPinLength))}
                maxLength={6}
                inputMode="numeric"
                autoComplete="new-password"
                className="w-full glass rounded-xl px-3 py-2 text-sm text-fairy-text placeholder-fairy-text-muted/40 focus:outline-none border border-fairy-border"
                aria-label={`New ${newPinLength}-digit PIN`}
              />
              <input
                type="password"
                placeholder="Confirm new PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, newPinLength))}
                maxLength={6}
                inputMode="numeric"
                autoComplete="new-password"
                className="w-full glass rounded-xl px-3 py-2 text-sm text-fairy-text placeholder-fairy-text-muted/40 focus:outline-none border border-fairy-border"
                aria-label="Confirm new PIN"
              />
              {pinError && (
                <p className="text-red-400 text-xs" role="alert">{pinError}</p>
              )}
              <div className="flex gap-2">
                <MagicButton size="sm" onClick={handleChangePIN} loading={changingPin} className="flex-1">
                  Save PIN
                </MagicButton>
                {settings.hasPIN && (
                  <MagicButton size="sm" variant="danger" onClick={handleRemovePIN} className="flex-1">
                    Remove PIN
                  </MagicButton>
                )}
              </div>
              <button
                type="button"
                className="w-full glass rounded-xl py-2 text-xs text-fairy-text-muted hover:text-fairy-text flex items-center justify-center gap-2"
                onClick={() => showToast("Biometric unlock coming soon", "info")}
              >
                <Fingerprint size={14} aria-hidden="true" />
                Enable biometric unlock (coming soon)
              </button>
            </motion.div>
          )}
          <SettingRow
            icon={<Lock size={16} className="text-fairy-rose" />}
            label="Lock Now"
            sub="Lock the app immediately"
            onClick={() => { lock(); router.replace("/lock") }}
          />
          <div className="px-4 py-3">
            <div className="glass rounded-xl p-3 border border-fairy-border/30">
              <p className="text-xs text-fairy-text-muted/70 leading-relaxed">
                🔒 <strong className="text-fairy-text/70">Local-first privacy:</strong>{" "}
                All your diary data is stored only on this device. Nothing is sent to any server.
                PINs are secured with PBKDF2 encryption.
              </p>
            </div>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance" icon={<Palette size={16} />}>
          <div className="grid grid-cols-2 gap-2 p-4" role="radiogroup" aria-label="Theme selection">
            {THEME_OPTIONS.map((theme) => {
              const active = settings.theme === theme.id
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeChange(theme.id)}
                  role="radio"
                  aria-checked={active}
                  className={cn(
                    "rounded-2xl border p-3 text-left transition-all",
                    active ? "border-fairy-purple bg-fairy-purple/12 shadow-fairy" : "border-fairy-border bg-white/5",
                  )}
                >
                  <p className="text-sm text-fairy-text font-medium">{theme.emoji} {theme.name}</p>
                  <p className="text-[11px] text-fairy-text-muted/70 mt-1">{theme.description}</p>
                </button>
              )
            })}
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-fairy-text">Animations</p>
              <p className="text-xs text-fairy-text-muted/60">Sparkles and transitions</p>
            </div>
            <button
              type="button"
              onClick={toggleAnimations}
              role="switch"
              aria-checked={settings.animationsEnabled}
              aria-label="Toggle animations"
              className={cn(
                "w-12 h-6 rounded-full transition-all duration-300 relative",
                settings.animationsEnabled ? "bg-fairy-purple" : "bg-white/10",
              )}
            >
              <span className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300",
                settings.animationsEnabled ? "left-7" : "left-1",
              )} />
            </button>
          </div>
        </Section>

        {/* Storage */}
        <Section title="Storage" icon={<HardDrive size={16} />}>
          <div className="px-4 py-3 grid grid-cols-2 gap-2">
            <StorageStat label="Entries"      value={String(storageInfo.entryCount)} />
            <StorageStat label="Media Files"  value={String(storageInfo.mediaCount)} />
            <StorageStat label="Entries Size" value={formatBytes(storageInfo.entriesBytes)} />
            <StorageStat label="Media Size"   value={formatBytes(storageInfo.mediaBytes)} />
          </div>
          <div className="px-4 pb-4">
            <div className="glass rounded-xl p-3 border border-fairy-border/30">
              <p className="text-xs text-fairy-text-muted/70">Total local storage used</p>
              <p className="text-base text-fairy-text font-semibold mt-1">{formattedStorage}</p>
            </div>
          </div>
        </Section>

        {/* Data */}
        <Section title="Your Data" icon={<Download size={16} />}>
          <SettingRow
            icon={<Download size={16} className="text-emerald-400" />}
            label="Export Backup"
            sub="Download all entries as JSON"
            onClick={handleExport}
          />
          <SettingRow
            icon={<Upload size={16} className="text-blue-400" />}
            label="Import Backup"
            sub="Restore from a JSON backup (max 50 MB)"
            onClick={handleImport}
          />
        </Section>

        {/* About */}
        <Section title="About" icon={<Info size={16} />}>
          <div className="px-4 py-4 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl" role="img" aria-label="Fairy">🧚‍♀️</span>
              <div>
                <p className="text-sm font-display font-semibold text-fairy-text">FairyDiary</p>
                <p className="text-xs text-fairy-text-muted/60">Version 1.1.0 • Your magical journal</p>
              </div>
            </div>
            <p className="text-xs text-fairy-text-muted/50 leading-relaxed mt-3">
              Built with ✨ using Next.js, Framer Motion & OpenRouter AI. Your data is always local and private.
            </p>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Danger Zone" icon={<Trash2 size={16} />} danger>
          <div className="px-4 py-3">
            <MagicButton variant="danger" size="md" className="w-full" onClick={handleClearData}>
              <Trash2 size={15} aria-hidden="true" />
              Delete all diaries on this device
            </MagicButton>
            <p className="text-xs text-fairy-text-muted/40 text-center mt-2">
              Removes every profile, entry, and PIN on this browser
            </p>
          </div>
        </Section>

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StorageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3 border border-fairy-border/30">
      <p className="text-[11px] text-fairy-text-muted/70">{label}</p>
      <p className="text-sm text-fairy-text font-medium mt-1">{value}</p>
    </div>
  )
}

function Section({
  title, icon, children, danger = false,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className={cn(
        "glass rounded-2xl overflow-hidden border",
        danger ? "border-red-500/20" : "border-fairy-border/50",
      )}
    >
      <div className={cn(
        "px-4 py-3 border-b flex items-center gap-2",
        danger ? "border-red-500/20" : "border-fairy-border/30",
      )}>
        <span className={danger ? "text-red-400" : "text-fairy-purple"} aria-hidden="true">{icon}</span>
        <p
          id={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            danger ? "text-red-400/70" : "text-fairy-text-muted/70",
          )}
        >
          {title}
        </p>
      </div>
      {children}
    </motion.section>
  )
}

function SettingRow({
  icon, label, sub, onClick,
}: {
  icon: React.ReactNode
  label: string
  sub: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left border-b border-fairy-border/20 last:border-0"
    >
      <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-fairy-text">{label}</p>
        <p className="text-xs text-fairy-text-muted/60">{sub}</p>
      </div>
      <ChevronRight size={15} className="text-fairy-text-muted/40 flex-shrink-0" aria-hidden="true" />
    </button>
  )
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  let v = bytes
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
