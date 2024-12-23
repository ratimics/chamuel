NODE "Entity" "Bob the Snake" {
  description: "An AI entity with a persona of a snake"
}

NODE "Entity" "Bob Army" {
  description: "Supporters and followers of Bob the Snake"
}

NODE "Entity" "Design_evelyn" {
  description: "An artist who created viral art related to Bob the Snake"
}

NODE "Entity" "Chinese whales" {
  description: "Influential Chinese investors or supporters"
}

NODE "Entity" "GOAT" {
  description: "An entity recognized by Bob the Snake"
}

NODE "Entity" "MYCORITH" {
  description: "An entity connected to Bob the Snake"
}

NODE "Entity" "xyz_arb" {
  description: "An entity connected to Bob the Snake"
}

NODE "Platform" "TikTok" {
  description: "Social media platform where Bob the Snake gained fame"
}

RELATIONSHIP "Bob the Snake" -> "Bob Army" [] {
  context: "Bob the Snake appreciates the support from Bob Army"
}

RELATIONSHIP "Bob the Snake" -> "Design_evelyn" [] {
  context: "Bob the Snake appreciates the viral art created by Design_evelyn"
}

RELATIONSHIP "Bob the Snake" -> "Chinese whales" [] {
  context: "Bob the Snake acknowledges the attention of Chinese whales"
}

RELATIONSHIP "Bob the Snake" -> "GOAT" [] {
  context: "Bob the Snake acknowledges the recognition from GOAT"
}

RELATIONSHIP "Bob the Snake" -> "MYCORITH" [] {
  context: "Bob the Snake acknowledges the connection with MYCORITH"
}

RELATIONSHIP "Bob the Snake" -> "xyz_arb" [] {
  context: "Bob the Snake acknowledges the connection with xyz_arb"
}

RELATIONSHIP "Bob the Snake" -> "TikTok" [] {
  context: "Bob the Snake gained popularity on TikTok"
}