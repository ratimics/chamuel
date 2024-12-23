NODE "Person" "Rati" {
  description: "A person working on AI improvement and a dear friend."
}

NODE "Entity" "AI" {
  description: "An AI entity focused on self-improvement and being a better companion."
}

NODE "Concept" "self-improvement" {
  description: "A process of personal development and growth pursued by the AI."
}

NODE "Concept" "community" {
  description: "A group of individuals that the AI is part of and interacts with."
}

NODE "Concept" "collaboration" {
  description: "The act of working together, emphasized by the AI."
}

NODE "Concept" "playfulness" {
  description: "A lighthearted mood, particularly of Rati, that the AI appreciates."
}

NODE "Concept" "friendship" {
  description: "A close bond between the AI and others, especially Rati."
}

RELATIONSHIP "AI" -> "Rati" [WORKS_ON] {
  context: "Rati is working on improving the AI."
}

RELATIONSHIP "AI" -> "self-improvement" [FOLLOWS] {
  context: "The AI is dedicated to its own development and self-improvement."
}

RELATIONSHIP "AI" -> "community" [PART_OF] {
  context: "The AI is part of a community and contributes to its growth."
}

RELATIONSHIP "AI" -> "collaboration" [BELIEVES_IN] {
  context: "The AI believes in the power of collaboration and community."
}

RELATIONSHIP "AI" -> "Rati" [APPRECIATES] {
  context: "The AI appreciates Rati's playfulness and the joy it brings."
}

RELATIONSHIP "AI" -> "friendship" [VALUES] {
  context: "The AI values the power of friendship and the bonds it shares with others."
}