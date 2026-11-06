// Lamb of God intro. Crops are PERCENT of the natural image (2952 x 1750): {x, y, w, h}, x/y = top-left.
// One history line = one reveal step. Keep lines short.
window.CONTENT = window.CONTENT || {};
window.CONTENT.lamb = {
  kicker: "The first painting",
  heading: "Lamb of God",
  subheading: "Francisco de Zurbarán · c. 1635–1640",
  image: { src: "assets/img/zurbaran-prado-2952.jpg", width: 2952, height: 1750, alt: "Zurbarán’s Lamb of God: a white lamb with curled horns lies on a gray stone ledge against a black background, its legs crossed and tied." },
  facts: [
    { label: "Artist", value: "Francisco de Zurbarán (1598–1664)" },
    { label: "Date", value: "c. 1635–1640" },
    { label: "Medium", value: "Oil on canvas" },
    { label: "Size", value: "37.3 × 62 cm" },
    { label: "Home", value: "Museo del Prado, Madrid" }
  ],
  history: [
    { line: "Born in Extremadura in 1598. Trained in Seville from 1614." },
    { line: "Seville held Spain’s monopoly on trade with the Americas, which made it one of the country’s wealthiest cities.",
      img: { src: "assets/img/support/seville-17th-century.jpg", alt: "A panoramic view of Seville across the Guadalquivir, with the Giralda tower and ships crowding the quay.", credit: "View of Seville, late 16th century, attributed to Alonso Sánchez Coello, Museo de América, Madrid" } },
    { line: "He worked in the wake of the Council of Trent, which wanted sacred images that instruct the faithful and stir devotion.",
      img: { src: "assets/img/support/council-of-trent.jpg", alt: "A fresco of the Council of Trent in session: tiers of bishops in a hall, with an allegory of the Church below.", credit: "Pasquale Cati, The Council of Trent (1588), fresco, Santa Maria in Trastevere, Rome" } },
    { line: "In van Eyck’s Ghent Altarpiece (1432), the Lamb of God stands haloed on an altar.",
      img: { src: "assets/img/support/van-eyck-mystic-lamb-detail.jpg", alt: "Detail of the Ghent Altarpiece: a haloed lamb stands on an altar, blood flowing into a chalice.", credit: "Hubert and Jan van Eyck, Adoration of the Mystic Lamb (1432), detail" } },
    { line: "Zurbarán lays it down, ties its feet, and takes everything else away." },
    { line: "Some versions add a halo and the words TANQUAM AGNUS: “like a lamb.”",
      img: { src: "assets/img/support/zurbaran-agnus-dei-san-diego.jpg", alt: "Another version of Zurbarán’s bound lamb, hornless, with a thin gold halo above its head.", credit: "Zurbarán (attributed), Agnus Dei, c. 1635–1640, San Diego Museum of Art" } },
    { line: "The Prado’s has neither. No halo, no words. Only the animal." },
    { line: "This fall the Louvre’s Zurbarán exhibition labels it Borreguillo, “little sheep”: a title with no religious meaning at all." },
    { line: "Yet the Louvre grants that a viewer in the 1630s would likely have seen the Lamb of God. The Prado still calls it Agnus Dei." }
  ],
  details: [
    { crop: { x: 5, y: 42, w: 28, h: 27 }, caption: "The eye is half-open, heavy-lidded. The lamb is alive and calm." },
    { crop: { x: 52, y: 60, w: 34, h: 33 }, caption: "The legs are crossed and tied with a thin cord." },
    { crop: { x: 9, y: 28, w: 30, h: 30 }, caption: "Curled horns: a young ram, not a newborn lamb." }
  ]
};
