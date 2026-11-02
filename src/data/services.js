// Il listino di Nicolas, diviso in sezioni.
// Questo file contiene solo i DATI: come vengono mostrati lo decide PriceList.jsx.
// Al passo 3 questi dati si sposteranno nel database Supabase.
//
// Per ogni servizio:
// - price: prezzo in euro (numero intero)
// - duration: durata in minuti
// - fromPrice: true per i servizi tecnici, il cui prezzo è "a partire da"

export const serviceCategories = [
  {
    id: 'luxury',
    name: 'Esperienze Luxury',
    services: [
      { id: 'luxury-cut', name: 'Luxury Cut Experience', price: 25, duration: 50 },
      { id: 'luxury-total', name: 'Luxury Total Experience', price: 40, duration: 80 },
      { id: 'luxury-beard', name: 'Luxury Beard Experience', price: 18, duration: 30 },
    ],
  },
  {
    id: 'taglio',
    name: 'Taglio',
    services: [
      { id: 'taglio-barber', name: 'Taglio Barber', price: 18, duration: 30 },
      { id: 'taglio-under-14', name: 'Taglio Barber Under 14', price: 15, duration: 30 },
      { id: 'taglio-ritual', name: 'Taglio + Ritual', price: 20, duration: 40 },
    ],
  },
  {
    id: 'taglio-barba',
    name: 'Taglio e barba',
    services: [
      { id: 'taglio-barba', name: 'Taglio Barber + Barba', price: 23, duration: 45 },
      { id: 'taglio-rituals-barba', name: 'Taglio Barber + Rituals + Barba', price: 25, duration: 45 },
    ],
  },
  {
    id: 'barba',
    name: 'Barba e rasatura',
    services: [
      { id: 'barba-city-man', name: 'Barba City Man', price: 10, duration: 15 },
      { id: 'rasatura-uniformata', name: 'Rasatura Uniformata', price: 15, duration: 30 },
      { id: 'rasatura-tradizionale', name: 'Rasatura Tradizionale completa', price: 20, duration: 30 },
    ],
  },
  {
    id: 'colore',
    name: 'Colore',
    note: 'Il prezzo finale si decide in salone, dopo una breve consulenza.',
    services: [
      { id: 'colorazione', name: 'Colorazione Uomo', price: 20, duration: 30, fromPrice: true },
      { id: 'tonalizzante', name: 'Tonalizzante', price: 30, duration: 30, fromPrice: true },
    ],
  },
  {
    id: 'extra',
    name: 'Extra',
    services: [{ id: 'patch-occhi', name: 'Patch Occhi', price: 3, duration: 10 }],
  },
]
