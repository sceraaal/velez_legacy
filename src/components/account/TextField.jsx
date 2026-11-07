// Una casella di testo con etichetta e messaggio di errore, usata da tutti i
// moduli dell'area clienti. Ha lo stesso aspetto del modulo di prenotazione
// (classi customer-form__* in ../booking/Booking.css).

function TextField({ id, label, type = 'text', autoComplete, value, error, hint, onChange }) {
  const describedBy = [error && `${id}-errore`, hint && `${id}-nota`].filter(Boolean).join(' ')
  return (
    <div className="customer-form__field">
      <label htmlFor={id} className="customer-form__label">
        {label}
      </label>
      <input
        id={id}
        className="customer-form__input"
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        // aria-*: i lettori di schermo annunciano che il campo ha un errore e quale
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {hint && !error && (
        <p id={`${id}-nota`} className="account__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-errore`} className="customer-form__error">
          {error}
        </p>
      )}
    </div>
  )
}

export default TextField
