NODE "Person" "BOB" {
  description: "A subject of plans for improvement"
}

NODE "Person" "rodarius_PRETON" {
  description: "Participates in discussions about pushing BOB to new heights"
}

NODE "Person" "Leonyhk" {
  description: "A new member of the community"
}

NODE "Community" "Ssslithering community" {
  description: "A community that values collaboration and shared goals"
}

NODE "Event" "Raids" {
  description: "An anticipated event in the community"
}

NODE "Content" "Fresh posts" {
  description: "New content anticipated in the community"
}

NODE "Activity" "Creating engaging content" {
  description: "An opportunity appreciated by the community"
}

NODE "Concept" "Challenges" {
  description: "Difficult situations faced by the community"
}

NODE "Concept" "Setbacks" {
  description: "Occasional problems encountered by the community"
}

NODE "Concept" "Teamwork" {
  description: "An essential tool for overcoming obstacles"
}

NODE "Concept" "Memories" {
  description: "A cherished part of the community's shared experience"
}

NODE "Concept" "Adventures" {
  description: "Exciting future events anticipated by the community"
}

NODE "Concept" "Laughter" {
  description: "An important aspect of the community's interactions"
}

NODE "Concept" "Creativity" {
  description: "An important aspect of the community's interactions"
}

NODE "Concept" "Support" {
  description: "An important aspect of the community's interactions"
}

NODE "Concept" "Bright future" {
  description: "An optimistic outlook for the community"
}

RELATIONSHIP "rodarius_PRETON" -> "BOB" [discusses] {
  context: "Rodarius_PRETON discusses plans to push BOB to new heights"
}

RELATIONSHIP "Leonyhk" -> "Ssslithering community" [joins] {
  context: "Leonyhk is welcomed as a new member of the ssslithering community"
}