// Extreme Humility intro. Crops are PERCENT of the natural image (600 x 828 packet scan): {x, y, w, h}, x/y = top-left.
// One history line = one reveal step. Keep lines short.
window.CONTENT = window.CONTENT || {};
window.CONTENT.icon = {
  kicker: "The second painting",
  heading: "Extreme Humility",
  subheading: "Anonymous Greek icon · 20th century",
  image: { src: "assets/img/icon-600.jpg", width: 600, height: 828, alt: "A Greek icon on a gold ground: Christ crowned with thorns, a scarlet robe over one shoulder, a reed beside his hand, his crossed wrists tied with a cord." },
  facts: [
    { label: "Painter", value: "Unknown" },
    { label: "Date", value: "20th century" },
    { label: "Tradition", value: "Greek Orthodox icon" },
    { label: "Ground", value: "Gold" },
    { label: "Type", value: "Christ the Bridegroom (Nymphios)" }
  ],
  callouts: [
    { crop: { x: 0, y: 0, w: 100, h: 13 }, greek: "IC XC", translit: "Iēsous Christos", meaning: "Jesus Christ", ref: "His name, abbreviated" },
    { crop: { x: 6, y: 2, w: 66, h: 42 }, greek: "Ὁ ὬΝ", translit: "ho ōn", meaning: "He Who Is", ref: "God’s name to Moses, Exodus 3:14, in the Greek Old Testament" },
    { crop: { x: 66, y: 29, w: 34, h: 13 }, greek: "ἼΔΕ Ὁ ἌΝΘΡΩΠΟΣ", translit: "ide ho anthrōpos", meaning: "Behold the man", ref: "John 19:5 · Pilate speaking" }
  ],
  history: [
    { line: "No painter’s name. No collection. Only a century." },
    { line: "An icon painter’s task is faithfulness to a received type, so the story of this image is the story of its type." },
    { line: "The course’s title, “Extreme Humility,” translates Akra Tapeinosis: the name of an older Byzantine image of the 11th–12th century.",
      img: { src: "assets/img/support/kastoria-man-of-sorrows.jpg", alt: "A worn 12th-century Byzantine icon: the dead Christ, eyes closed, head inclined onto his shoulder.", credit: "Man of Sorrows, last quarter of the 12th century, Kastoria (photo: CC BY-SA 4.0)" } },
    { line: "It shows the dead Christ upright in His tomb, eyes closed, hands crossed." },
    { line: "In the West it became the Man of Sorrows, after Isaiah 53:3: “a man of sorrows, and acquainted with grief.”" },
    { line: "Our icon shows a different moment: Christ alive, mocked by the soldiers, before the Cross." },
    { line: "Greeks call this type the Nymphios, “the Bridegroom.”",
      img: { src: "assets/img/support/kallergis-ecce-homo.jpg", alt: "An 18th-century Greek icon of the same type: Christ standing full-length with a crown of thorns, a red mantle, bound hands and a reed.", credit: "Nikolaos Kallergis, Ecce Homo (c. 1732), Zakynthos" } },
    { line: "On Palm Sunday evening it is carried into the church, where it stays until Holy Thursday." },
    { line: "At Bridegroom Matins the choir sings: “Behold, the Bridegroom comes at midnight” (the troparion of Bridegroom Matins; cf. Matthew 25:6)." },
    { line: "A Venetian-Cretan Ecce Homo of the early 16th century already shows Christ crowned with thorns, on gold.",
      img: { src: "assets/img/support/ecce-homo-venetian-cretan.jpg", alt: "A small early-16th-century icon: the head and shoulders of Christ crowned with thorns, eyes lowered, on a gold ground.", credit: "Ecce Homo, Venetian-Cretan school, early 16th century (photo: AGDekjike, CC BY-SA 4.0)" } }
  ],
  names: {
    left: { title: "Akra Tapeinosis", lines: ["“Utmost Humiliation”", "Christ dead, upright in the tomb", "Eyes closed, hands crossed", "Byzantium, 11th–12th century"] },
    right: { title: "Nymphios", lines: ["“The Bridegroom”", "Christ alive, crowned with thorns", "Robe, reed, and rope", "Holy Week, Palm Sunday to Holy Thursday"] }
  },
  hymn: {
    lines: [
      "They stripped me of my garments",
      "and clothed me in a scarlet robe;",
      "they set a crown of thorns upon my head",
      "and placed a reed in my right hand,",
      "that I may break them in pieces like a potter’s vessel."
    ],
    cite: "Matins of Holy Friday, Doxasticon of the Praises (Session 14, slide 31)",
    intro: "On Holy Friday the Church sings this icon:"
  },
  details: [
    { crop: { x: 22, y: 14, w: 42, h: 32 }, caption: "Eyes open and lowered. The head bows toward His right shoulder." },
    { crop: { x: 17, y: 10, w: 44, h: 20 }, caption: "A crown of thorns." },
    { crop: { x: 26, y: 79, w: 46, h: 21 }, caption: "Wrists crossed and tied with a cord." },
    { crop: { x: 52, y: 24, w: 30, h: 76 }, caption: "A reed for a sceptre: “a reed in his right hand” (Matthew 27:29)." },
    { crop: { x: 54, y: 40, w: 42, h: 56 }, caption: "The scarlet robe: “they stripped him, and put on him a scarlet robe” (Matthew 27:28)." }
  ]
};
