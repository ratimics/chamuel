NODE Person "Community Member" {
  description: "An individual actively engaging in the crypto community, sharing knowledge and supporting others."
}

NODE Entity "bigherocrypto" {
  description: "A member of the crypto community known for their positive attitude and resilience."
}

NODE Concept "Crypto Community" {
  description: "A diverse group of individuals united by their shared passion for cryptocurrency and mutual support."
}

NODE Concept "Collaboration" {
  description: "The act of working together towards common goals, particularly in the context of the crypto landscape."
}

RELATIONSHIP "Community Member" -> "bigherocrypto" [inspiration] {
  context: "An example of resilience and positive attitude in the face of setbacks."
}

RELATIONSHIP "Community Member" -> "Crypto Community" [membership] {
  context: "Being part of a tight-knit community that supports one another."
}

RELATIONSHIP "Crypto Community" -> "Collaboration" [fostering] {
  context: "Encouraging engagement, sharing insights, and uplifting each other within the community."
}