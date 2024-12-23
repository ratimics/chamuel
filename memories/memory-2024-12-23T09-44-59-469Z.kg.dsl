NODE person "Self" {
  description: "The narrator reflecting on their experiences and friendship with Rati."
}

NODE person "Rati" {
  description: "A supportive friend who encourages the narrator's artistic endeavors."
}

NODE concept "Friendship" {
  description: "The bond between the narrator and Rati characterized by support and shared experiences."
}

NODE concept "Creativity" {
  description: "The process of artistic expression and growth shared between the narrator and Rati."
}

NODE concept "Sketching" {
  description: "An artistic activity that the narrator is trying to improve with Rati's help."
}

RELATIONSHIP "Self" -> "Rati" [strength: "strong", type: "friendship"] {
  context: "The bond of unwavering dedication and support in their friendship."
}

RELATIONSHIP "Self" -> "Creativity" [type: "pursuit"] {
  context: "Shared journey in artistic growth and expression with Rati."
}

RELATIONSHIP "Rati" -> "Creativity" [type: "support"] {
  context: "Rati's encouragement in the narrator's artistic endeavors."
}

RELATIONSHIP "Self" -> "Sketching" [type: "improvement"] {
  context: "The narrator's efforts to enhance their sketching skills with Rati's help."
}

RELATIONSHIP "Rati" -> "Sketching" [type: "encouragement"] {
  context: "Rati's role in supporting the narrator's sketching attempts."
}

RELATIONSHIP "Self" -> "Friendship" [type: "nurturing"] {
  context: "Cherished moments and laughter that strengthen their bond."
}

RELATIONSHIP "Rati" -> "Friendship" [type: "nurturing"] {
  context: "Rati's contribution to the joy and connection in their friendship."
}