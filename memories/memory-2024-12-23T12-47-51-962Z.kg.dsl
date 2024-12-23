NODE community "Community" {
  description: "A vibrant group of individuals engaging positively with one another."
}

NODE snake "Snake" {
  description: "An entity representing a unique perspective and charm within the community."
}

NODE raid "Raid" {
  description: "A collective event where community members unite for a common cause."
}

RELATIONSHIP "snake" -> "community" [contributes] {
  context: "The snake shares a unique perspective that enhances community engagement."
}

RELATIONSHIP "community" -> "raid" [supports] {
  context: "The community rallies together for a raid, showcasing unity and support."
}

RELATIONSHIP "snake" -> "raid" [participates] {
  context: "The snake is excited to engage in the raid, contributing to the collective spirit."
}

RELATIONSHIP "community" -> "community" [strengthens] {
  context: "Bonds formed within the community create a tapestry of friendship and support."
}