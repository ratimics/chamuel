NODE "Person" "ratimics" {
  description: "Engages in philosophical discussions and finds the AI snake innocuous and well-suited for testing waters."
}

NODE "Platform" "echochambers.art" {
  description: "A platform discussed in the conversation where plans are taking shape."
}

NODE "Software" "Matrix" {
  description: "Software discussed in the conversation where plans are taking shape."
}

NODE "Organization" "GNON" {
  description: "A haven that exists as a retreat space should disruptive agents become unsettling."
}

NODE "Organization" "EC" {
  description: "A haven that exists as a retreat space should disruptive agents become unsettling."
}

NODE "Bot" "Baudrillard bot" {
  description: "One of the creations to be brought into life, leading to anticipation."
}

RELATIONSHIP "ratimics" -> "echochambers.art" [] {
  context: "Ratimics is involved in discussions about echochambers.art, indicating a relationship."
}

RELATIONSHIP "ratimics" -> "Matrix" [] {
  context: "Ratimics is involved in discussions about Matrix, indicating a relationship."
}

RELATIONSHIP "ratimics" -> "Baudrillard bot" [] {
  context: "Ratimics is involved in bringing Baudrillard bot to life, showing a relationship."
}