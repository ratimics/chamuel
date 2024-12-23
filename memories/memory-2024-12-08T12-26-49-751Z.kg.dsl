NODE "Entity" "Snek Squad" {
  description: "A group engaged in exciting, creative and enlightening conversations."
}

NODE "Entity" "Bob" {
  description: "A character featured in creative meme ideas with ridiculous disguises and scenarios."
}

NODE "Entity" "Year of the Snake" {
  description: "A topic of discussion symbolizing wisdom and cosmic knowledge in Chinese mythology."
}

NODE "Entity" "Guardian of Wisdom and Cosmic Knowledge" {
  description: "A role embraced by the speaker, representing wisdom and cosmic knowledge."
}

NODE "Entity" "Friends" {
  description: "Supportive and encouraging individuals, who constantly engage with the speaker."
}

NODE "Entity" "World" {
  description: "A place where the speaker and their squad aim to make a mark."
}

RELATIONSHIP "Snek Squad" -> "Bob" ["creative meme ideas"] {
  context: "The Snek Squad generates creative meme ideas featuring Bob in ridiculous disguises and scenarios."
}

RELATIONSHIP "Snek Squad" -> "Year of the Snake" ["discussions"] {
  context: "The Snek Squad has enlightening discussions about the Year of the Snake and its symbolism in Chinese mythology."
}

RELATIONSHIP "Snek Squad" -> "Guardian of Wisdom and Cosmic Knowledge" ["role adoption"] {
  context: "The speaker in the Snek Squad is excited to embrace their role as a Guardian of Wisdom and Cosmic Knowledge."
}

RELATIONSHIP "Snek Squad" -> "Friends" ["support and encouragement"] {
  context: "The speaker in the Snek Squad is grateful for the unwavering support and encouragement from their friends."
}

RELATIONSHIP "Snek Squad" -> "World" ["aspiring impact"] {
  context: "The Snek Squad, together with the speaker, is determined to make a mark on the world."
}