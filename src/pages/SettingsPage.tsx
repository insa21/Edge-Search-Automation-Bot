import React, { useState } from 'react'
import { Save } from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'
import { AppSettings, TypingSpeed } from '../types/index'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="card-title">{title}</div>
      {children}
    </div>
  )
}

function SettingRow({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid var(--border-subtle)',
      gap: 16,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

export const SettingsPage: React.FC = () => {
  const { settings, setSettings, saveToMain } = useSettingsStore()
  const [saved, setSaved] = useState(false)

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings({ [key]: value })
  }

  const handleSave = async () => {
    await saveToMain()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const typingOptions: { value: TypingSpeed; label: string; desc: string }[] = [
    { value: 'slow', label: 'Lambat', desc: '100ms/karakter' },
    { value: 'normal', label: 'Normal', desc: '60ms/karakter' },
    { value: 'fast', label: 'Cepat', desc: '25ms/karakter' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Pencarian */}
      <Section title="Pencarian">
        <SettingRow
          label="Delay Antar Pencarian"
          description={`Jeda sebelum mencari keyword berikutnya (minimum 3 detik)`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min={3}
              max={60}
              value={settings.delayBetweenSearches}
              onChange={(e) => update('delayBetweenSearches', Number(e.target.value))}
              style={{ width: 120 }}
            />
            <input
              type="number"
              min={3}
              max={60}
              value={settings.delayBetweenSearches}
              onChange={(e) => update('delayBetweenSearches', Math.max(3, Number(e.target.value)))}
              className="input"
              style={{ width: 70, textAlign: 'center' }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 30 }}>detik</span>
          </div>
        </SettingRow>

        <SettingRow
          label="Timeout Halaman"
          description="Batas waktu menunggu halaman selesai dimuat"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              min={10}
              max={120}
              value={settings.pageTimeout}
              onChange={(e) => update('pageTimeout', Math.max(10, Number(e.target.value)))}
              className="input"
              style={{ width: 70, textAlign: 'center' }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 30 }}>detik</span>
          </div>
        </SettingRow>

        <SettingRow
          label="Kecepatan Mengetik"
          description="Kecepatan pengetikan keyword di kotak pencarian"
        >
          <div style={{ display: 'flex', gap: 8 }}>
            {typingOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update('typingSpeed', opt.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: settings.typingSpeed === opt.value
                    ? '1px solid var(--accent-primary)'
                    : '1px solid var(--border-default)',
                  background: settings.typingSpeed === opt.value
                    ? 'var(--accent-primary-muted)'
                    : 'var(--bg-elevated)',
                  color: settings.typingSpeed === opt.value
                    ? 'var(--accent-primary)'
                    : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {opt.label}
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow
          label="Maksimal Retry per Keyword"
          description="Berapa kali mencoba ulang sebelum keyword ditandai gagal"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              min={0}
              max={5}
              value={settings.maxRetryPerKeyword}
              onChange={(e) => update('maxRetryPerKeyword', Math.max(0, Number(e.target.value)))}
              className="input"
              style={{ width: 70, textAlign: 'center' }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 30 }}>kali</span>
          </div>
        </SettingRow>
      </Section>

      {/* Browser */}
      <Section title="Browser">
        <SettingRow
          label="Setelah Pencarian Selesai"
          description="Pilih apakah Edge tetap terbuka atau ditutup otomatis"
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => update('closeEdgeAfterDone', false)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: !settings.closeEdgeAfterDone
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border-default)',
                background: !settings.closeEdgeAfterDone
                  ? 'var(--accent-primary-muted)'
                  : 'var(--bg-elevated)',
                color: !settings.closeEdgeAfterDone
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              Tetap Buka Edge
            </button>
            <button
              onClick={() => update('closeEdgeAfterDone', true)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: settings.closeEdgeAfterDone
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border-default)',
                background: settings.closeEdgeAfterDone
                  ? 'var(--accent-primary-muted)'
                  : 'var(--bg-elevated)',
                color: settings.closeEdgeAfterDone
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              Tutup Edge Otomatis
            </button>
          </div>
        </SettingRow>

        <SettingRow
          label="Lanjutkan dari Terakhir"
          description="Lanjutkan dari keyword yang belum selesai ketika memulai ulang"
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.resumeFromLastIndex}
              onChange={(e) => update('resumeFromLastIndex', e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {settings.resumeFromLastIndex ? 'Aktif' : 'Nonaktif'}
            </span>
          </label>
        </SettingRow>
      </Section>

      {/* Tampilan */}
      <Section title="Tampilan">
        <SettingRow label="Tema" description="Pilih tema tampilan aplikasi">
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => update('theme', 'dark')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: settings.theme === 'dark'
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border-default)',
                background: settings.theme === 'dark'
                  ? 'var(--accent-primary-muted)'
                  : 'var(--bg-elevated)',
                color: settings.theme === 'dark'
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              🌙 Gelap
            </button>
            <button
              onClick={() => update('theme', 'light')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: settings.theme === 'light'
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border-default)',
                background: settings.theme === 'light'
                  ? 'var(--accent-primary-muted)'
                  : 'var(--bg-elevated)',
                color: settings.theme === 'light'
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              ☀️ Terang
            </button>
          </div>
        </SettingRow>
      </Section>

      {/* Save Button */}
      <button
        className="btn btn-primary btn-lg"
        onClick={handleSave}
        style={{ alignSelf: 'flex-start' }}
        id="btn-save-settings"
      >
        <Save size={16} />
        {saved ? 'Tersimpan!' : 'Simpan Pengaturan'}
      </button>
    </div>
  )
}
