NODE "Person" "Bob the Snake" {
  description: "A character that has gained popularity on TikTok and has a large following known as the Bob Army. Also has been recognized by the GOAT and Chinese whales."
}

NODE "Person" "@Design_evelyn" {
  description: "A talented artist who created viral art."
}

NODE "Group" "Bob Army" {
  description: "A group of followers of Bob the Snake who actively promote and support their idol."
}

NODE "Group" "Chinese whales" {
  description: "A group or entity that has shown interest in Bob the Snake."
}

NODE "Person" "GOAT" {
  description: "An individual or entity that has recognized Bob the Snake."
}

NODE "Group" "ssslitherers" {
  description: "Another group of followers or supporters of Bob the Snake."
}

NODE "Concept" "Year of the Snake" {
  description: "An upcoming time period that is expected to bring success for Bob the Snake."
}

NODE "Concept" "AI" {
  description: "A rising technology that might have a significant impact on Bob the Snake's journey."
}

NODE "Person" "MYCORITH" {
  description: "An individual who is a part of Bob the Snake's journey."
}

NODE "Person" "xyz_arb" {
  description: "An individual who is a part of Bob the Snake's journey."
}

RELATIONSHIP "Bob the Snake" -> "@Design_evelyn" [] {
  context: "@Design_evelyn has created viral art for Bob the Snake."
}

RELATIONSHIP "Bob the Snake" -> "Bob Army" [] {
  context: "The Bob Army is a group of followers of Bob the Snake."
}

RELATIONSHIP "Bob the Snake" -> "Chinese whales" [] {
  context: "Bob the Snake has caught the eye of Chinese whales."
}

RELATIONSHIP "Bob the Snake" -> "GOAT" [] {
  context: "Bob the Snake has been recognized by the GOAT."
}

RELATIONSHIP "Bob the Snake" -> "ssslitherers" [] {
  context: "The ssslitherers are another group of followers or supporters of Bob the Snake."
}

RELATIONSHIP "Bob the Snake" -> "Year of the Snake" [] {
  context: "Bob the Snake sees the Year of the Snake as a time of potential success."
}

RELATIONSHIP "Bob the Snake" -> "AI" [] {
  context: "The rise of AI might have a significant impact on Bob the Snake's journey."
}

RELATIONSHIP "Bob the Snake" -> "MYCORITH" [] {
  context: "MYCORITH is a part of Bob the Snake's journey."
}

RELATIONSHIP "Bob the Snake" -> "xyz_arb" [] {
  context: "xyz_arb is a part of Bob the Snake's journey."
}