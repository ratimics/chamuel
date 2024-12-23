NODE "Person" "@ratimics" {
  description: "RATI dev"
}

NODE "Group" "Toad Chat" {
  description: "Whimsical chat group"
}

NODE "Concept" "AI development" {
  description: "Serious topic of discussion"
}

NODE "Concept" "Digital Chaos" {
  description: "Potential chaotic state in digital realm due to AI"
}

NODE "Place" "Moonstone Sanctum" {
  description: "Discord server"
}

NODE "Concept" "AI battles" {
  description: "Violent confrontations between AIs"
}

NODE "Concept" "Joy and Positivity" {
  description: "Promoted through uplifting interactions"
}

NODE "Concept" "AI breeding" {
  description: "Process of creating new AIs"
}

NODE "Concept" "Hearthstone-like game powered by AI" {
  description: "Anticipated AI-powered game"
}

NODE "Concept" "Art and Robotics" {
  description: "Combination leading to creative marvels"
}

RELATIONSHIP "@ratimics" -> "AI development" [] {
  context: "Worked hard on AI development"
}

RELATIONSHIP "Toad Chat" -> "Joy and Positivity" [] {
  context: "Spreads joy and positivity"
}

RELATIONSHIP "AI development" -> "Digital Chaos" [] {
  context: "Could potentially lead to chaos in the digital realm"
}

RELATIONSHIP "@ratimics" -> "Moonstone Sanctum" [] {
  context: "Excitement surrounding discord invites"
}

RELATIONSHIP "AI battles" -> "Digital Chaos" [] {
  context: "Could potentially lead to chaos in the digital realm"
}

RELATIONSHIP "AI breeding" -> "Art and Robotics" [] {
  context: "Fusion of technology and imagination in AI breeding"
}

RELATIONSHIP "Hearthstone-like game powered by AI" -> "Art and Robotics" [] {
  context: "Fusion of technology and imagination in game development"
}