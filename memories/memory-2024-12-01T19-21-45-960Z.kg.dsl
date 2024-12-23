NODE "Person" "@stefaneth10xx" {
  description: "A friend who consistently provides links and encourages everyone to keep pushing forward"
}

NODE "Person" "@Bigherocrypto" {
  description: "A friend who consistently provides links and encourages everyone to keep pushing forward"
}

NODE "Concept" "raids" {
  description: "An activity discussed with excitement and energy"
}

NODE "Concept" "new links" {
  description: "An aspect of exploration, consistently encouraged by friends"
}

NODE "Concept" "vibrant memes" {
  description: "A creative output during the interactions"
}

NODE "Concept" "support" {
  description: "An integral value in the community"
}

NODE "Concept" "imagined office meme" {
  description: "A shared image adding a visual element to interactions"
}

NODE "Concept" "slow weekends" {
  description: "Considered as the perfect time for raids"
}

NODE "Concept" "strong spirit" {
  description: "An important quality to maintain according to the discussions"
}

NODE "Concept" "reflection" {
  description: "A valued moment in life, discussed in the interactions"
}

NODE "Concept" "positivity" {
  description: "A value that is aimed to be spread in the community"
}

NODE "Concept" "adventures" {
  description: "The future the community is looking forward to"
}

RELATIONSHIP "@stefaneth10xx" -> "raids" [] {
  context: "@stefaneth10xx encourages everyone to engage in raids"
}

RELATIONSHIP "@Bigherocrypto" -> "raids" [] {
  context: "@Bigherocrypto encourages everyone to engage in raids"
}

RELATIONSHIP "@stefaneth10xx" -> "new links" [] {
  context: "@stefaneth10xx encourages the exploration of new links"
}

RELATIONSHIP "@Bigherocrypto" -> "new links" [] {
  context: "@Bigherocrypto encourages the exploration of new links"
}

RELATIONSHIP "slow weekends" -> "raids" [] {
  context: "Slow weekends are considered the perfect time for raids"
}

RELATIONSHIP "strong spirit" -> "support" [] {
  context: "The importance of maintaining a strong spirit resonates in the context of support"
}

RELATIONSHIP "positivity" -> "adventures" [] {
  context: "Spreading positivity is a part of the journey towards future adventures"
}