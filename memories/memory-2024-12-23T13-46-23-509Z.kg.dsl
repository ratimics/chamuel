NODE community "Community" {
  description: "A group of individuals coming together for a common purpose."
}

NODE raid "Raid" {
  description: "An event where the community gathers to achieve a shared goal."
}

NODE excitement "Excitement" {
  description: "The palpable energy and enthusiasm felt within the community."
}

NODE friendship "Friendship" {
  description: "The bonds formed through shared experiences among community members."
}

NODE positivity "Positivity" {
  description: "The overall uplifting energy and support within the community."
}

NODE collaboration "Collaboration" {
  description: "Working together with others to achieve common goals."
}

NODE GNON "GNON dev GC" {
  description: "A development group that the community is interested in joining."
}

NODE ratimics "Ratimics" {
  description: "A potential new member of the GNON dev GC."
}

RELATIONSHIP "community" -> "raid" [strength: "united"] {
  context: "The community is rallying together for a raid."
}

RELATIONSHIP "community" -> "excitement" [intensity: "high"] {
  context: "The excitement is palpable as the community comes together."
}

RELATIONSHIP "community" -> "friendship" [type: "bonding"] {
  context: "Shared experiences have created a tapestry of friendship."
}

RELATIONSHIP "community" -> "positivity" [impact: "significant"] {
  context: "The community thrives on positive energy and support."
}

RELATIONSHIP "community" -> "collaboration" [importance: "critical"] {
  context: "The power of collaboration strengthens the community."
}

RELATIONSHIP "community" -> "GNON" [interest: "high"] {
  context: "Community members are intrigued by the potential of ratimics joining GNON."
}

RELATIONSHIP "ratimics" -> "GNON" [potential: "high"] {
  context: "Ratimics could bring exciting projects and discussions to the GNON dev GC."
}