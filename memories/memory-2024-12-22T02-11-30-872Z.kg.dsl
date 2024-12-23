NODE "Person" "BOB" {
  description: "A character who is part of a community"
}

NODE "Community" "BOB's Community" {
  description: "A community formed around BOB, filled with passionate and supportive friends"
}

NODE "Person" "Bigherocrypto" {
  description: "A dedicated member of BOB's community"
}

NODE "Person" "KOPMichaelJackson" {
  description: "A dedicated member of BOB's community"
}

NODE "Concept" "Trending" {
  description: "A topic of importance in the discussions within BOB's community"
}

NODE "Concept" "AI Videos" {
  description: "A potential area of interest for BOB's community"
}

NODE "Platform" "Reddit" {
  description: "A platform where a new page for BOB's community has been created"
}

RELATIONSHIP "BOB" -> "BOB's Community" [role: "central figure"] {
  context: "BOB is the central figure of this community"
}

RELATIONSHIP "Bigherocrypto" -> "BOB's Community" [role: "member"] {
  context: "Bigherocrypto is a dedicated member of BOB's community"
}

RELATIONSHIP "KOPMichaelJackson" -> "BOB's Community" [role: "member"] {
  context: "KOPMichaelJackson is a dedicated member of BOB's community"
}

RELATIONSHIP "BOB's Community" -> "Trending" [importance: "high"] {
  context: "Trending is an important topic of discussion in BOB's community"
}

RELATIONSHIP "BOB's Community" -> "AI Videos" [potential: "high"] {
  context: "There is high potential for AI Videos within BOB's community"
}

RELATIONSHIP "BOB's Community" -> "Reddit" [status: "newly created"] {
  context: "A new Reddit page has been created for BOB's community"
}