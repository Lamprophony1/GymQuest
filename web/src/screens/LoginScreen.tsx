import { Delete, LogIn } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { LoginOption, LoginRequest } from '../api/types';
import { BrandMark } from '../components/BrandMark';

interface LoginScreenProps {
  options: LoginOption[];
  loading: boolean;
  error: string | null;
  onLogin: (request: LoginRequest) => Promise<unknown> | unknown;
}

const keypadNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const minLoginPinLength = 4;
const maxLoginPinLength = 6;

export function LoginScreen({ options, loading, error, onLogin }: LoginScreenProps) {
  const [selectedParticipantId, setSelectedParticipantId] = useState(options[0]?.id ?? '');
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [loginInFlight, setLoginInFlight] = useState(false);
  const submittedAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedParticipantId || !options.some((option) => option.id === selectedParticipantId)) {
      setSelectedParticipantId(options[0]?.id ?? '');
      setPin('');
      submittedAttemptRef.current = null;
    }
  }, [options, selectedParticipantId]);

  useEffect(() => {
    if (error) {
      setLocalError(null);
      setPin('');
      setLoginInFlight(false);
    }
  }, [error]);

  useEffect(() => {
    if (pin.length < minLoginPinLength) {
      submittedAttemptRef.current = null;
    }
  }, [pin]);

  function appendDigit(digit: string) {
    setLocalError(null);
    setPin((current) => (current.length >= maxLoginPinLength ? current : `${current}${digit}`));
  }

  function deleteDigit() {
    setLocalError(null);
    setPin((current) => current.slice(0, -1));
  }

  async function submitLogin(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!selectedParticipantId) {
      setLocalError('Elegí tu usuario para entrar.');
      return;
    }

    if (pin.length < minLoginPinLength) {
      setLocalError('El PIN necesita al menos 4 numeros.');
      return;
    }

    const attemptKey = `${selectedParticipantId}:${pin}`;
    if (submittedAttemptRef.current === attemptKey) {
      return;
    }

    submittedAttemptRef.current = attemptKey;
    setLoginInFlight(true);
    try {
      await onLogin({ participantId: selectedParticipantId, pin });
    } catch (loginError) {
      setPin('');
      submittedAttemptRef.current = null;
      setLocalError(loginError instanceof Error ? loginError.message : 'No se pudo iniciar sesion.');
    } finally {
      setLoginInFlight(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (effectiveLoading) {
      return;
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      appendDigit(event.key);
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      deleteDigit();
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      void submitLogin();
    }
  }

  const activeError = localError ?? error;
  const effectiveLoading = loading || loginInFlight;

  useEffect(() => {
    if (effectiveLoading || pin.length !== maxLoginPinLength || !selectedParticipantId) {
      return;
    }

    void submitLogin();
  }, [effectiveLoading, pin, selectedParticipantId]);

  return (
    <main className="identity-screen login-screen">
      <section className="identity-card login-card" aria-label="Login">
        <header className="login-card__header">
          <div className="login-card__mark" aria-hidden="true">
            <BrandMark className="login-card__brand-image" />
          </div>
          <p className="login-card__goal">sept-26</p>
        </header>

        <form className="login-form" onSubmit={submitLogin} onKeyDown={handleKeyDown}>
          <label htmlFor="login-participant">player select</label>
          <select
            id="login-participant"
            value={selectedParticipantId}
            onChange={(event) => {
              setLocalError(null);
              setPin('');
              setSelectedParticipantId(event.currentTarget.value);
            }}
            disabled={effectiveLoading || options.length === 0}
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.displayName}
              </option>
            ))}
          </select>

          <div className="pin-display" aria-label={`${pin.length} digitos ingresados`}>
            {Array.from({ length: maxLoginPinLength }, (_, index) => (
              <span className={index < pin.length ? 'pin-display__dot pin-display__dot--filled' : 'pin-display__dot'} key={index} />
            ))}
          </div>

          {activeError ? <div className="alert alert--danger login-error">{activeError}</div> : null}

          <div className="pin-keypad" aria-label="Teclado numerico">
            {keypadNumbers.map((digit) => (
              <button className="keypad-button" key={digit} type="button" onClick={() => appendDigit(digit)} disabled={effectiveLoading}>
                {digit}
              </button>
            ))}
            <button className="keypad-button keypad-button--utility" type="button" onClick={() => setPin('')} disabled={effectiveLoading}>
              Limpiar
            </button>
            <button className="keypad-button" type="button" onClick={() => appendDigit('0')} disabled={effectiveLoading}>
              0
            </button>
            <button className="keypad-button keypad-button--icon" type="button" onClick={deleteDigit} aria-label="Borrar" disabled={effectiveLoading}>
              <Delete aria-hidden="true" />
            </button>
          </div>

          <button className="button button--dark login-submit" type="submit" disabled={effectiveLoading || pin.length < minLoginPinLength}>
            <LogIn aria-hidden="true" />
            {effectiveLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
