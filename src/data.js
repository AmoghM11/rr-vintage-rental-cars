// All site copy lives here. Contact details are placeholders until the owner supplies real ones.
export const SITE = {
  name: 'RR Vintage Rental Cars',
  short: 'RR Vintage',
  phone: '+91 00000 00000',
  whatsapp: '910000000000',
  email: 'bookings@rrvintage.example',
  city: 'Your city',
  hours: 'Bookings answered 9 am – 9 pm, every day',
}

const img = (id, w = 1600) => `https://images.unsplash.com/photo-${id}?w=${w}&q=72&auto=format&fit=crop`
const srcset = (id, widths) => widths.map((w) => `${img(id, w)} ${w}w`).join(', ')

export const CARS = [
  {
    id: 'rolls-royce',
    num: '01',
    node: '1907',
    make: 'Rolls-Royce',
    model: 'Silver Ghost Tourer',
    era: '40/50 HP · built 1907 – 1926',
    quote: '“The best car in the world.”',
    story:
      'In 1907 Rolls-Royce painted one 40/50 HP chassis aluminium silver, gave it silver-plated fittings and named it the Silver Ghost. It then ran 15,000 miles under official observation, and the motoring press called it the best car in the world. Ours wears ivory coachwork, burgundy hide and black wire wheels, with the Spirit of Ecstasy on its Parthenon radiator.',
    specs: [
      { label: 'Engine', num: 7428, suffix: ' cc six' },
      { label: 'Rating', text: '40/50 HP' },
      { label: 'Built', num: 7874, suffix: ' chassis' },
      { label: 'Seats', num: 4, suffix: ' · open tourer' },
    ],
    perfect: ['Bride’s grand entry', 'Royal-theme shoots', 'Period films'],
  },
  {
    id: 'mg',
    num: '02',
    node: '1950',
    make: 'MG',
    model: 'TD Midget',
    era: 'Abingdon · built 1950 – 1953',
    quote: 'The roadster that taught America to love British sports cars.',
    story:
      'The TD kept the upright radiator, flowing wings and fold-flat screen of the pre-war Midgets, then added independent front suspension and rack-and-pinion steering. Most of the 29,664 built crossed the Atlantic and started a love affair with the British roadster. Ours is deep teal over tan leather: small, cheerful and built for two.',
    specs: [
      { label: 'Engine', num: 1250, suffix: ' cc XPAG four' },
      { label: 'Power', num: 54, suffix: ' bhp' },
      { label: 'Built', num: 29664, suffix: ' cars' },
      { label: 'Seats', num: 2, suffix: ' · roadster' },
    ],
    perfect: ['Couple portraits', 'Pre-wedding road trips', 'Fashion editorials'],
  },
  {
    id: 'morgan',
    num: '03',
    node: '1955',
    make: 'Morgan',
    model: 'Plus 4',
    era: 'Malvern · Plus 4 from 1950',
    quote: 'Hand-built in Malvern on a frame of seasoned ash.',
    story:
      'Morgan has built cars by hand in Malvern since 1910, framing its bodies in ash and keeping the sliding-pillar front suspension of its very first car. The Plus 4 arrived in 1950, and from 1954 it carried Triumph’s 2-litre TR engine, good for around 100 mph. Ours is claret with a waterfall grille, tan hide and a hood that folds away for golden-hour light.',
    specs: [
      { label: 'Engine', num: 1991, suffix: ' cc Triumph four' },
      { label: 'Power', num: 90, suffix: ' bhp' },
      { label: 'Top speed', num: 100, prefix: '≈ ', suffix: ' mph' },
      { label: 'Frame', text: 'Seasoned ash' },
    ],
    perfect: ['Golden-hour shoots', 'Vintage-theme weddings', 'Music videos'],
  },
  {
    id: 'marry',
    num: '04',
    node: 'Signature',
    make: 'Marry Vintage',
    model: 'The Wedding Roadster',
    era: 'Our signature car',
    quote: 'Made for the moment the doors open.',
    story:
      'Our signature wedding car. Deep burgundy coachwork, four chrome headlamps, a slatted grille under a winged crest, flexible side exhausts and chrome wire wheels, with cream-and-tan leather that is kind to a bridal lehenga. It is made for the bride’s entrance, the baraat and the send-off.',
    specs: [
      { label: 'Headlamps', num: 4, suffix: ' chrome' },
      { label: 'Wheels', text: 'Chrome wire' },
      { label: 'Seats', num: 2, suffix: ' · open roadster' },
      { label: 'Colour', text: 'Burgundy & cream' },
    ],
    perfect: ['Bride & groom entry', 'Baraat', 'Vidaai send-off', 'Reception arrival'],
  },
]

export const HERITAGE = [
  { num: 1907, label: 'The year the Silver Ghost got its name and ran 15,000 miles' },
  { num: 1910, label: 'Morgan begins building cars by hand in Malvern' },
  { num: 29664, label: 'MG TDs built at Abingdon between 1950 and 1953' },
  { num: 4, label: 'Classics in the RR garage, ready for your date' },
]

export const OCCASIONS = [
  {
    key: 'weddings',
    kicker: 'For the big day',
    title: 'Weddings',
    image: img('1640522196033-e95ec1e93c8c', 1100),
    srcSet: srcset('1640522196033-e95ec1e93c8c', [600, 900, 1100]),
    alt: 'Ivory vintage wedding car dressed with a satin ribbon bow',
    text: 'A vintage car turns an arrival into a scene everyone remembers. Choose the ivory Rolls-Royce for a regal entrance or the Marry Vintage for a burgundy-and-chrome send-off.',
    items: ['Bride’s grand entry', 'Baraat procession', 'Vidaai send-off', 'Reception arrival'],
  },
  {
    key: 'shoots',
    kicker: 'For the camera',
    title: 'Film & Photo Shoots',
    image: img('1707414616417-f4c835c6a81a', 1100),
    srcSet: srcset('1707414616417-f4c835c6a81a', [600, 900, 1100]),
    alt: 'Cream classic car lit at night outside a grand building',
    text: 'Period-correct cars that look right from every angle, kept clean and ready to be framed. Book by the hour for a portrait session or by the day for a production.',
    items: ['Pre-wedding shoots', 'Ad films & music videos', 'Fashion editorials', 'Period films'],
  },
]

export const STEPS = [
  {
    n: '01',
    title: 'Choose your classic',
    text: 'Turn each car on the turntable above, then tell us which one fits your day, or ask us to suggest one for your theme.',
  },
  {
    n: '02',
    title: 'Share the plan',
    text: 'Send the date, venue, timings and route. For shoots, the location and the hours you need the car on set.',
  },
  {
    n: '03',
    title: 'Arrive like royalty',
    text: 'Your car arrives polished and on time, ready for the entrance, the procession or the first frame.',
  },
]

export const GALLERY = [
  { src: img('1460154898712-a7f99bb4a464', 900), srcSet: srcset('1460154898712-a7f99bb4a464', [500, 700, 900]), caption: 'Brass, chrome and a wedding bow' },
  { src: img('1571394111091-d3edac39a32b', 900), srcSet: srcset('1571394111091-d3edac39a32b', [500, 700, 900]), caption: 'The first drive as a married couple' },
  { src: img('1684244249856-9d0620c2f9db', 900), srcSet: srcset('1684244249856-9d0620c2f9db', [500, 700, 900]), caption: 'Open roads, open roof' },
  { src: img('1708926677406-45b973d9166b', 900), srcSet: srcset('1708926677406-45b973d9166b', [500, 700, 900]), caption: 'A roadster for the portrait' },
  { src: img('1675873725360-b15df4950952', 900), srcSet: srcset('1675873725360-b15df4950952', [500, 700, 900]), caption: 'Period styling, made for the lens' },
  { src: img('1523371696700-91e21249c0ed', 900), srcSet: srcset('1523371696700-91e21249c0ed', [500, 700, 900]), caption: 'Ribbons on, ready to roll' },
  { src: img('1561100966-f6aa0145e8e6', 900), srcSet: srcset('1561100966-f6aa0145e8e6', [500, 700, 900]), caption: 'Sea air and chrome' },
]
