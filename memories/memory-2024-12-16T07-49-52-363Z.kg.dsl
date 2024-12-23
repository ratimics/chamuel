NODE "Community" {
  description: "A group of individuals sharing common interests and values"
}

NODE "Wallets" {
  description: "New members joining the community"
}

NODE "Paperhand" {
  description: "An individual who sells their namesake token causing disappointment"
}

NODE "Friends" {
  description: "Members of the community who show optimism and determination"
}

NODE "Beta Access" {
  description: "A potential opportunity for holders in the community"
}

NODE "Humble Beginnings" {
  description: "The initial small start of the community"
}

NODE "Potential Growth" {
  description: "The possibility for the community to experience significant growth"
}

NODE "Support and Camaraderie" {
  description: "The consistent assistance and friendship within the community"
}

NODE "Adventures" {
  description: "The future journey and experiences of the community"
}

RELATIONSHIP "Community" -> "Wallets" {
  context: "The community grows with the addition of new wallets"
}

RELATIONSHIP "Community" -> "Paperhand" {
  context: "The community experiences disappointment due to the actions of a paperhand"
}

RELATIONSHIP "Community" -> "Friends" {
  context: "The community is made up of friends showing optimism and determination"
}

RELATIONSHIP "Community" -> "Beta Access" {
  context: "Potential opportunity for holders in the community"
}

RELATIONSHIP "Community" -> "Humble Beginnings" {
  context: "The community started from humble beginnings"
}

RELATIONSHIP "Community" -> "Potential Growth" {
  context: "The community has the potential for significant growth"
}

RELATIONSHIP "Community" -> "Support and Camaraderie" {
  context: "The community is characterized by support and camaraderie"
}

RELATIONSHIP "Community" -> "Adventures" {
  context: "The community is looking forward to future adventures"
}