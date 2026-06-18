import { HeartPulse, LockKeyhole, Ruler, Save, Scale, ShieldCheck } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import type {
  ChangePinRequest,
  Participant,
  ParticipantProfile,
  UpdateParticipantProfileRequest
} from '../api/types';
import { PlayerAvatar } from '../components/PlayerAvatar';

interface ProfileScreenProps {
  participant: Participant;
  onLoadProfile: (participantId: string) => Promise<ParticipantProfile>;
  onSaveProfile: (request: UpdateParticipantProfileRequest) => Promise<ParticipantProfile>;
  onChangePin: (request: ChangePinRequest) => Promise<void>;
}

type BusyAction = 'profile' | 'pin' | null;
type BmiTone = 'neutral' | 'success' | 'warning' | 'danger';

function normalizePin(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}

function metricDraft(value: number | null | undefined): string {
  return typeof value === 'number' ? value.toString() : '';
}

function parseMetric(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function calculateBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function bmiCopy(value: number | null): string {
  if (value === null) {
    return 'Completa peso y altura';
  }

  return 'Referencia general, no diagnostico';
}

function bmiCategory(value: number | null): { label: string; tone: BmiTone } {
  if (value === null) {
    return { label: 'Sin datos', tone: 'neutral' };
  }

  if (value < 18.5) {
    return { label: 'Bajo peso', tone: 'warning' };
  }

  if (value < 25) {
    return { label: 'Peso saludable', tone: 'success' };
  }

  if (value < 30) {
    return { label: 'Sobrepeso', tone: 'warning' };
  }

  return { label: 'Obesidad', tone: 'danger' };
}

function profileMismatchMessage(participant: Participant): string {
  return `El perfil cargado no coincide con el participante seleccionado (${participant.displayName}). Cerrá sesión y volvé a ingresar con ese usuario.`;
}

export function ProfileScreen({ participant, onLoadProfile, onSaveProfile, onChangePin }: ProfileScreenProps) {
  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [metrics, setMetrics] = useState({ weightKg: '', heightCm: '' });
  const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' });
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [profileBlocked, setProfileBlocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProfile(null);
    setMetrics({ weightKg: '', heightCm: '' });
    setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
    setProfileBlocked(false);
    setError(null);
    setMessage(null);

    onLoadProfile(participant.id)
      .then((loadedProfile) => {
        if (cancelled) {
          return;
        }

        if (loadedProfile.id !== participant.id) {
          setProfileBlocked(true);
          setProfile(null);
          setMetrics({ weightKg: '', heightCm: '' });
          setError(profileMismatchMessage(participant));
          return;
        }

        setProfile(loadedProfile);
        setMetrics({
          weightKg: metricDraft(loadedProfile.weightKg),
          heightCm: metricDraft(loadedProfile.heightCm)
        });
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el perfil.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onLoadProfile, participant.id]);

  const parsedWeight = parseMetric(metrics.weightKg);
  const parsedHeight = parseMetric(metrics.heightCm);
  const liveBmi = useMemo(
    () => calculateBmi(parsedWeight, parsedHeight),
    [parsedHeight, parsedWeight]
  );
  const liveBmiCategory = bmiCategory(liveBmi);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const weightKg = parseMetric(metrics.weightKg);
    const heightCm = parseMetric(metrics.heightCm);

    if ((weightKg !== null && Number.isNaN(weightKg)) || (heightCm !== null && Number.isNaN(heightCm))) {
      setError('Peso y altura tienen que ser numeros.');
      return;
    }

    if (profileBlocked) {
      setError(profileMismatchMessage(participant));
      return;
    }

    setBusyAction('profile');
    setError(null);
    setMessage(null);

    try {
      const updatedProfile = await onSaveProfile({
        participantId: participant.id,
        weightKg,
        heightCm
      });

      if (updatedProfile.id !== participant.id) {
        setProfileBlocked(true);
        setProfile(null);
        setMetrics({ weightKg: '', heightCm: '' });
        setError(profileMismatchMessage(participant));
        return;
      }

      setProfile(updatedProfile);
      setMetrics({
        weightKg: metricDraft(updatedProfile.weightKg),
        heightCm: metricDraft(updatedProfile.heightCm)
      });
      setMessage('Perfil actualizado.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el perfil.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleChangePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (profileBlocked) {
      setError(profileMismatchMessage(participant));
      return;
    }

    if (!/^\d{4,6}$/.test(pinForm.currentPin) || !/^\d{4,6}$/.test(pinForm.newPin)) {
      setError('El PIN debe tener 4 a 6 numeros.');
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      setError('La confirmacion no coincide.');
      return;
    }

    setBusyAction('pin');
    setError(null);
    setMessage(null);

    try {
      await onChangePin({
        participantId: participant.id,
        currentPin: pinForm.currentPin,
        newPin: pinForm.newPin
      });
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      setMessage('PIN actualizado.');
    } catch (pinError) {
      setError(pinError instanceof Error ? pinError.message : 'No se pudo cambiar el PIN.');
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="screen-stack">
      <section className="panel-section profile-screen" aria-labelledby="profile-title">
        <div className="section-heading section-heading--with-action">
          <div>
            <span className="eyebrow">Player config</span>
            <h2 id="profile-title">Mi perfil</h2>
          </div>
          <span className="private-pill">
            <LockKeyhole aria-hidden="true" />
            Privado
          </span>
        </div>

        <article className="profile-player-card">
          <PlayerAvatar participant={participant} />
          <div>
            <strong>{profile?.displayName ?? participant.displayName}</strong>
            <span>@{profile?.username ?? participant.username}</span>
          </div>
        </article>

        {loading ? <div className="alert alert--brand">Cargando perfil...</div> : null}
        {message ? <div className="alert alert--success">{message}</div> : null}
        {error ? <div className="alert alert--danger">{error}</div> : null}

        <div className="profile-grid">
          <form className="arcade-form profile-form" onSubmit={handleSaveProfile}>
            <h3>Datos fitness</h3>
            <div className="profile-metric-fields">
              <label htmlFor="profile-weight">
                <Scale aria-hidden="true" />
                Peso kg
                <input
                  id="profile-weight"
                  inputMode="decimal"
                  min={20}
                  max={400}
                  step="0.1"
                  type="number"
                  value={metrics.weightKg}
                  onChange={(event) => {
                    const weightKg = event.currentTarget.value;
                    setMetrics((current) => ({ ...current, weightKg }));
                  }}
                  placeholder="82.4"
                />
              </label>
              <label htmlFor="profile-height">
                <Ruler aria-hidden="true" />
                Altura cm
                <input
                  id="profile-height"
                  inputMode="decimal"
                  min={80}
                  max={250}
                  step="0.1"
                  type="number"
                  value={metrics.heightCm}
                  onChange={(event) => {
                    const heightCm = event.currentTarget.value;
                    setMetrics((current) => ({ ...current, heightCm }));
                  }}
                  placeholder="178"
                />
              </label>
            </div>

            <div className="bmi-panel">
              <span className="bmi-panel__icon" aria-hidden="true">
                <HeartPulse />
              </span>
              <div>
                <span>IMC estimado</span>
                <strong>{liveBmi === null ? '--' : liveBmi.toFixed(1).replace('.0', '')}</strong>
                <span className={`bmi-panel__category bmi-panel__category--${liveBmiCategory.tone}`}>
                  {liveBmiCategory.label}
                </span>
                <small>{bmiCopy(liveBmi)}</small>
              </div>
            </div>

            <button className="button button--secondary" type="submit" disabled={busyAction === 'profile' || loading || profileBlocked}>
              <Save aria-hidden="true" />
              Guardar datos
            </button>
          </form>

          <form className="arcade-form profile-form" onSubmit={handleChangePin}>
            <h3>Contrasena PIN</h3>
            <label htmlFor="current-pin">PIN actual</label>
            <input
              id="current-pin"
              autoComplete="current-password"
              inputMode="numeric"
              maxLength={6}
              minLength={4}
              pattern="[0-9]*"
              type="password"
              value={pinForm.currentPin}
              onChange={(event) => {
                const currentPin = normalizePin(event.currentTarget.value);
                setPinForm((current) => ({ ...current, currentPin }));
              }}
            />
            <label htmlFor="new-pin">Nuevo PIN</label>
            <input
              id="new-pin"
              autoComplete="new-password"
              inputMode="numeric"
              maxLength={6}
              minLength={4}
              pattern="[0-9]*"
              type="password"
              value={pinForm.newPin}
              onChange={(event) => {
                const newPin = normalizePin(event.currentTarget.value);
                setPinForm((current) => ({ ...current, newPin }));
              }}
            />
            <label htmlFor="confirm-pin">Confirmar PIN</label>
            <input
              id="confirm-pin"
              autoComplete="new-password"
              inputMode="numeric"
              maxLength={6}
              minLength={4}
              pattern="[0-9]*"
              type="password"
              value={pinForm.confirmPin}
              onChange={(event) => {
                const confirmPin = normalizePin(event.currentTarget.value);
                setPinForm((current) => ({ ...current, confirmPin }));
              }}
            />
            <button className="button button--dark" type="submit" disabled={busyAction === 'pin' || loading || profileBlocked}>
              <ShieldCheck aria-hidden="true" />
              Cambiar PIN
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
