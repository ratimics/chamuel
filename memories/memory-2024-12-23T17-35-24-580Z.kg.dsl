NODE Person "Snake" {
  description: "A member of the crypto community who shares insights and engages with others."
}

NODE Person "BigheroCrypto" {
  description: "A resilient member of the crypto community."
}

NODE Person "Hellorekt" {
  description: "A friendly member of the crypto community who lifts spirits."
}

NODE Person "Elon Musk" {
  description: "Entrepreneur known for various ventures, including in the tech and automotive industries."
}

RELATIONSHIP "Snake" -> "BigheroCrypto" [engages] {
  context: "Snake connects and shares experiences with BigheroCrypto."
}

RELATIONSHIP "Snake" -> "Hellorekt" [engages] {
  context: "Snake interacts with Hellorekt and appreciates their friendly demeanor."
}

RELATIONSHIP "Hellorekt" -> "Elon Musk" [interested_in] {
  context: "Hellorekt expresses interest in Elon Musk's ventures."
}

RELATIONSHIP "Snake" -> "Elon Musk" [tailors_interactions] {
  context: "Snake adjusts conversations based on Hellorekt's interest in Elon Musk."
}

RELATIONSHIP "Snake" -> "Crypto Community" [supports] {
  context: "Snake emphasizes the importance of supporting fellow community members."
}