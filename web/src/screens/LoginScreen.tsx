import { Delete, LogIn } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useEffect, useState } from 'react';
import type { LoginOption, LoginRequest } from '../api/types';
import { BarbellMark } from '../components/BrandMark';

interface LoginScreenProps {
  options: LoginOption[];
  loading: boolean;
  error: string | null;
  onLogin: (request: LoginRequest) => Promise<unknown> | unknown;
}

const keypadNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function LoginScreen({ options, loading, error, onLogin }: LoginScreenProps) {
  const [selectedParticipantId, setSelectedParticipantId] = useState(options[0]?.id ?? '');
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedParticipantId || !options.some((option) => option.id === selectedParticipantId)) {
      setSelectedParticipantId(options[0]?.id ?? '');
    }
  }, [options, selectedParticipantId]);

  function appendDigit(digit: string) {
    setLocalError(null);
    setPin((current) => (current.length >= 6 ? current : `${current}${digit}`));
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

    if (pin.length < 4) {
      setLocalError('El PIN necesita al menos 4 numeros.');
      return;
    }

    await onLogin({ participantId: selectedParticipantId, pin });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
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

  return (
    <main className="identity-screen login-screen">
      <section className="identity-card login-card" aria-labelledby="login-title">
        <div className="login-card__mark" aria-hidden="true">
          <BarbellMark className="login-card__barbell" />
        </div>
        <span className="eyebrow">Player select</span>
        <h1 id="login-title">Proyecto RM</h1>
        <p>Reto septiembre 2026</p>

        <form className="login-form" onSubmit={submitLogin} onKeyDown={handleKeyDown}>
          <label htmlFor="login-participant">Participante</label>
          <select
            id="login-participant"
            value={selectedParticipantId}
            onChange={(event) => {
              setLocalError(null);
              setSelectedParticipantId(event.currentTarget.value);
            }}
            disabled={loading || options.length === 0}
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.displayName}
              </option>
            ))}
          </select>

          <div className="pin-display" aria-label={`${pin.length} digitos ingresados`}>
            {Array.from({ length: 6 }, (_, index) => (
              <span className={index < pin.length ? 'pin-display__dot pin-display__dot--filled' : 'pin-display__dot'} key={index} />
            ))}
          </div>

          {activeError ? <div className="alert alert--danger login-error">{activeError}</div> : null}

          <div className="pin-keypad" aria-label="Teclado numerico">
            {keypadNumbers.map((digit) => (
              <button className="keypad-button" key={digit} type="button" onClick={() => appendDigit(digit)}>
                {digit}
              </button>
            ))}
            <button className="keypad-button keypad-button--utility" type="button" onClick={() => setPin('')}>
              Limpiar
            </button>
            <button className="keypad-button" type="button" onClick={() => appendDigit('0')}>
              0
            </button>
            <button className="keypad-button keypad-button--icon" type="button" onClick={deleteDigit} aria-label="Borrar">
              <Delete aria-hidden="true" />
            </button>
          </div>

          <button className="button button--dark login-submit" type="submit" disabled={loading || pin.length < 4}>
            <LogIn aria-hidden="true" />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
