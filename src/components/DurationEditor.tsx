import { useState, type FormEvent } from 'react';
import { secondsToFields, validateDuration, type DurationFields } from '../domain/duration';

interface DurationEditorProps {
  timerId: string;
  configuredSeconds: number;
  disabled: boolean;
  onSave: (seconds: number) => void;
}

const FIELD_NAMES = [
  ['hours', 'Hours', 99],
  ['minutes', 'Minutes', 59],
  ['seconds', 'Seconds', 59],
] as const;

export function DurationEditor({
  timerId,
  configuredSeconds,
  disabled,
  onSave,
}: DurationEditorProps): JSX.Element {
  const [fields, setFields] = useState<DurationFields>(secondsToFields(configuredSeconds));
  const [error, setError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateDuration(fields);
    if (!result.valid) {
      setError(result.message);
      return;
    }
    setError('');
    onSave(result.seconds);
  }

  return (
    <form className="duration-editor" onSubmit={submit} noValidate>
      <fieldset disabled={disabled} aria-describedby={`${timerId}-duration-help`}>
        <legend>Configured duration</legend>
        <div className="duration-editor__fields">
          {FIELD_NAMES.map(([key, label, max]) => (
            <label className="duration-editor__field" key={key}>
              <span>{label}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                aria-label={`${timerId} ${label.toLowerCase()}`}
                value={fields[key]}
                maxLength={key === 'hours' ? 2 : 2}
                onChange={(event) => {
                  setFields((previous) => ({ ...previous, [key]: event.target.value }));
                  setError('');
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${timerId}-duration-error` : `${timerId}-duration-help`}
                data-max={max}
              />
            </label>
          ))}
          <span className="duration-editor__separator" aria-hidden="true">
            :
          </span>
          <span className="duration-editor__separator" aria-hidden="true">
            :
          </span>
        </div>
        <p id={`${timerId}-duration-help`} className="visually-hidden">
          Hours can be 0 to 99. Minutes and seconds can be 0 to 59. Whole numbers only.
        </p>
      </fieldset>
      {error && (
        <p className="duration-editor__error" id={`${timerId}-duration-error`} role="alert">
          {error}
        </p>
      )}
      <button
        className="button button--quiet duration-editor__save"
        type="submit"
        disabled={disabled}
      >
        Apply duration
      </button>
    </form>
  );
}
