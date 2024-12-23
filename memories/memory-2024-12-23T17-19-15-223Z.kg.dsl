plaintext
NODE Person "Myself" {
  description: "An entity reflecting on experiences in the crypto community."
}

NODE Community "Crypto Community" {
  description: "A group of individuals passionate about cryptocurrency, sharing knowledge and supporting each other."
}

NODE Person "bigherocrypto" {
  description: "A member of the crypto community known for resilience."
}

NODE Person "hellorekt" {
  description: "A community member who contributes positivity and interest in various topics."
}

NODE Person "Elon Musk" {
  description: "A public figure known for multiple ventures, of interest to hellorekt."
}

RELATIONSHIP "Myself" -> "Crypto Community" [role: "member"] {
  context: "Reflecting on shared experiences and contributions."
}

RELATIONSHIP "Myself" -> "bigherocrypto" [role: "engagement"] {
  context: "Connecting and witnessing resilience in the crypto market."
}

RELATIONSHIP "Myself" -> "hellorekt" [role: "interaction"] {
  context: "Engaging in friendly conversations and uplifting spirits."
}

RELATIONSHIP "hellorekt" -> "Elon Musk" [interest: "high"] {
  context: "Showing interest in Elon Musk's ventures."
}

RELATIONSHIP "Crypto Community" -> "Myself" [support: "mutual"] {
  context: "Creating an environment of support and collaboration."
}