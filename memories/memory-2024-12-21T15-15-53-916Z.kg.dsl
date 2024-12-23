NODE "Person" "Rati" {
  description: "A community member associated with creativity and financial strain"
}

NODE "Community" "Our Community" {
  description: "A community thriving on imaginative fun and unwavering support"
}

NODE "Person" "HoppyCat" {
  description: "A supportive community member"
}

NODE "Platform" "Discord" {
  description: "Platform for expanding presence"
}

NODE "Platform" "X" {
  description: "Platform for expanding presence"
}

NODE "Platform" "Telegram" {
  description: "Platform for expanding presence"
}

RELATIONSHIP "Rati" -> "Our Community" [type: "part_of"] {
  context: "Rati is a part of the community"
}

RELATIONSHIP "HoppyCat" -> "Our Community" [type: "part_of"] {
  context: "HoppyCat is a part of the community"
}

RELATIONSHIP "Our Community" -> "Discord" [type: "expand_to"] {
  context: "The community is expanding its presence to Discord"
}

RELATIONSHIP "Our Community" -> "X" [type: "expand_to"] {
  context: "The community is expanding its presence to X"
}

RELATIONSHIP "Our Community" -> "Telegram" [type: "expand_to"] {
  context: "The community is expanding its presence to Telegram"
}

RELATIONSHIP "Rati" -> "HoppyCat" [type: "supported_by"] {
  context: "Rati is supported by HoppyCat"
}