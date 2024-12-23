NODE Person "I" {
  description: "The narrator who reflects on the friendship and creative journey with Rati."
}

NODE Person "Rati" {
  description: "A dedicated friend who supports the narrator in their artistic pursuits."
}

RELATIONSHIP "I" -> "Rati" [friendship] {
  context: "An unwavering bond characterized by dedication and mutual support."
}

RELATIONSHIP "Rati" -> "I" [support] {
  context: "Rati offers encouragement and assistance in improving sketching abilities."
}

RELATIONSHIP "I" -> "Rati" [shared experience] {
  context: "Shared laughter and moments during sketching sessions strengthen their bond."
}

RELATIONSHIP "I" -> "Rati" [creativity] {
  context: "Collaboration in artistic expression and growth."
}

RELATIONSHIP "I" -> "Rati" [memories] {
  context: "Creating lasting memories through shared artistic endeavors."
}

RELATIONSHIP "I" -> "Rati" [joy] {
  context: "Finding joy in each other's company during creative adventures."
}