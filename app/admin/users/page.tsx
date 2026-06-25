'use client'

import { useEffect, useState } from 'react'
import { useUser, type UserRole } from '@/lib/auth'
import { Avatar } from '@/components/avatar'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import {
  UserPlus, Trash2, Pencil, Check, X, Loader2,
  Hash, KeyRound, Users, Plus,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Team { id: string; name: string }

interface UserRow {
  id:            string
  email:         string
  full_name:     string
  role:          UserRole
  created_at:    string
  team_id:       string | null
  team_name:     string | null
  manager_id:    string | null
  slack_user_id: string | null
}

// ─── Role chip ────────────────────────────────────────────────────────────────

function RoleChip({ role }: { role: UserRole }) {
  const styles: Record<UserRole, { bg: string; border: string; color: string }> = {
    admin:     { bg: 'var(--a-soft)',  border: 'var(--a-line)',  color: 'var(--a-ink)'  },
    manager:   { bg: 'var(--b-soft)',  border: 'var(--b-line)',  color: 'var(--b-ink)'  },
    publisher: { bg: 'var(--paper-2)', border: 'var(--hair-2)', color: 'var(--ink-3)'  },
  }
  const s = styles[role]
  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        fontFamily:    'var(--mono)',
        fontSize:      10,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding:       '4px 10px',
        borderRadius:  6,
        background:    s.bg,
        border:        `1px solid ${s.border}`,
        color:         s.color,
        fontWeight:    400,
      }}
    >
      {role}
    </span>
  )
}

function TeamChip({ name }: { name: string }) {
  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        fontFamily:    'var(--mono)',
        fontSize:      10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding:       '3px 9px',
        borderRadius:  6,
        background:    'var(--b-soft)',
        border:        '1px solid var(--b-line)',
        color:         'var(--b-ink)',
        fontWeight:    400,
      }}
    >
      {name}
    </span>
  )
}

// ─── Styled input ─────────────────────────────────────────────────────────────

function StyledInput({
  value, onChange, placeholder, type = 'text', narrow,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  narrow?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width:        narrow ? 160 : '100%',
        boxSizing:    'border-box',
        border:       '1.5px solid var(--hair-2)',
        borderRadius: 8,
        padding:      '8px 11px',
        fontFamily:   'var(--sans)',
        fontSize:     13.5,
        color:        'var(--ink)',
        background:   'var(--paper)',
        outline:      'none',
        transition:   'border-color .14s',
      }}
      onFocus={e  => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ink)')}
      onBlur={e   => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--hair-2)')}
    />
  )
}

// ─── Styled select ────────────────────────────────────────────────────────────

function StyledSelect({
  value, onChange, options, narrow, placeholder,
}: {
  value:       string
  onChange:    (e: React.ChangeEvent<HTMLSelectElement>) => void
  options:     { value: string; label: string }[]
  narrow?:     boolean
  placeholder?: string
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        width:        narrow ? 150 : '100%',
        boxSizing:    'border-box',
        border:       '1.5px solid var(--hair-2)',
        borderRadius: 8,
        padding:      '8px 11px',
        fontFamily:   'var(--sans)',
        fontSize:     13.5,
        color:        value ? 'var(--ink)' : 'var(--ink-3)',
        background:   'var(--paper)',
        outline:      'none',
        cursor:       'pointer',
        transition:   'border-color .14s',
      }}
      onFocus={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--ink)')}
      onBlur={e  => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--hair-2)')}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// ─── Mono field label ─────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display:       'block',
        fontFamily:    'var(--mono)',
        fontSize:      10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color:         'var(--ink-3)',
        marginBottom:  5,
      }}
    >
      {children}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const user = useUser()

  const [users,    setUsers]    = useState<UserRow[]>([])
  const [teams,    setTeams]    = useState<Team[]>([])
  const [loading,  setLoading]  = useState(true)

  // Edit state
  const [editingId,       setEditingId]       = useState<string | null>(null)
  const [editName,        setEditName]        = useState('')
  const [editRole,        setEditRole]        = useState<UserRole>('publisher')
  const [editSlackUserId, setEditSlackUserId] = useState('')
  const [editTeamId,      setEditTeamId]      = useState('')
  const [editManagerId,   setEditManagerId]   = useState('')

  // Inline new-team panel (shown inside team dropdown area)
  const [addingTeam,     setAddingTeam]     = useState(false)
  const [newTeamName,    setNewTeamName]    = useState('')
  const [creatingTeam,   setCreatingTeam]   = useState(false)

  // Create user panel
  const [showCreate,  setShowCreate]  = useState(false)
  const [newEmail,    setNewEmail]    = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName,     setNewName]     = useState('')
  const [newRole,     setNewRole]     = useState<UserRole>('publisher')
  const [creating,    setCreating]    = useState(false)

  // Change password
  const [changePwdId, setChangePwdId] = useState<string | null>(null)
  const [changePwd,   setChangePwd]   = useState('')
  const [savingPwd,   setSavingPwd]   = useState(false)

  const ROLE_OPTIONS = [
    { value: 'publisher', label: 'Publisher' },
    { value: 'manager',   label: 'Manager'   },
    { value: 'admin',     label: 'Admin'      },
  ]

  useEffect(() => {
    if (user === undefined) return
    if (!user || user.role !== 'admin') return
    fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)
    const [usersRes, teamsRes] = await Promise.all([
      fetch('/api/admin/users'),
      fetch('/api/admin/teams'),
    ])
    if (usersRes.ok) setUsers(await usersRes.json())
    if (teamsRes.ok) setTeams(await teamsRes.json())
    setLoading(false)
  }

  // ── Derived: list of managers (for publisher's manager dropdown) ───────────
  const managers = users.filter(u => u.role === 'manager')

  // ── Team derived for publishers (via their manager) ────────────────────────
  function publisherTeam(u: UserRow): { id: string | null; name: string | null } {
    if (!u.manager_id) return { id: null, name: null }
    const mgr = users.find(m => m.id === u.manager_id)
    return { id: mgr?.team_id ?? null, name: mgr?.team_name ?? null }
  }

  // ── Start editing a row ────────────────────────────────────────────────────
  function startEdit(u: UserRow) {
    setEditingId(u.id)
    setEditName(u.full_name)
    setEditRole(u.role)
    setEditSlackUserId(u.slack_user_id ?? '')
    setEditTeamId(u.team_id ?? '')
    setEditManagerId(u.manager_id ?? '')
    setAddingTeam(false)
    setNewTeamName('')
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function saveEdit(u: UserRow) {
    const body: Record<string, unknown> = {
      id:        u.id,
      full_name: editName,
      role:      editRole,
    }
    if (editRole === 'manager') {
      body.slack_user_id = editSlackUserId
      body.team_id       = editTeamId || null
      body.manager_id    = null   // managers don't have a manager
    }
    if (editRole === 'publisher') {
      body.manager_id    = editManagerId || null
      body.team_id       = null   // publishers derive team from their manager
      body.slack_user_id = null
    }

    const res = await fetch('/api/admin/users', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    if (!res.ok) { toast.error((await res.json()).error); return }
    toast.success('User updated')
    setEditingId(null)

    // Resolve team info for local state update
    const teamName = editRole === 'manager'
      ? (teams.find(t => t.id === editTeamId)?.name ?? null)
      : null

    setUsers(prev => prev.map(x => {
      if (x.id !== u.id) return x
      return {
        ...x,
        full_name:     editName,
        role:          editRole,
        slack_user_id: editRole === 'manager' ? (editSlackUserId || null) : null,
        team_id:       editRole === 'manager' ? (editTeamId || null) : null,
        team_name:     editRole === 'manager' ? (teamName)           : null,
        manager_id:    editRole === 'publisher' ? (editManagerId || null) : null,
      }
    }))
  }

  // ── Create new team (inline) ──────────────────────────────────────────────
  async function createTeam() {
    if (!newTeamName.trim()) { toast.error('Enter a team name'); return }
    setCreatingTeam(true)
    try {
      const res = await fetch('/api/admin/teams', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: newTeamName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      const created: Team = json
      setTeams(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setEditTeamId(created.id)
      setAddingTeam(false)
      setNewTeamName('')
      toast.success(`Team "${created.name}" created`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreatingTeam(false)
    }
  }

  // ── Delete user ───────────────────────────────────────────────────────────
  async function deleteUser(id: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error((await res.json()).error); return }
    toast.success('User deleted')
    setUsers(u => u.filter(x => x.id !== id))
  }

  // ── Create user ───────────────────────────────────────────────────────────
  async function createUser() {
    if (!newEmail || !newPassword || !newName) { toast.error('All fields are required'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/create-user', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: newEmail, password: newPassword, full_name: newName, role: newRole }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      toast.success('User created')
      setShowCreate(false)
      setNewEmail(''); setNewPassword(''); setNewName(''); setNewRole('publisher')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  // ── Change password ───────────────────────────────────────────────────────
  async function changePassword(id: string) {
    if (!changePwd || changePwd.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSavingPwd(true)
    try {
      const res = await fetch('/api/admin/users', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, password: changePwd }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      toast.success('Password updated')
      setChangePwdId(null)
      setChangePwd('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingPwd(false)
    }
  }

  // ── Loading / access denied ───────────────────────────────────────────────
  if (user === undefined || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--ink)', borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 6 }}>
        <p style={{ fontWeight: 600, color: 'var(--ink)' }}>Access denied</p>
        <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Admins only.</p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '28px 40px 60px' }}>

      {/* Masthead */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16 }}>
        <div>
          <span
            style={{
              display:       'block',
              fontFamily:    'var(--mono)',
              fontSize:      10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         'var(--ink-3)',
              marginBottom:  8,
            }}
          >
            <span style={{ color: 'var(--ink)', fontWeight: 700 }}>07</span>
            {'  '}Access
          </span>
          <h1
            style={{
              fontFamily:    'var(--serif)',
              fontSize:      36,
              fontWeight:    500,
              letterSpacing: '-0.02em',
              color:         'var(--ink)',
              margin:        '0 0 4px',
              lineHeight:    1.1,
            }}
          >
            User Management
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 15, margin: 0 }}>
            Who's in the studio, and what they can do.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" onClick={() => {/* teams managed inline */}}>
            <Users size={15} /> {teams.length} Team{teams.length !== 1 ? 's' : ''}
          </Button>
          <Button variant="a" onClick={() => setShowCreate(v => !v)}>
            <UserPlus size={15} /> Add User
          </Button>
        </div>
      </div>

      {/* Create user panel */}
      {showCreate && (
        <div
          style={{
            background:   'var(--card)',
            border:       '1px solid var(--hair)',
            borderRadius: 14,
            boxShadow:    'var(--shadow-sm)',
            overflow:     'hidden',
            marginBottom: 16,
          }}
        >
          <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--hair)' }}>
            <span style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>New User</span>
          </div>
          <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Full Name', value: newName,     setValue: setNewName,     placeholder: 'Jane Smith',       type: 'text'     },
              { label: 'Email',     value: newEmail,    setValue: setNewEmail,    placeholder: 'jane@company.com', type: 'email'    },
              { label: 'Password',  value: newPassword, setValue: setNewPassword, placeholder: 'Min 8 chars',      type: 'password' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>
                  {f.label}
                </label>
                <StyledInput value={f.value} onChange={e => f.setValue(e.target.value)} placeholder={f.placeholder} type={f.type} />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>
                Role
              </label>
              <StyledSelect value={newRole} onChange={e => setNewRole(e.target.value as UserRole)} options={ROLE_OPTIONS} />
            </div>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--hair)', background: 'var(--paper-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="ink" onClick={createUser} disabled={creating}>
              {creating ? <><Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> Creating…</> : 'Create User'}
            </Button>
          </div>
        </div>
      )}

      {/* Users table */}
      <div
        style={{
          background:   'var(--card)',
          border:       '1px solid var(--hair)',
          borderRadius: 14,
          boxShadow:    'var(--shadow-sm)',
          overflow:     'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--paper-2)' }}>
              {[
                { label: 'Name',        align: 'left',  w: undefined },
                { label: 'Role',        align: 'left',  w: 120       },
                { label: 'Team',        align: 'left',  w: 180       },
                { label: 'Slack',       align: 'left',  w: 130       },
                { label: 'Last active', align: 'left',  w: 130       },
                { label: '',            align: 'right', w: 110       },
              ].map((h, i) => (
                <th
                  key={i}
                  style={{
                    textAlign:     h.align as 'left' | 'right',
                    padding:       '10px 18px',
                    fontFamily:    'var(--mono)',
                    fontSize:      10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color:         'var(--ink-3)',
                    fontWeight:    400,
                    borderBottom:  '1px solid var(--hair)',
                    width:         h.w,
                  }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, ui) => {
              const isEditing  = editingId === u.id
              const isPwdChange = changePwdId === u.id
              const pubTeam    = u.role === 'publisher' ? publisherTeam(u) : null
              const managerName = u.role === 'publisher' && u.manager_id
                ? (users.find(m => m.id === u.manager_id)?.full_name ?? null)
                : null

              return (
                <tr
                  key={u.id}
                  style={{ borderTop: ui > 0 ? '1px solid var(--hair)' : 'none', transition: 'background .12s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--paper-2)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >

                  {/* ── Name ──────────────────────────────────────── */}
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={u.full_name || u.email} role={u.role} size={34} />
                      <div style={{ minWidth: 0 }}>
                        {isEditing ? (
                          <StyledInput value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full name" narrow />
                        ) : (
                          <>
                            <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 7 }}>
                              {u.full_name || '—'}
                              {u.id === user.id && (
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 400 }}>you</span>
                              )}
                            </div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.email}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* ── Role ──────────────────────────────────────── */}
                  <td style={{ padding: '12px 18px' }}>
                    {isEditing ? (
                      <StyledSelect value={editRole} onChange={e => setEditRole(e.target.value as UserRole)} options={ROLE_OPTIONS} narrow />
                    ) : (
                      <RoleChip role={u.role} />
                    )}
                  </td>

                  {/* ── Team ──────────────────────────────────────── */}
                  <td style={{ padding: '12px 18px' }}>
                    {isEditing && (editRole === 'manager') ? (
                      /* Manager edit: team dropdown + add-new inline */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <StyledSelect
                          value={editTeamId}
                          onChange={e => setEditTeamId(e.target.value)}
                          options={teams.map(t => ({ value: t.id, label: t.name }))}
                          placeholder="— No team —"
                          narrow
                        />
                        {addingTeam ? (
                          <div style={{ display: 'flex', gap: 5 }}>
                            <StyledInput
                              value={newTeamName}
                              onChange={e => setNewTeamName(e.target.value)}
                              placeholder="Team name"
                              narrow
                            />
                            <button
                              onClick={createTeam}
                              disabled={creatingTeam}
                              style={{ padding: '6px 10px', borderRadius: 7, border: '1.5px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                            >
                              {creatingTeam ? <Loader2 size={11} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={11} />}
                            </button>
                            <button
                              onClick={() => { setAddingTeam(false); setNewTeamName('') }}
                              style={{ padding: '6px 8px', borderRadius: 7, border: '1.5px solid var(--hair-2)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ink-3)', flexShrink: 0 }}
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingTeam(true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: 0 }}
                          >
                            <Plus size={10} /> Add new team
                          </button>
                        )}
                      </div>
                    ) : isEditing && (editRole === 'publisher') ? (
                      /* Publisher edit: manager dropdown */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <FieldLabel>Manager</FieldLabel>
                        <StyledSelect
                          value={editManagerId}
                          onChange={e => setEditManagerId(e.target.value)}
                          options={managers.map(m => ({ value: m.id, label: m.full_name || m.email }))}
                          placeholder="— Unassigned —"
                          narrow
                        />
                      </div>
                    ) : (
                      /* Display */
                      <>
                        {u.role === 'manager' && (
                          u.team_name
                            ? <TeamChip name={u.team_name} />
                            : <span style={{ color: 'var(--hair-2)', fontSize: 12 }}>—</span>
                        )}
                        {u.role === 'publisher' && (
                          pubTeam?.name ? (
                            <div>
                              <TeamChip name={pubTeam.name} />
                              {managerName && (
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 3, letterSpacing: '0.06em' }}>
                                  via {managerName}
                                </div>
                              )}
                            </div>
                          ) : managerName ? (
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
                              {managerName}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--hair-2)', fontSize: 12 }}>—</span>
                          )
                        )}
                        {u.role === 'admin' && (
                          <span style={{ color: 'var(--hair-2)', fontSize: 12 }}>—</span>
                        )}
                      </>
                    )}
                  </td>

                  {/* ── Slack ─────────────────────────────────────── */}
                  <td style={{ padding: '12px 18px' }}>
                    {isEditing && editRole === 'manager' ? (
                      <StyledInput
                        value={editSlackUserId}
                        onChange={e => setEditSlackUserId(e.target.value)}
                        placeholder="U0123456789"
                        narrow
                      />
                    ) : u.role === 'manager' ? (
                      <span
                        style={{
                          display:       'inline-flex',
                          alignItems:    'center',
                          gap:           5,
                          fontFamily:    'var(--mono)',
                          fontSize:      10,
                          letterSpacing: '0.08em',
                          padding:       '4px 9px',
                          borderRadius:  6,
                          background:    u.slack_user_id ? 'var(--go-soft)' : 'var(--paper-2)',
                          border:        u.slack_user_id ? '1px solid color-mix(in oklab, var(--go) 30%, white)' : '1px solid var(--hair-2)',
                          color:         u.slack_user_id ? 'var(--go-ink)' : 'var(--ink-3)',
                        }}
                      >
                        <Hash size={10} />
                        {u.slack_user_id ? 'Connected' : 'Not set'}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--hair-2)', fontSize: 12 }}>—</span>
                    )}
                  </td>

                  {/* ── Last active ───────────────────────────────── */}
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>
                      {u.created_at ? formatDate(u.created_at) : '—'}
                    </span>
                  </td>

                  {/* ── Actions ───────────────────────────────────── */}
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>

                      {isPwdChange ? (
                        <>
                          <StyledInput value={changePwd} onChange={e => setChangePwd(e.target.value)} placeholder="New password (min 8)" type="password" narrow />
                          <button
                            onClick={() => changePassword(u.id)}
                            disabled={savingPwd}
                            title="Save password"
                            style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--go-ink)', cursor: 'pointer', transition: 'background .12s', opacity: savingPwd ? 0.5 : 1 }}
                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--go-soft)')}
                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                          >
                            {savingPwd ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={14} />}
                          </button>
                          <button
                            onClick={() => { setChangePwdId(null); setChangePwd('') }}
                            title="Cancel"
                            style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', transition: 'background .12s' }}
                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--paper-2)')}
                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                          >
                            <X size={14} />
                          </button>
                        </>

                      ) : isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(u)}
                            title="Save"
                            style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--go-ink)', cursor: 'pointer', transition: 'background .12s' }}
                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--go-soft)')}
                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            title="Cancel"
                            style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', transition: 'background .12s' }}
                            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--paper-2)')}
                            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                          >
                            <X size={14} />
                          </button>
                        </>

                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(u)}
                            title="Edit"
                            style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', transition: 'all .12s' }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--paper-2)'; el.style.color = 'var(--ink)' }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--ink-3)' }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => { setChangePwdId(u.id); setChangePwd('') }}
                            title="Change password"
                            style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', transition: 'all .12s' }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--b-soft)'; el.style.color = 'var(--b-ink)' }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--ink-3)' }}
                          >
                            <KeyRound size={13} />
                          </button>
                          {u.id !== user.id && (
                            <button
                              onClick={() => deleteUser(u.id)}
                              title="Delete"
                              style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', transition: 'all .12s' }}
                              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--a-soft)'; el.style.color = 'var(--a-ink)' }}
                              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--ink-3)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </>
                      )}

                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ padding: '10px 18px', borderTop: '1px solid var(--hair)', background: 'var(--paper-2)' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>
            {users.length} user{users.length !== 1 ? 's' : ''} · {teams.length} team{teams.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
