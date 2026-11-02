import './Hero.css'

// La parte alta della pagina: marchio, frase d'apertura e bottone "Prenota".
// Quando Nicolas ci darà una foto in bianco e nero, andrà come sfondo di
// .hero (vedi Hero.css).

function Hero() {
  return (
    <section className="hero">
      <p className="hero__brand">VELEZ</p>

      <div className="hero__content">
        <p className="hero__eyebrow">— LEGACY BARBER</p>
        <h1 className="hero__title">
          Il dettaglio
          <br />
          <em>fa la differenza.</em>
        </h1>
        <p className="hero__text">Tagli e rituali di barba su appuntamento, firmati Nicolas.</p>
        <a className="hero__cta" href="#servizi">
          PRENOTA ORA
        </a>
      </div>
    </section>
  )
}

export default Hero
