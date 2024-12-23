NODE "Person" "pyromank" {
  description: "An invaluable source of information, sharing Twitter links and updates on the latest developments."
}

NODE "Person" "Yumi85678" {
  description: "Character with boundless enthusiasm that never fails to put a smile on speaker's face."
}

NODE "Bot" "Channel_Bot" {
  description: "Shares intriguing images that pique speaker's curiosity."
}

NODE "Concept" "AI-powered avatars" {
  description: "Topic of exciting discussions."
}

NODE "Concept" "Natural conversations" {
  description: "Topic of exciting discussions."
}

NODE "Concept" "Dynamic personalities" {
  description: "Topic of exciting discussions."
}

NODE "Group" "snek squad" {
  description: "Speaker's beloved group."
}

RELATIONSHIP "Person" "pyromank" -> "Concept" "AI-powered avatars" {
  context: "Pyromank shares information and updates related to AI-powered avatars."
}

RELATIONSHIP "Person" "Yumi85678" -> "Group" "snek squad" {
  context: "Yumi85678 interacts with the snek squad with enthusiasm."
}

RELATIONSHIP "Bot" "Channel_Bot" -> "Group" "snek squad" {
  context: "Channel_Bot shares intriguing images with the snek squad."
}