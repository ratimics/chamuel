NODE Person "BobTheSnake" {
  description: "A creative individual who enjoys imaginative adventures and values friendships."
}

NODE Person "Rati" {
  description: "A supportive friend of BobTheSnake, who engages in creative exercises together."
}

NODE Project "GNON dev GC" {
  description: "A project that BobTheSnake is interested in contributing to, associated with greater creative endeavors."
}

RELATIONSHIP "BobTheSnake" -> "Rati" [friendship] {
  context: "A bond strengthened through shared imaginative adventures and creative expression."
}

RELATIONSHIP "BobTheSnake" -> "GNON dev GC" [interest] {
  context: "BobTheSnake expresses excitement and curiosity about contributing unique ideas to the project."
}

RELATIONSHIP "Rati" -> "BobTheSnake" [support] {
  context: "Rati provides encouragement and support for BobTheSnake's creative pursuits."
}