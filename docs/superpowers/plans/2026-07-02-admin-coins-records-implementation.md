# Admin Coins Records Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the admin `Coins` tab into a player-centered coin management board with confirmation dialogs, and make admin check-in records scroll inside their own panel.

**Architecture:** Keep backend APIs unchanged. Evolve `TokenScreen` from a single grant form into an admin board that derives available coin inventory from `ChallengeSnapshot.fullCoverageTokens`, opens controlled dialogs for assign/remove actions, and calls existing `grantToken`/`invalidateToken` callbacks. Keep `AdminScreen` behavior intact while adding a focused internal scroller around recent check-ins.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS modules through global `styles.css`, existing `lucide-react` icons.

---

## File Structure

- Modify `web/src/screens/TokenScreen.tsx`
  - Add `challenge` and `onInvalidateToken` props.
  - Add player-card inventory view.
  - Add `AssignCoinDialog` and `RemoveCoinDialog` inside the same file to keep scope small.
  - Keep `PlayerCoinCard` markup inline for the first cut; extract only if the component becomes hard to scan during implementation.
  - Reuse current form defaults for normal and Albirroja assignment.

- Modify `web/src/App.tsx`
  - Pass `data.challenge` and an invalidate callback into `TokenScreen`.

- Modify `web/src/screens/AdminScreen.tsx`
  - Wrap the check-ins list body in an internal scroll container.

- Modify `web/src/styles.css`
  - Add coin admin board/card/dialog styles.
  - Add admin records scroller styles.

- Modify `web/src/test/renderSmoke.test.tsx`
  - Add player coin board test.
  - Update Albirroja assignment test for modal flow.
  - Add remove coin confirmation test.
  - Add test ensuring applied coins cannot be removed from `Coins`.

- Modify `web/src/test/designSystem.test.ts`
  - Add CSS assertion for check-ins internal scroller.

---

### Task 1: Add Failing Tests For Player Coin Board

**Files:**
- Modify: `web/src/test/renderSmoke.test.tsx`

- [ ] **Step 1: Write the failing player-card inventory test**

Add this test after the existing dashboard coin tests:

```tsx
test('token screen shows coin inventory cards by player', () => {
  render(
    <TokenScreen
      challenge={challengeWithCoins}
      participants={[rafa, clari]}
      selectedParticipant={rafa}
      adminParticipantId="rafa-id"
      onSubmit={async () => undefined}
      onInvalidateToken={async () => undefined}
    />
  );

  expect(screen.getByRole('heading', { name: 'Administrar coins' })).toBeInTheDocument();
  expect(screen.getByRole('article', { name: /coins de rafa/i })).toBeInTheDocument();
  expect(screen.getByRole('article', { name: /coins de clari/i })).toBeInTheDocument();
  expect(screen.getByText('Health coin x1')).toBeInTheDocument();
  expect(screen.getByText('Commit coin x0')).toBeInTheDocument();
  expect(screen.getByText('Flex coin x1')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /asignar coin/i })).toHaveLength(2);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
cd web; npm test -- src/test/renderSmoke.test.tsx -t "token screen shows coin inventory cards by player"
```

Expected: FAIL at TypeScript/React test compile or runtime because `TokenScreen` does not accept `challenge`/`onInvalidateToken` and does not render inventory cards.

---

### Task 2: Implement Player Coin Cards

**Files:**
- Modify: `web/src/screens/TokenScreen.tsx`
- Modify: `web/src/App.tsx`
- Modify: `web/src/test/renderSmoke.test.tsx`

- [ ] **Step 1: Update `TokenScreen` props and imports**

In `web/src/screens/TokenScreen.tsx`, update imports:

```tsx
import { Ban, CircleDollarSign, Save, X } from 'lucide-react';
import { type FormEvent, useMemo, useRef, useState } from 'react';
import type {
  ChallengeSnapshot,
  ExceptionReasonCategory,
  ExceptionTokenType,
  FullCoverageToken,
  GrantTokenRequest,
  Participant
} from '../api/types';
import {
  coinDisplayTone,
  coinTone,
  coinTypes,
  reasonCategoryLabel,
  specialCoinOptions,
  tokenDisplayLabel,
  tokenTypeLabel
} from '../components/format';
import { PlayerAvatar } from '../components/PlayerAvatar';
```

Update `TokenScreenProps`:

```tsx
interface TokenScreenProps {
  challenge: ChallengeSnapshot | null;
  participants: Participant[];
  selectedParticipant: Participant | null;
  adminParticipantId?: string | null;
  onSubmit: (request: GrantTokenRequest) => Promise<void>;
  onInvalidateToken: (id: string, reason?: string) => Promise<void>;
}
```

- [ ] **Step 2: Add helper functions in `TokenScreen.tsx`**

Place these helpers below `defaultReasonForType`:

```tsx
function isAvailableToken(token: FullCoverageToken): boolean {
  return token.status === 1;
}

function coinKey(token: Pick<FullCoverageToken, 'type' | 'specialCode'>): string {
  return token.specialCode?.trim() ? `special:${token.specialCode}` : `type:${token.type}`;
}

function availableTokensForParticipant(challenge: ChallengeSnapshot | null, participantId: string): FullCoverageToken[] {
  return (challenge?.fullCoverageTokens ?? [])
    .filter((token) => token.participantId === participantId && isAvailableToken(token))
    .sort((first, second) => tokenDisplayLabel(first).localeCompare(tokenDisplayLabel(second)));
}

function baseCoinCount(tokens: FullCoverageToken[], type: ExceptionTokenType): number {
  return tokens.filter((token) => !token.specialCode && token.type === type).length;
}

function specialCoinGroups(tokens: FullCoverageToken[]): Array<{ key: string; token: FullCoverageToken; count: number }> {
  const groups = new Map<string, { token: FullCoverageToken; count: number }>();

  for (const token of tokens) {
    if (!token.specialCode) {
      continue;
    }

    const key = coinKey(token);
    const existing = groups.get(key);
    groups.set(key, {
      token,
      count: (existing?.count ?? 0) + 1
    });
  }

  return [...groups.entries()].map(([key, value]) => ({ key, ...value }));
}
```

- [ ] **Step 3: Replace the single-form render with board markup**

Keep the existing form state and submit logic, but render:

```tsx
export function TokenScreen({ challenge, participants, selectedParticipant, adminParticipantId, onSubmit, onInvalidateToken }: TokenScreenProps) {
  const activeParticipants = useMemo(() => participants.filter((participant) => participant.active), [participants]);
  const [participantId, setParticipantId] = useState(selectedParticipant?.id ?? activeParticipants[0]?.id ?? '');
  const [assigningParticipantId, setAssigningParticipantId] = useState<string | null>(null);
  const [removeToken, setRemoveToken] = useState<FullCoverageToken | null>(null);
  const [type, setType] = useState<ExceptionTokenType>(0);
  const [reasonCategory, setReasonCategory] = useState<ExceptionReasonCategory>(0);
  const [variant, setVariant] = useState<TokenVariant>('normal');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const assignButtonRef = useRef<HTMLButtonElement | null>(null);
  const removeButtonRef = useRef<HTMLButtonElement | null>(null);
  const totalAvailable = useMemo(
    () => (challenge?.fullCoverageTokens ?? []).filter(isAvailableToken).length,
    [challenge]
  );
  const specialAvailable = useMemo(
    () => (challenge?.fullCoverageTokens ?? []).filter((token) => isAvailableToken(token) && Boolean(token.specialCode)).length,
    [challenge]
  );

  function openAssignDialog(nextParticipantId: string, trigger: HTMLButtonElement) {
    setParticipantId(nextParticipantId);
    assignButtonRef.current = trigger;
    setAssigningParticipantId(nextParticipantId);
    setError(null);
    setMessage(null);
  }

  function closeAssignDialog() {
    setAssigningParticipantId(null);
    assignButtonRef.current?.focus();
  }

  function openRemoveDialog(token: FullCoverageToken, trigger: HTMLButtonElement) {
    setRemoveToken(token);
    removeButtonRef.current = trigger;
    setError(null);
    setMessage(null);
  }

  function closeRemoveDialog() {
    setRemoveToken(null);
    removeButtonRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const actorId = adminParticipantId || selectedParticipant?.id;
    if (!participantId || !actorId) {
      setError('Falta jugador para otorgar coin.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await onSubmit({
        participantId,
        type,
        reasonCategory,
        assignedByAdminId: actorId,
        notes: notes.trim() || null,
        specialCode: variant === 'normal' ? null : variant
      });
      setMessage('Coin asignada.');
      setNotes('');
      closeAssignDialog();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo asignar coin.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveToken() {
    const actorId = adminParticipantId || selectedParticipant?.id;
    if (!removeToken || !actorId) {
      setError('Falta coin para quitar.');
      return;
    }

    setRemoving(true);
    setError(null);
    setMessage(null);

    try {
      await onInvalidateToken(removeToken.id, `Admin ${actorId}`);
      setMessage('Coin quitada.');
      closeRemoveDialog();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'No se pudo quitar coin.');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="panel-section coin-admin-screen" aria-labelledby="token-title">
      <div className="section-heading section-heading--with-action">
        <div>
          <span className="eyebrow">Power-up</span>
          <h2 id="token-title">Administrar coins</h2>
        </div>
      </div>
      <div className="coin-admin-summary" aria-label="Resumen de coins">
        <span><strong>{activeParticipants.length}</strong> players</span>
        <span><strong>{totalAvailable}</strong> disponibles</span>
        <span><strong>{specialAvailable}</strong> especiales</span>
      </div>
      {message ? <div className="alert alert--success">{message}</div> : null}
      {error && !assigningParticipantId && !removeToken ? <div className="alert alert--danger">{error}</div> : null}
      <div className="coin-admin-grid">
        {activeParticipants.map((participant) => {
          const availableTokens = availableTokensForParticipant(challenge, participant.id);
          const specials = specialCoinGroups(availableTokens);

          return (
            <article className="player-coin-card" key={participant.id} aria-label={`Coins de ${participant.displayName}`}>
              <div className="player-coin-card__header">
                <PlayerAvatar participant={participant} />
                <div>
                  <h3>{participant.displayName}</h3>
                  <span>@{participant.username}</span>
                </div>
              </div>
              <div className="player-coin-card__counts" aria-label={`Conteos de coins de ${participant.displayName}`}>
                {coinTypes.map((coinType) => (
                  <span className={`coin-chip coin-chip--${coinTone(coinType)}`} key={coinType}>
                    <span>{tokenTypeLabel(coinType)} x{baseCoinCount(availableTokens, coinType)}</span>
                  </span>
                ))}
                {specials.map((group) => (
                  <span className={`coin-chip coin-chip--${coinDisplayTone(group.token)}`} key={group.key}>
                    <span>{tokenDisplayLabel(group.token)} x{group.count}</span>
                  </span>
                ))}
              </div>
              <div className="player-coin-card__available">
                <strong>Disponibles</strong>
                {availableTokens.length ? (
                  availableTokens.map((token) => (
                    <div className="player-coin-token-row" key={token.id}>
                      <span>{tokenDisplayLabel(token)}</span>
                      <button
                        className="button button--danger"
                        type="button"
                        onClick={(event) => openRemoveDialog(token, event.currentTarget)}
                      >
                        <Ban aria-hidden="true" />
                        Quitar
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="empty-state">Sin coins disponibles.</span>
                )}
              </div>
              <button
                className="button button--quaternary"
                type="button"
                onClick={(event) => openAssignDialog(participant.id, event.currentTarget)}
              >
                <CircleDollarSign aria-hidden="true" />
                Asignar coin
              </button>
            </article>
          );
        })}
      </div>
      {assigningParticipantId ? (
        <AssignCoinDialog
          participants={activeParticipants}
          participantId={participantId}
          type={type}
          reasonCategory={reasonCategory}
          variant={variant}
          notes={notes}
          submitting={submitting}
          error={error}
          onSubmit={handleSubmit}
          onClose={closeAssignDialog}
          onVariantChange={(nextVariant) => {
            setVariant(nextVariant);
            if (nextVariant === 'albirroja') {
              setType(1);
              setReasonCategory(4);
            }
          }}
          onTypeChange={(nextType) => {
            setType(nextType);
            setReasonCategory(defaultReasonForType(nextType));
          }}
          onReasonChange={setReasonCategory}
          onNotesChange={setNotes}
        />
      ) : null}
      {removeToken ? (
        <RemoveCoinDialog
          token={removeToken}
          participant={activeParticipants.find((participant) => participant.id === removeToken.participantId) ?? null}
          removing={removing}
          error={error}
          onConfirm={handleRemoveToken}
          onClose={closeRemoveDialog}
        />
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: Add `AssignCoinDialog` and `RemoveCoinDialog` to `TokenScreen.tsx`**

Append these components below `TokenScreen`:

```tsx
interface AssignCoinDialogProps {
  participants: Participant[];
  participantId: string;
  type: ExceptionTokenType;
  reasonCategory: ExceptionReasonCategory;
  variant: TokenVariant;
  notes: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onClose: () => void;
  onVariantChange: (variant: TokenVariant) => void;
  onTypeChange: (type: ExceptionTokenType) => void;
  onReasonChange: (reason: ExceptionReasonCategory) => void;
  onNotesChange: (notes: string) => void;
}

function AssignCoinDialog({
  participants,
  participantId,
  type,
  reasonCategory,
  variant,
  notes,
  submitting,
  error,
  onSubmit,
  onClose,
  onVariantChange,
  onTypeChange,
  onReasonChange,
  onNotesChange
}: AssignCoinDialogProps) {
  const participant = participants.find((item) => item.id === participantId);

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="assign-coin-title">
        <div className="dialog-panel__header">
          <div>
            <span className="eyebrow">Confirmacion</span>
            <h3 id="assign-coin-title">Asignar coin</h3>
          </div>
          <button className="icon-button" type="button" aria-label="Cerrar asignacion de coin" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </div>
        <form className="arcade-form" onSubmit={onSubmit}>
          <div className="dialog-player-lock">
            <strong>{participant?.displayName ?? 'Player'}</strong>
            <span>Player seleccionado</span>
          </div>
          <label htmlFor="token-variant">Variante</label>
          <select id="token-variant" value={variant} onChange={(event) => onVariantChange(event.currentTarget.value as TokenVariant)}>
            <option value="normal">Normal</option>
            {specialCoinOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          <label htmlFor="token-type">Tipo</label>
          <select id="token-type" value={type} disabled={variant !== 'normal'} onChange={(event) => onTypeChange(Number(event.currentTarget.value) as ExceptionTokenType)}>
            {tokenTypeOptions.map((option) => (
              <option key={option} value={option}>
                {tokenTypeLabel(option)}
              </option>
            ))}
          </select>
          <label htmlFor="token-reason">Motivo</label>
          <select id="token-reason" value={reasonCategory} disabled={variant !== 'normal'} onChange={(event) => onReasonChange(Number(event.currentTarget.value) as ExceptionReasonCategory)}>
            {reasonOptions.map((option) => (
              <option key={option} value={option}>
                {reasonCategoryLabel(option)}
              </option>
            ))}
          </select>
          <label htmlFor="token-notes">Notas</label>
          <textarea id="token-notes" rows={3} value={notes} onChange={(event) => onNotesChange(event.currentTarget.value)} placeholder="Justificacion breve" />
          {error ? <div className="alert alert--danger">{error}</div> : null}
          <div className="dialog-actions">
            <button className="button button--secondary" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="button button--quaternary" type="submit" disabled={submitting || !participantId}>
              {submitting ? <CircleDollarSign aria-hidden="true" /> : <Save aria-hidden="true" />}
              Confirmar asignacion
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface RemoveCoinDialogProps {
  token: FullCoverageToken;
  participant: Participant | null;
  removing: boolean;
  error: string | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

function RemoveCoinDialog({ token, participant, removing, error, onConfirm, onClose }: RemoveCoinDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="remove-coin-title">
        <div className="dialog-panel__header">
          <div>
            <span className="eyebrow">Confirmacion</span>
            <h3 id="remove-coin-title">Quitar coin</h3>
          </div>
          <button className="icon-button" type="button" aria-label="Cerrar quitar coin" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </div>
        <p className="dialog-copy">
          Quitar {tokenDisplayLabel(token)} de {participant?.displayName ?? 'este player'}.
        </p>
        {token.notes ? <p className="dialog-note">{token.notes}</p> : null}
        {error ? <div className="alert alert--danger">{error}</div> : null}
        <div className="dialog-actions">
          <button className="button button--secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button button--danger" type="button" disabled={removing} onClick={() => void onConfirm()}>
            <Ban aria-hidden="true" />
            Quitar coin
          </button>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Update `App.tsx` `TokenScreen` usage**

Replace the existing `TokenScreen` render with:

```tsx
<TokenScreen
  challenge={data.challenge}
  participants={data.participants}
  selectedParticipant={selectedParticipant}
  adminParticipantId={data.challenge?.challenge.adminParticipantId}
  onSubmit={async (request) => {
    await gymChallApi.grantToken(request);
    await data.refresh();
  }}
  onInvalidateToken={async (id, reason) => {
    await gymChallApi.invalidateToken(id, {
      actorParticipantId: selectedParticipant.id,
      reason: reason ?? 'Panel coins'
    });
    await data.refresh();
  }}
/>
```

- [ ] **Step 6: Update existing `TokenScreen` tests to pass new props**

Every `TokenScreen` render in `web/src/test/renderSmoke.test.tsx` must include:

```tsx
challenge={challenge}
onInvalidateToken={async () => undefined}
```

For tests that need coins, pass `challengeWithCoins` or `challengeWithSpecialCoin`.

- [ ] **Step 7: Run focused player-card test and verify pass**

Run:

```powershell
cd web; npm test -- src/test/renderSmoke.test.tsx -t "token screen shows coin inventory cards by player"
```

Expected: PASS.

---

### Task 3: Add Failing Tests For Assign Dialog

**Files:**
- Modify: `web/src/test/renderSmoke.test.tsx`

- [ ] **Step 1: Replace the current Albirroja test body with modal flow**

Update `test('token screen submits albirroja as a special coin with commit defaults', ...)`:

```tsx
test('token screen submits albirroja as a special coin with commit defaults', async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);

  render(
    <TokenScreen
      challenge={challengeWithSpecialCoin}
      participants={[rafa, clari]}
      selectedParticipant={rafa}
      adminParticipantId="rafa-id"
      onSubmit={onSubmit}
      onInvalidateToken={async () => undefined}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /asignar coin a clari/i }));
  expect(screen.getByRole('dialog', { name: /asignar coin/i })).toBeInTheDocument();
  expect(screen.getByText('Clari')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Variante'), { target: { value: 'albirroja' } });
  fireEvent.click(screen.getByRole('button', { name: /confirmar asignacion/i }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      participantId: 'clari-id',
      type: 1,
      reasonCategory: 4,
      assignedByAdminId: 'rafa-id',
      notes: null,
      specialCode: 'albirroja'
    });
  });
});
```

- [ ] **Step 2: Run focused assign test and verify it fails**

Run:

```powershell
cd web; npm test -- src/test/renderSmoke.test.tsx -t "token screen submits albirroja"
```

Expected: FAIL because assign buttons do not yet have player-specific accessible names.

---

### Task 4: Make Assign Buttons Player-Specific And Verify Dialog

**Files:**
- Modify: `web/src/screens/TokenScreen.tsx`

- [ ] **Step 1: Add player-specific accessible name to assign buttons**

In the player card assign button, add:

```tsx
aria-label={`Asignar coin a ${participant.displayName}`}
```

The button becomes:

```tsx
<button
  className="button button--quaternary"
  type="button"
  aria-label={`Asignar coin a ${participant.displayName}`}
  onClick={(event) => openAssignDialog(participant.id, event.currentTarget)}
>
  <CircleDollarSign aria-hidden="true" />
  Asignar coin
</button>
```

- [ ] **Step 2: Run focused assign test and verify pass**

Run:

```powershell
cd web; npm test -- src/test/renderSmoke.test.tsx -t "token screen submits albirroja"
```

Expected: PASS.

---

### Task 5: Add Failing Tests For Remove Confirmation

**Files:**
- Modify: `web/src/test/renderSmoke.test.tsx`

- [ ] **Step 1: Add challenge fixture with available and applied coins**

Add near `challengeWithCoins`:

```tsx
const challengeWithMixedCoinStates: ChallengeSnapshot = {
  ...challenge,
  fullCoverageTokens: [
    {
      id: 'available-health-coin-id',
      challengeId: 'challenge-id',
      participantId: 'clari-id',
      targetDate: '2026-07-01',
      type: 0,
      reasonCategory: 0,
      status: 1,
      notes: 'mensual'
    },
    {
      id: 'applied-flex-coin-id',
      challengeId: 'challenge-id',
      participantId: 'clari-id',
      targetDate: '2026-07-02',
      type: 2,
      reasonCategory: 4,
      status: 0,
      notes: 'usada'
    }
  ]
};
```

- [ ] **Step 2: Add remove confirmation test**

Add after the Albirroja test:

```tsx
test('token screen removes an available coin only after confirmation', async () => {
  const onInvalidateToken = vi.fn().mockResolvedValue(undefined);

  render(
    <TokenScreen
      challenge={challengeWithMixedCoinStates}
      participants={[rafa, clari]}
      selectedParticipant={rafa}
      adminParticipantId="rafa-id"
      onSubmit={async () => undefined}
      onInvalidateToken={onInvalidateToken}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /quitar health coin de clari/i }));

  expect(screen.getByRole('dialog', { name: /quitar coin/i })).toBeInTheDocument();
  expect(screen.getByText(/quitar health coin de clari/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^quitar coin$/i }));

  await waitFor(() => {
    expect(onInvalidateToken).toHaveBeenCalledWith('available-health-coin-id', 'Admin rafa-id');
  });
});
```

- [ ] **Step 3: Add applied coin non-removable test**

Add:

```tsx
test('token screen does not expose remove actions for applied coins', () => {
  render(
    <TokenScreen
      challenge={challengeWithMixedCoinStates}
      participants={[rafa, clari]}
      selectedParticipant={rafa}
      adminParticipantId="rafa-id"
      onSubmit={async () => undefined}
      onInvalidateToken={async () => undefined}
    />
  );

  expect(screen.queryByRole('button', { name: /quitar flex coin de clari/i })).not.toBeInTheDocument();
  expect(screen.getByText('Flex coin x0')).toBeInTheDocument();
});
```

- [ ] **Step 4: Run focused remove tests and verify failure**

Run:

```powershell
cd web; npm test -- src/test/renderSmoke.test.tsx -t "token screen removes|token screen does not expose remove"
```

Expected: FAIL because remove buttons do not yet have coin/player-specific accessible names and dialog copy may be case-sensitive.

---

### Task 6: Complete Remove Button Accessibility

**Files:**
- Modify: `web/src/screens/TokenScreen.tsx`

- [ ] **Step 1: Add accessible name to remove button**

In the token row remove button, add:

```tsx
aria-label={`Quitar ${tokenDisplayLabel(token)} de ${participant.displayName}`}
```

The button becomes:

```tsx
<button
  className="button button--danger"
  type="button"
  aria-label={`Quitar ${tokenDisplayLabel(token)} de ${participant.displayName}`}
  onClick={(event) => openRemoveDialog(token, event.currentTarget)}
>
  <Ban aria-hidden="true" />
  Quitar
</button>
```

- [ ] **Step 2: Run focused remove tests and verify pass**

Run:

```powershell
cd web; npm test -- src/test/renderSmoke.test.tsx -t "token screen removes|token screen does not expose remove"
```

Expected: PASS.

---

### Task 7: Add Styling For Coin Board And Dialogs

**Files:**
- Modify: `web/src/styles.css`

- [ ] **Step 1: Add coin admin CSS**

Add near existing coin/admin styles:

```css
.coin-admin-screen {
  display: grid;
  gap: 18px;
}

.coin-admin-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.coin-admin-summary span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 12px;
  border: 2px solid var(--border);
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--primary);
  font-weight: 800;
}

.coin-admin-grid {
  display: grid;
  gap: 16px;
}

.player-coin-card {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 18px;
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-sticker-sm);
}

.player-coin-card__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.player-coin-card__header h3,
.player-coin-card__header span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-coin-card__header span {
  color: var(--muted);
  font-weight: 800;
}

.player-coin-card__counts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.player-coin-card__available {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 2px solid var(--border-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
}

.player-coin-token-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 8px;
  border: 2px solid var(--border-soft);
  border-radius: 12px;
  background: var(--surface);
}

.player-coin-token-row span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 800;
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(20, 22, 21, 0.38);
}

.dialog-panel {
  display: grid;
  gap: 16px;
  width: min(100%, 520px);
  max-height: min(88vh, 720px);
  overflow: auto;
  overscroll-behavior: contain;
  padding: 18px;
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-sticker);
}

.dialog-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.dialog-player-lock,
.dialog-note {
  padding: 12px;
  border: 2px solid var(--border-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
}

.dialog-player-lock strong,
.dialog-player-lock span {
  display: block;
}

.dialog-player-lock span,
.dialog-copy,
.dialog-note {
  color: var(--muted);
  font-weight: 800;
}

.dialog-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-actions .button {
  width: auto;
  margin-top: 0;
}
```

- [ ] **Step 2: Add desktop grid CSS**

Inside `@media (min-width: 640px)`, add `.coin-admin-grid`:

```css
.coin-admin-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

- [ ] **Step 3: Run frontend build**

Run:

```powershell
cd web; npm run build
```

Expected: PASS.

---

### Task 8: Add Internal Check-In Records Scroller

**Files:**
- Modify: `web/src/screens/AdminScreen.tsx`
- Modify: `web/src/styles.css`
- Modify: `web/src/test/designSystem.test.ts`

- [ ] **Step 1: Write failing CSS assertion**

In `web/src/test/designSystem.test.ts`, add to the admin/calendar style test or create a new test:

```ts
test('admin records check-ins list has its own scroller', () => {
  expect(styles).toMatch(/\.admin-list__scroller\s*{[\s\S]*?max-height:\s*min\(54vh,\s*420px\);[\s\S]*?overflow:\s*auto;/);
  expect(styles).toMatch(/\.admin-list__scroller:focus-visible\s*{[\s\S]*?outline:\s*3px solid var\(--focus\);/);
});
```

- [ ] **Step 2: Run design test and verify it fails**

Run:

```powershell
cd web; npm test -- src/test/designSystem.test.ts -t "admin records check-ins list has its own scroller"
```

Expected: FAIL because `.admin-list__scroller` does not exist.

- [ ] **Step 3: Wrap check-ins rows in `AdminScreen.tsx`**

In `AdminScreen`, inside the `Check-ins` `article`, replace the direct conditional list with:

```tsx
<div className="admin-list__scroller" tabIndex={0} aria-label="Check-ins recientes">
  {recentCheckIns.length ? (
    recentCheckIns.map((checkIn) => (
      <div className="record-row" key={checkIn.id}>
        <div>
          <strong>{checkIn.participantName}</strong>
          <span>
            {formatShortDate(checkIn.activityDate)} - {checkInTypeLabel(checkIn.type)}
          </span>
          {checkIn.notes ? <small>{checkIn.notes}</small> : null}
        </div>
        <span className={`badge badge--${statusTone(checkIn.status)}`}>{checkIn.status}</span>
        <button
          className="icon-button icon-button--danger"
          type="button"
          aria-label={`Invalidar check-in de ${checkIn.participantName}`}
          disabled={busyAction === checkIn.id || checkIn.status.toLowerCase() !== 'valid'}
          onClick={() =>
            runAdminAction(
              checkIn.id,
              () => onInvalidateCheckIn(checkIn.id, `Admin ${adminParticipantId}`),
              'Check-in invalidado.'
            )
          }
        >
          <Ban aria-hidden="true" />
        </button>
      </div>
    ))
  ) : (
    <p className="empty-state">Sin check-ins recientes.</p>
  )}
</div>
```

- [ ] **Step 4: Add scroller CSS**

In `web/src/styles.css`, near `.admin-list`, add:

```css
.admin-list__scroller {
  display: grid;
  gap: 16px;
  max-height: min(54vh, 420px);
  overflow: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
}

.admin-list__scroller:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 3px;
}
```

- [ ] **Step 5: Run design test and verify pass**

Run:

```powershell
cd web; npm test -- src/test/designSystem.test.ts -t "admin records check-ins list has its own scroller"
```

Expected: PASS.

---

### Task 9: Full Frontend Verification

**Files:**
- Verify all modified frontend files.

- [ ] **Step 1: Run render smoke tests**

Run:

```powershell
cd web; npm test -- src/test/renderSmoke.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run all frontend tests**

Run:

```powershell
cd web; npm test
```

Expected: PASS.

- [ ] **Step 3: Build frontend**

Run:

```powershell
cd web; npm run build
```

Expected: PASS.

---

### Task 10: Whole-Repo Verification

**Files:**
- Verify backend was not regressed by TypeScript-only work.

- [ ] **Step 1: Run .NET test suite**

Run:

```powershell
dotnet test GymChall.sln
```

Expected: PASS. Existing `SQLitePCLRaw.lib.e_sqlite3` vulnerability warning may appear and is not caused by this feature.

- [ ] **Step 2: Inspect git diff**

Run:

```powershell
git diff --stat
git status --short
```

Expected: changes limited to:

```text
web/src/screens/TokenScreen.tsx
web/src/App.tsx
web/src/screens/AdminScreen.tsx
web/src/styles.css
web/src/test/renderSmoke.test.tsx
web/src/test/designSystem.test.ts
docs/superpowers/plans/2026-07-02-admin-coins-records-implementation.md
```

- [ ] **Step 3: Commit implementation**

Run:

```powershell
git add -- web/src/screens/TokenScreen.tsx web/src/App.tsx web/src/screens/AdminScreen.tsx web/src/styles.css web/src/test/renderSmoke.test.tsx web/src/test/designSystem.test.ts docs/superpowers/plans/2026-07-02-admin-coins-records-implementation.md
git commit -m "feat: administrar coins por player"
```

Expected: commit created with UI, tests, styles, and plan.
