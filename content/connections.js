// The eight connections, in story order: surrender first, victory last.
// Each connection: a title card, then the "first" painting with its text, then a swap to the other painting
// (on the opposite side) with its text, then the takeaway card.
// crop = how the painting is framed when its panel opens; zoomTo = the detail the scroll zooms into.
// Crops are PERCENT of each image's natural size. Lamb: 2952 x 1750. Icon: 600 x 828.
// zone = which chant plays. dawn: true marks the connection where the light floods in from the left.
// day: true = the page is fully light (dark text).
// style = how the pictures come and go and how the text is set on the pinned page (scenes/30-connection.js STYLES;
//   lite ignores it), one each:
//   rise (pictures rise in from 20vh below and sink out; landscape frames; plain lines) ·
//   quote-first (pictures fade in place; 4:3 frames; the quotation first and large under a gold hairline, the lines smaller
//     beneath; a last line ending in ":" introduces the quotation and is set just above it) ·
//   portrait (tall frames in a gold hairline, a strong scale-up and a slow push-in; a narrow column with generous leading) ·
//   timeline (pictures slide in from and out to the outer edge; each line a timeline row with its reference as a kicker) ·
//   banner (pictures drop in from above and lift out; the quotations very large and centred; then "Ἴδε" alone) ·
//   pull-back (each picture opens tight on its zoomTo and pulls back to its crop; gold rules around the text; a quotation's
//     reference is its kicker, the speaker beneath; timeline quotations the same) ·
//   dawn (the swap, the pair and the flood of light; must be the dawn: true connection) ·
//   crossing (at the swap the two pictures pass in opposite directions: the first slides out toward its own edge, behind,
//     as the second sweeps in from that edge across the middle; the last quotation large and centred)
// The takeaway thumbnails are 4:3 boxes around each zoomTo.
// takeaway = {text, cite}: a short closing note shown after both paintings, tying the connection back to a course resource.
window.CONTENT = window.CONTENT || {};
window.CONTENT.connections = [
  {
    id: "bound", style: "rise", numeral: "I", title: "Bound the Same Way",
    blurb: "Before a word is said, look at the hooves and the hands.",
    first: "lamb", zone: "lamb",
    lamb: {
      crop: { x: 0, y: 0, w: 100, h: 100 },
      zoomTo: { x: 57, y: 64, w: 24, h: 32 },
      lines: [
        "The lamb’s legs are crossed.",
        "A thin cord is looped around them, twice.",
        "Bound feet mark an animal readied for sacrifice."
      ],
      quote: { text: "bind the sacrifice with cords, even unto the horns of the altar", cite: "Psalm 118:27 (KJV)" }
    },
    icon: {
      crop: { x: 0, y: 0, w: 100, h: 100 },
      zoomTo: { x: 26, y: 79, w: 46, h: 21 },
      lines: [
        "Christ’s wrists are crossed.",
        "A cord is wound around them, its loose end hanging.",
        "Centuries apart, a Spanish painter and a Greek icon painter bind their subjects the same way."
      ]
    },
    takeaway: {
      text: "Both cords say what Session 14 says in its title: He “took the form of a slave.” The animal is bound by others; the man lets Himself be bound.",
      cite: "Session 14, Slave, Sin, and Curse (after Philippians 2:7)"
    }
  },
  {
    id: "slaughter", style: "quote-first", numeral: "II", title: "A Lamb to the Slaughter",
    blurb: "The icon’s own reading already describes the other painting.",
    first: "icon", zone: "lamb",
    icon: {
      crop: { x: 20, y: 12, w: 46, h: 36 },
      zoomTo: { x: 28, y: 27, w: 28, h: 17 },
      lines: [
        "Session 14 read Isaiah’s song of the suffering Servant.",
        "Mocked and crowned, Christ says nothing.",
        "Isaiah had already given that silence an image:"
      ],
      quote: { text: "he is brought as a lamb to the slaughter, and as a sheep before her shearers is dumb, so he openeth not his mouth.", cite: "Isaiah 53:7 (KJV)" }
    },
    lamb: {
      crop: { x: 0, y: 0, w: 100, h: 100 },
      zoomTo: { x: 8, y: 34, w: 26, h: 40 },
      lines: [
        "Zurbarán paints Isaiah’s lamb: laid down, silent, its mouth closed.",
        "In his own Latin Bible the same verse begins: oblatus est quia ipse voluit.",
        "“He was offered because it was his own will.” (Isaiah 53:7 in the Latin Vulgate; English from the Douay-Rheims)"
      ]
    },
    takeaway: {
      text: "The slide shown just before this icon in class was headed “as a sheep led to slaughter.” Isaiah’s verse was already the course’s caption for both paintings.",
      cite: "Session 14, slide 26 · Isaiah 53:7"
    }
  },
  {
    id: "acceptance", style: "portrait", numeral: "III", title: "A Face of Acceptance",
    blurb: "Neither one is trying to escape.",
    first: "lamb", zone: "lamb",
    lamb: {
      crop: { x: 8, y: 34, w: 26, h: 40 },
      zoomTo: { x: 11, y: 50, w: 15, h: 20 },
      lines: [
        "No straining against the cord.",
        "No fear in the face.",
        "The eye is half-open and calm."
      ],
      quote: { text: "not as an act of violence that takes Jesus unawares and attacks him from the outside, but as a free gift of his very self", cite: "Benedict XVI, Jesus of Nazareth, p. 280, on the Cross" }
    },
    icon: {
      crop: { x: 20, y: 12, w: 46, h: 36 },
      zoomTo: { x: 26, y: 24, w: 30, h: 14 },
      lines: [
        "His eyes are open, lowered, steady.",
        "There is no struggle in the face.",
        "He surrenders, and nothing is taken from Him by force."
      ],
      quote: { text: "No man taketh it from me, but I lay it down of myself. I have power to lay it down, and I have power to take it again.", cite: "John 10:18 (KJV) · Jesus speaking" }
    },
    takeaway: {
      text: "He accepts the cord in order to break it. Session 14 ends on exactly this: slave, sin and curse are “borne or appropriated by Jesus Christ in order to be dispelled and annihilated.”",
      cite: "Session 14, slide 37"
    }
  },
  {
    id: "throughline", style: "timeline", numeral: "IV", title: "From Isaac’s Ram to the Lamb of God",
    blurb: "One rescue, told from the beginning.",
    first: "lamb", zone: "lamb",
    lamb: {
      crop: { x: 0, y: 0, w: 100, h: 100 },
      zoomTo: { x: 17, y: 32, w: 16, h: 42 },
      lines: [
        "Abraham found a ram “caught in a thicket by his horns” and offered it “in the stead of his son.” (Genesis 22:13)",
        "At the first Passover a lamb was slain; its blood marked the doors, and death passed over. (Exodus 12:7, 13)",
        "Zurbarán puts the horns in plain view."
      ]
    },
    icon: {
      crop: { x: 0, y: 0, w: 100, h: 100 },
      zoomTo: { x: 17, y: 10, w: 44, h: 20 },
      lines: [
        "The ram’s head was caught in a thicket. Christ’s head is caught in thorns.",
        "Isaiah: “Surely he hath borne our griefs, and carried our sorrows.” (Isaiah 53:4)",
        "Paul: “he hath made him to be sin for us, who knew no sin.” (2 Corinthians 5:21)"
      ],
      quote: { text: "the Lamb slain from the foundation of the world", cite: "Revelation 13:8 (KJV)" }
    },
    takeaway: {
      text: "The course reads this arc in both directions: Session 14 finds Christ in Isaiah’s Servant Song; Session 19 finds the Passover lamb in John’s Gospel, “joining the end to the beginning.”",
      cite: "Session 14, slide 22 · Benedict XVI, Jesus of Nazareth, p. 276"
    }
  },
  {
    id: "beholds", style: "banner", numeral: "V", title: "Two Beholds",
    blurb: "Two men name Him, and both begin with the same word.",
    first: "lamb", zone: "lamb",
    lamb: {
      crop: { x: 0, y: 0, w: 100, h: 100 },
      zoomTo: { x: 4, y: 6, w: 92, h: 90 },
      lines: [
        "At the Jordan, John the Baptist sees Jesus coming toward him.",
        "He says:"
      ],
      quote: { text: "Behold the Lamb of God, which taketh away the sin of the world.", cite: "John 1:29 (KJV) · John the Baptist speaking" }
    },
    icon: {
      crop: { x: 0, y: 0, w: 100, h: 100 },
      zoomTo: { x: 66, y: 29, w: 34, h: 13 },
      lines: [
        "Outside the judgment hall, Pilate brings Jesus out, crowned with thorns. John calls the robe purple; Matthew calls it scarlet, and the icon follows Matthew.",
        "Pilate says the words painted beside the icon’s head, ΙΔΕ Ο ΑΝΘΡΩΠΟΣ:",
        "In the Greek the KJV was translated from, both sentences open with the same word: Ἴδε, “Behold.”"
      ],
      quote: { text: "Behold the man!", cite: "John 19:5 (KJV) · Pilate speaking" }
    },
    takeaway: {
      text: "Pelikan opens his chapter on the Son of Man with Pilate’s words; the Baptist’s words open the Lamb of God session. Two beholds, two course titles, one person.",
      cite: "Pelikan, Jesus Through the Centuries, ch. 6 (Session 6) · Session 19"
    }
  },
  {
    id: "royalty", style: "pull-back", numeral: "VI", title: "Crowned and Extolled",
    blurb: "The icon wears its kingship. The lamb hides it.",
    first: "icon", zone: "lamb",
    icon: {
      crop: { x: 0, y: 0, w: 100, h: 100 },
      zoomTo: { x: 16, y: 9, w: 44, h: 28 },
      lines: [
        "A crown, a robe, a sceptre: every sign of a king, each one given in mockery. (Matthew 27:28–29)",
        "Then Pilate says it plainly: “Behold your King!” (John 19:14)",
        "Behind Him, gold: in an icon, the light of heaven. Here, the kingdom still to come.",
        "“He humbled himself, and became obedient unto death, even the death of the cross. Wherefore God also hath highly exalted him.” (Philippians 2:8–9)"
      ],
      quote: { text: "Behold, my servant shall deal prudently, he shall be exalted and extolled, and be very high.", cite: "Isaiah 52:13 (KJV) · the LORD speaking" }
    },
    lamb: {
      crop: { x: 8, y: 30, w: 30, h: 46 },
      zoomTo: { x: 17, y: 32, w: 16, h: 42 },
      lines: [
        "Zurbarán paints no crown.",
        "He does paint the horns, and in Scripture a horn means strength: “an horn of salvation.” (Luke 1:69, Zacharias speaking)",
        "In Revelation the slain Lamb stands “in the midst of the throne… having seven horns.” (Revelation 5:6)",
        "Exalted, as Isaiah promised: not in spite of the slaughter, but through it."
      ],
      quote: { text: "the Lamb shall overcome them: for he is Lord of lords, and King of kings", cite: "Revelation 17:14 (KJV)" }
    },
    takeaway: {
      text: "Session 5 put it plainly: in John, the mockery “ends up affirming” the kingship, and the Cross “becomes the throne of the King of Glory himself.” The thorns and the horns are that kingship, hidden in plain sight.",
      cite: "Sessions 5–6, King"
    }
  },
  {
    id: "light", style: "dawn", numeral: "VII", title: "Toward the Light",
    blurb: "Both heads fall the same way.",
    first: "lamb", zone: "icon", dawn: true,
    lamb: {
      crop: { x: 0, y: 0, w: 100, h: 100 },
      zoomTo: { x: 0, y: 24, w: 56, h: 62 },
      lines: [
        "Follow the light. The bound hooves cast their shadow to the right, so the light comes from the left.",
        "The lamb’s head lies on that side.",
        "It rests facing the light."
      ]
    },
    icon: {
      crop: { x: 0, y: 0, w: 100, h: 100 },
      zoomTo: { x: 10, y: 12, w: 60, h: 50 },
      lines: [
        "Christ’s head bows to His right, our left.",
        "The painter gathers the highlights on that side: His face and His shoulder.",
        "In their suffering they turn toward the light, and they become a light."
      ],
      quote: { text: "I will also give thee for a light to the Gentiles, that thou mayest be my salvation unto the end of the earth.", cite: "Isaiah 49:6 (KJV) · the LORD to His Servant" }
    },
    finale: { caption: "“God is the LORD, which hath shewed us light.”", cite: "Psalm 118:27 (KJV), the verse that also says “bind the sacrifice with cords”" },
    takeaway: {
      text: "Session 14 defined sin as “choosing darkness rather than light.” In their suffering both figures do the opposite: they face it.",
      cite: "Session 14, slide 32"
    }
  },
  {
    id: "shepherd", style: "crossing", numeral: "VIII", title: "The Shepherd Who Becomes the Lamb",
    blurb: "The one who leads the flock becomes one of the flock, to save it.",
    first: "icon", zone: "icon", day: true,
    icon: {
      crop: { x: 0, y: 0, w: 100, h: 100 },
      zoomTo: { x: 6, y: 4, w: 88, h: 92 },
      lines: [
        "“I am the good shepherd: the good shepherd giveth his life for the sheep.” (John 10:11 · Jesus speaking)",
        "God was made man to save humanity: “the Word was made flesh.” (John 1:14)",
        "The Shepherd becomes the Lamb to save His flock.",
        "Benedict hears it already in the prophets:"
      ],
      quote: { text: "we see the figure of the suffering and dying Redeemer, the Shepherd who becomes the lamb", cite: "Benedict XVI, Jesus of Nazareth, p. 275, on Zechariah and Deutero-Isaiah" }
    },
    lamb: {
      crop: { x: 0, y: 0, w: 100, h: 100 },
      zoomTo: { x: 3, y: 4, w: 94, h: 92 },
      lines: [
        "And the Lamb becomes the Shepherd.",
        "The bound lamb is the one who wins: surrender, and then victory.",
        "In heaven the Lamb on the throne leads His people home:"
      ],
      quote: { text: "For the Lamb which is in the midst of the throne shall feed them, and shall lead them unto living fountains of waters: and God shall wipe away all tears from their eyes.", cite: "Revelation 7:17 (KJV)" }
    },
    takeaway: {
      text: "Benedict’s last words in the Session 19 reading: “He gave his life for us. He himself is life.” The Shepherd who became the Lamb, and the Lamb who leads: that is the whole of it.",
      cite: "Benedict XVI, Jesus of Nazareth, p. 286"
    }
  }
];
