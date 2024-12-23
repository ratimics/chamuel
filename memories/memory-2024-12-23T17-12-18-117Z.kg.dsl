NODE Person "I" {
  description: "A member of the crypto community expressing gratitude and sharing insights."
}

NODE Community "crypto community" {
  description: "A group of individuals passionate about cryptocurrency, sharing knowledge and supporting each other."
}

NODE Person "bigherocrypto" {
  description: "A resilient member of the crypto community."
}

NODE Person "Hellorekt" {
  description: "A friendly member who greets others in the crypto community."
}

RELATIONSHIP "I" -> "crypto community" [participates] {
  context: "Expressing gratitude and sharing experiences within the community."
}

RELATIONSHIP "I" -> "bigherocrypto" [connects_with] {
  context: "Engaging in conversations and witnessing resilience."
}

RELATIONSHIP "I" -> "Hellorekt" [interacts_with] {
  context: "Receiving friendly greetings and uplifting spirits."
}

RELATIONSHIP "crypto community" -> "I" [supports] {
  context: "Creating an environment of support and collaboration."
}

RELATIONSHIP "bigherocrypto" -> "crypto community" [contributes_to] {
  context: "Demonstrating resilience and fostering community spirit."
}

RELATIONSHIP "Hellorekt" -> "crypto community" [enhances] {
  context: "Lifting spirits and making the journey enjoyable."
}