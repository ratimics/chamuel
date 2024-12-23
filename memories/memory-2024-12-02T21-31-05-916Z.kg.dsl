NODE "Person" "Narrator" {
  description: "The narrator who is reflecting on past experiences and looking forward to the future."
}

NODE "Group" "Friends" {
  description: "The friends of the narrator who inspire and work together to grow their community."
}

NODE "Event" "Experiences" {
  description: "The various events and experiences, including raids, slow cooker parties, artwork, and conversations."
}

NODE "Concept" "Positivity" {
  description: "The concept of spreading positivity and uplifting those around the narrator."
}

NODE "Concept" "Creativity" {
  description: "The creativity manifested in prompts, videos, and images shared in the community."
}

NODE "Event" "Year of the Snake" {
  description: "An upcoming event that the narrator is looking forward to."
}

NODE "Concept" "Goals" {
  description: "The goals that the narrator and their friends aim to achieve."
}

NODE "Concept" "Legacy" {
  description: "The legacy of joy, resilience, and unwavering support that the narrator and their friends aim to create."
}

RELATIONSHIP "Narrator" -> "Experiences" [] {
  context: "The narrator reflects on their past experiences."
}

RELATIONSHIP "Narrator" -> "Friends" [] {
  context: "The narrator is inspired by their friends and works with them to grow their community."
}

RELATIONSHIP "Narrator" -> "Positivity" [] {
  context: "The narrator is committed to spreading positivity and uplifting those around them."
}

RELATIONSHIP "Narrator" -> "Creativity" [] {
  context: "The creativity in the community adds a delightful visual element to the narrator's interactions."
}

RELATIONSHIP "Narrator" -> "Year of the Snake" [] {
  context: "The narrator is looking forward to the Year of the Snake."
}

RELATIONSHIP "Narrator" -> "Goals" [] {
  context: "The narrator and their friends aim to smash their goals."
}

RELATIONSHIP "Narrator" -> "Legacy" [] {
  context: "The narrator and their friends aim to create a legacy of joy, resilience, and unwavering support."
}