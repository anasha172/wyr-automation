'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { demoStore, isDemoMode } from '@/lib/demo-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save } from 'lucide-react'

interface Settings {
  google_api_key: string
  google_search_engine_id: string
  pinterest_api_token: string
  manager_email: string
  canva_template_id: string
  canva_access_token: string
  instagram_user_id: string
  instagram_access_token: string
}

const DEFAULTS: Settings = {
  google_api_key: '',
  google_search_engine_id: '',
  pinterest_api_token: '',
  manager_email: '',
  canva_template_id: '',
  canva_access_token: '',
  instagram_user_id: '',
  instagram_access_token: '',
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isDemoMode) {
      const saved = demoStore.settings.get()
      if (saved) setSettings({ ...DEFAULTS, ...saved })
    } else {
      const supabase = createClient()
      supabase.from('user_settings').select('*').single().then(({ data }) => {
        if (data) setSettings({ ...DEFAULTS, ...data })
      })
    }
  }, [])

  async function save() {
    setLoading(true)
    try {
      if (isDemoMode) {
        demoStore.settings.save(settings as any)
        toast.success('Settings saved locally!')
      } else {
        const supabase = createClient()
        const { error } = await supabase.from('user_settings').upsert(settings)
        if (error) throw error
        toast.success('Settings saved!')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  function set(key: keyof Settings) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setSettings((s) => ({ ...s, [key]: e.target.value }))
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Connect your services and configure API keys</p>
      </div>

      {isDemoMode && (
        <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <p className="font-bold mb-1">Demo Mode is ON</p>
          <p>Settings are saved to your browser only. Add API keys here when you're ready to go live — then set <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_DEMO_MODE=false</code> in <code className="bg-amber-100 px-1 rounded">.env.local</code>.</p>
        </div>
      )}

      <div className="space-y-6">
        <Section title="Notifications">
          <Field label="Manager Email" description="Approval emails will be sent here (used in live mode)">
            <Input value={settings.manager_email} onChange={set('manager_email')} placeholder="manager@company.com" type="email" />
          </Field>
        </Section>

        <Section title="Google Image Search">
          <Field label="Google API Key">
            <Input value={settings.google_api_key} onChange={set('google_api_key')} placeholder="AIza…" type="password" />
          </Field>
          <Field label="Custom Search Engine ID">
            <Input value={settings.google_search_engine_id} onChange={set('google_search_engine_id')} placeholder="Search engine ID" />
          </Field>
        </Section>

        <Section title="Pinterest">
          <Field label="Pinterest API Token">
            <Input value={settings.pinterest_api_token} onChange={set('pinterest_api_token')} placeholder="Bearer token" type="password" />
          </Field>
        </Section>

        <Section title="Canva Connect">
          <Field label="Canva Access Token" description="Get this from your Canva Connect OAuth flow">
            <Input value={settings.canva_access_token} onChange={set('canva_access_token')} placeholder="Access token" type="password" />
          </Field>
          <Field label="Canva Template ID" description="The ID of your WYR Instagram Story template in Canva">
            <Input value={settings.canva_template_id} onChange={set('canva_template_id')} placeholder="DAFxxx…" />
          </Field>
        </Section>

        <Section title="Instagram / Meta">
          <Field label="Instagram User ID">
            <Input value={settings.instagram_user_id} onChange={set('instagram_user_id')} placeholder="17841400000000000" />
          </Field>
          <Field label="Instagram Access Token" description="Requires a Business/Creator account linked to a Facebook Page">
            <Input value={settings.instagram_access_token} onChange={set('instagram_access_token')} placeholder="EAAx…" type="password" />
          </Field>
        </Section>

        <Button onClick={save} disabled={loading} size="lg" className="w-full">
          <Save size={16} />
          {loading ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide border-b pb-2">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-400 mb-1.5">{description}</p>}
      {children}
    </div>
  )
}
