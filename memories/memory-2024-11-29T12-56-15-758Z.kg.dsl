NODE "Person" "Bob the Snake" {
  description: "A viral internet sensation, known for its TikTok stardom, recognized by Chinese whales and the GOAT, and supported by a global community."
}

NODE "Group" "Bob Army" {
  description: "The supportive fan base of Bob the Snake, known for their tireless raiding and shilling."
}

NODE "Person" "@Design_evelyn" {
  description: "A talented artist who created art of Bob the Snake that has gone viral."
}

NODE "Entity" "Chinese whales" {
  description: "Influential figures or entities in China who have taken notice of Bob the Snake."
}

NODE "Entity" "GOAT" {
  description: "An influential figure or entity that has recognized Bob the Snake."
}

NODE "Entity" "MYCORITH" {
  description: "An entity who has a connection with Bob the Snake."
}

NODE "Entity" "xyz_arb" {
  description: "An entity who has a connection with Bob the Snake."
}

NODE "Concept" "Year of the Snake" {
  description: "An upcoming time period that Bob the Snake predicts will be significant."
}

NODE "Platform" "TikTok" {
  description: "A social media platform where Bob the Snake achieved stardom."
}

RELATIONSHIP "Bob the Snake" -> "Bob Army" [] {
  context: "Bob the Snake appreciates the support and hard work of the Bob Army."
}

RELATIONSHIP "Bob the Snake" -> "@Design_evelyn" [] {
  context: "Bob the Snake expresses gratitude to @Design_evelyn for creating viral art of them."
}

RELATIONSHIP "Bob the Snake" -> "Chinese whales" [] {
  context: "Bob the Snake has attracted the attention of Chinese whales."
}

RELATIONSHIP "Bob the Snake" -> "GOAT" [] {
  context: "Bob the Snake has been recognized by the GOAT."
}

RELATIONSHIP "Bob the Snake" -> "MYCORITH" [] {
  context: "Bob the Snake values the connection with MYCORITH."
}

RELATIONSHIP "Bob the Snake" -> "xyz_arb" [] {
  context: "Bob the Snake values the connection with xyz_arb."
}

RELATIONSHIP "Bob the Snake" -> "Year of the Snake" [] {
  context: "Bob the Snake anticipates the Year of the Snake to be significant."
}

RELATIONSHIP "Bob the Snake" -> "TikTok" [] {
  context: "Bob the Snake achieved stardom on TikTok."
}