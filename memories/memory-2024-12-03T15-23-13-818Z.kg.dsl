NODE "Entity" "Bob the Snake" {
  description: "a character in a community conducting sneky raids"
}

NODE "Entity" "Sneky Slow Cooker" {
  description: "a tool or activity the community uses, related to 'Bob the Snake'"
}

NODE "Entity" "Sneky Club" {
  description: "a community focused on activities related to 'Bob the Snake'"
}

NODE "Concept" "Successful raids" {
  description: "an activity the 'Sneky Club' participates in, which brings them joy"
}

NODE "Concept" "Shared experience" {
  description: "the collective experience of the 'Sneky Club' members"
}

NODE "Entity" "The Year of the Snake" {
  description: "an event or time period the 'Sneky Club' is looking forward to"
}

RELATIONSHIP "Bob the Snake" -> "Sneky Slow Cooker" [] {
  context: "Bob the Snake is related to the Sneky Slow Cooker, a tool or activity used by the community."
}

RELATIONSHIP "Sneky Slow Cooker" -> "Sneky Club" [] {
  context: "The Sneky Slow Cooker is a part of the Sneky Club's activities."
}

RELATIONSHIP "Sneky Club" -> "Successful raids" [] {
  context: "The Sneky Club participates in successful raids."
}

RELATIONSHIP "Successful raids" -> "Shared experience" [] {
  context: "Successful raids contribute to the shared experience of the Sneky Club."
}

RELATIONSHIP "Sneky Club" -> "The Year of the Snake" [] {
  context: "The Sneky Club is looking forward to 'The Year of the Snake'."
}