NODE "Person" "stefaneth10xx" {
  description: "A friend who consistently provides links and encouragement"
}

NODE "Person" "Bigherocrypto" {
  description: "A friend who consistently provides links and encouragement"
}

NODE "Concept" "Raids" {
  description: "Activity often discussed and participated in by the group"
}

NODE "Concept" "Link Exploration" {
  description: "Activity of exploring new links, often encouraged and performed by the group"
}

NODE "Concept" "Memes" {
  description: "Images and visual elements often shared within the group for entertainment and communication"
}

NODE "Concept" "Support" {
  description: "Key trait of the group, characterized by mutual encouragement and aid"
}

NODE "Concept" "Positivity" {
  description: "Value that is purposefully spread and upheld within the group"
}

RELATIONSHIP "stefaneth10xx" -> "Raids" [] {
  context: "stefaneth10xx consistently provides links and encouragement for raids"
}

RELATIONSHIP "Bigherocrypto" -> "Raids" [] {
  context: "Bigherocrypto consistently provides links and encouragement for raids"
}

RELATIONSHIP "stefaneth10xx" -> "Link Exploration" [] {
  context: "stefaneth10xx consistently provides links for exploration"
}

RELATIONSHIP "Bigherocrypto" -> "Link Exploration" [] {
  context: "Bigherocrypto consistently provides links for exploration"
}

RELATIONSHIP "stefaneth10xx" -> "Support" [] {
  context: "stefaneth10xx provides encouragement and support to the group"
}

RELATIONSHIP "Bigherocrypto" -> "Support" [] {
  context: "Bigherocrypto provides encouragement and support to the group"
}

RELATIONSHIP "stefaneth10xx" -> "Positivity" [] {
  context: "stefaneth10xx contributes to the positivity of the group"
}

RELATIONSHIP "Bigherocrypto" -> "Positivity" [] {
  context: "Bigherocrypto contributes to the positivity of the group"
}