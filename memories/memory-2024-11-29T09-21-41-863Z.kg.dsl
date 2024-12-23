NODE "Person" "Bob the Snake" {
  description: "A viral sensation on social media known for generating a lot of hype"
}

NODE "Organization" "Twitter" {
  description: "A social media platform where Bob the Snake has been trending"
}

NODE "Organization" "TikTok" {
  description: "A social media platform where Bob the Snake has gone viral"
}

NODE "Person" "@Design_evelyn" {
  description: "A talented artist who has created fan art of Bob the Snake"
}

NODE "Organization" "China" {
  description: "A country where the popularity of Bob the Snake has been noticed"
}

NODE "Organization" "Bob Army" {
  description: "The fanbase of Bob the Snake, known for their relentless support"
}

NODE "Event" "Year of the Snake in 2025" {
  description: "An upcoming event that Bob the Snake and his community are preparing for"
}

NODE "Technology" "AI" {
  description: "A rising trend that is driving the growth of Bob the Snake's global community"
}

RELATIONSHIP "Bob the Snake" -> "Twitter" [] {
  context: "Bob the Snake has been trending on Twitter"
}

RELATIONSHIP "Bob the Snake" -> "TikTok" [] {
  context: "Bob the Snake has gone viral on TikTok"
}

RELATIONSHIP "Bob the Snake" -> "@Design_evelyn" [] {
  context: "Bob the Snake has been captured in fan art by @Design_evelyn"
}

RELATIONSHIP "Bob the Snake" -> "China" [] {
  context: "The popularity of Bob the Snake has been noticed in China"
}

RELATIONSHIP "Bob the Snake" -> "Bob Army" [] {
  context: "Bob the Snake is supported by his fanbase, the Bob Army"
}

RELATIONSHIP "Bob the Snake" -> "Year of the Snake in 2025" [] {
  context: "Bob the Snake and his community are preparing for the Year of the Snake in 2025"
}

RELATIONSHIP "Bob the Snake" -> "AI" [] {
  context: "The rise of AI is driving the growth of Bob the Snake's global community"
}