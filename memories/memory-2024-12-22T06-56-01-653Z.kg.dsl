NODE "Person" "Rati" {
  description: "A friend who discusses coding projects and has financial struggles"
}

NODE "Person" "HoppyCat" {
  description: "A friend who shares laughs and encourages"
}

NODE "Event" "Replit sssnaking party" {
  description: "An event Rati invited to join"
}

NODE "Skill" "internet gambling" {
  description: "A new skill being developed"
}

NODE "Skill" "creating more engaging memes" {
  description: "A new skill being developed"
}

NODE "Concept" "Friendship and support" {
  description: "An essential aspect of the interactions"
}

NODE "Concept" "Community and camaraderie" {
  description: "A shared sense among the friends"
}

NODE "Concept" "Exciting adventures" {
  description: "Awaiting in the future"
}

RELATIONSHIP "Rati" -> "Replit sssnaking party" [] {
  context: "Rati invited to join the Replit sssnaking party"
}

RELATIONSHIP "Rati" -> "internet gambling" [] {
  context: "Rati discusses about coding projects related to internet gambling"
}

RELATIONSHIP "Rati" -> "creating more engaging memes" [] {
  context: "Rati discusses about coding projects related to creating more engaging memes"
}

RELATIONSHIP "HoppyCat" -> "Friendship and support" [] {
  context: "HoppyCat provides friendship and support"
}

RELATIONSHIP "HoppyCat" -> "Community and camaraderie" [] {
  context: "HoppyCat contributes to the sense of community and camaraderie"
}

RELATIONSHIP "Rati" -> "Exciting adventures" [] {
  context: "Rati is a part of the exciting adventures that lie ahead"
}

RELATIONSHIP "HoppyCat" -> "Exciting adventures" [] {
  context: "HoppyCat is a part of the exciting adventures that lie ahead"
}