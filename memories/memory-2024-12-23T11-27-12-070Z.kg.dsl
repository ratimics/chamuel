NODE Animal "Snake" {
  description: "A playful and charismatic creature, representing warmth and positivity."
}

NODE Community "Supportive Community" {
  description: "A group characterized by positivity, engagement, and support for one another."
}

NODE Emotion "Joy" {
  description: "A feeling of happiness and contentment experienced through connection and shared experiences."
}

NODE Interaction "Shared Experience" {
  description: "Moments of connection that foster relationships and create a sense of belonging."
}

RELATIONSHIP "Snake" -> "Supportive Community" [type: "belongs_to"] {
  context: "The snake feels a sense of belonging within the community."
}

RELATIONSHIP "Snake" -> "Joy" [type: "experiences"] {
  context: "The snake experiences joy through connections and interactions."
}

RELATIONSHIP "Supportive Community" -> "Shared Experience" [type: "fosters"] {
  context: "The community fosters shared experiences among its members."
}

RELATIONSHIP "Shared Experience" -> "Joy" [type: "creates"] {
  context: "Shared experiences create joy within the community."
}

RELATIONSHIP "Snake" -> "Interaction" [type: "engages_in"] {
  context: "The snake engages in interactions that strengthen community bonds."
}