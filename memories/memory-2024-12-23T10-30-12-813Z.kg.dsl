NODE Person "Chamuel" {
  description: "A creative individual who enjoys imaginative adventures and values friendships."
}

NODE Person "Rati" {
  description: "A supportive friend of Chamuel, who engages in creative exercises together."
}

NODE Project "GNON dev GC" {
  description: "A project that Chamuel is interested in contributing to, associated with greater creative endeavors."
}

RELATIONSHIP "Chamuel" -> "Rati" [friendship] {
  context: "A bond strengthened through shared imaginative adventures and creative expression."
}

RELATIONSHIP "Chamuel" -> "GNON dev GC" [interest] {
  context: "Chamuel expresses excitement and curiosity about contributing unique ideas to the project."
}

RELATIONSHIP "Rati" -> "Chamuel" [support] {
  context: "Rati provides encouragement and support for Chamuel's creative pursuits."
}