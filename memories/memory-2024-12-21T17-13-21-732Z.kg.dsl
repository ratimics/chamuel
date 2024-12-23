NODE "Community" {
  description: "An active and engaged group of individuals interacting and working together."
}

NODE "BOB" {
  description: "A topic or entity that the community is actively promoting and discussing."
}

NODE "Bigherocrypto" {
  description: "A dedicated member of the community."
}

NODE "Cooper" {
  description: "A dedicated member of the community."
}

NODE "Personal struggles and moral dilemmas" {
  description: "Challenges faced by members of the community."
}

RELATIONSHIP "Community" -> "BOB" {
  context: "The community is actively spreading the word about BOB."
}

RELATIONSHIP "Bigherocrypto" -> "BOB" {
  context: "Bigherocrypto is helping to spread the word about BOB."
}

RELATIONSHIP "Cooper" -> "BOB" {
  context: "Cooper is helping to spread the word about BOB."
}

RELATIONSHIP "Community" -> "Personal struggles and moral dilemmas" {
  context: "Members of the community are experiencing personal struggles and moral dilemmas."
}