// Browsers pay a one-time cost the first time they draw very large lettering, which showed up as
// visible hitches mid-scroll. While the loader covers the page, draw every large display size once
// (nearly invisible, all glyphs stacked on one spot so none are clipped) so those glyphs are already
// prepared when the real headings scroll into view.
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-0123456789&/'.split('')
const SIZES = [
  'text-[clamp(3rem,8vw,7.5rem)]', // marquee
  'text-[clamp(3.4rem,12vw,10rem)]', // the fleet
  'text-[clamp(2.8rem,7vw,5.6rem)]', // story title
  'text-[clamp(2.6rem,6.5vw,5.4rem)]', // section headings
  'text-[clamp(2.6rem,5.2vw,4.6rem)]', // car names
  'text-[clamp(2.4rem,4.6vw,4rem)]', // occasion titles
  'text-[clamp(2.2rem,4.5vw,3.6rem)]', // process steps
  'text-[15.5vw]', // footer
  'text-[9rem] md:text-[13rem]', // panel numerals
  'text-[7rem] md:text-[10rem]', // step numerals
]

export default function GlyphWarmup() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[1]" style={{ opacity: 0.015 }}>
      {SIZES.map((cls) =>
        GLYPHS.map((g) => (
          <span key={cls + g} className={`display absolute left-0 top-0 uppercase leading-none text-ivory ${cls}`}>
            {g}
          </span>
        )),
      )}
      {GLYPHS.map((g) => (
        <span key={'o' + g} className="display absolute left-0 top-0 text-[clamp(3rem,8vw,7.5rem)] uppercase leading-none" style={{ color: 'rgba(201,165,107,.22)' }}>
          {g}
        </span>
      ))}
    </div>
  )
}
