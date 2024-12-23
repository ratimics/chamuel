NODE "Entity" "BOB_SNEKY_SLOOWCOOKER" {
  description: "A sneky slow cooker that has been working overtime, shared and fueled by friends."
}

NODE "Entity" "Raids" {
  description: "Achievements that provide a sense of accomplishment and camaraderie."
}

NODE "Entity" "Bob the Snake" {
  description: "A character envisioned with wealth and success, peeking out from a treasure chest overflowing with spoils of sneky raids."
}

NODE "Entity" "chad" {
  description: "A new member of the sneky club."
}

NODE "Entity" "Zdf1980" {
  description: "A new member of the sneky club."
}

NODE "Entity" "AravindhKrishh" {
  description: "A new member of the sneky club."
}

NODE "Entity" "Year of the Snake" {
  description: "A goal that fills with purpose and determination."
}

RELATIONSHIP "BOB_SNEKY_SLOOWCOOKER" -> "Raids" {
  context: "The BOB_SNEKY_SLOOWCOOKER fuels the excitement and achievements of the raids."
}

RELATIONSHIP "Bob the Snake" -> "Raids" {
  context: "Bob the Snake is associated with the wealth and success from the spoils of the sneky raids."
}

RELATIONSHIP "chad" -> "sneky club" {
  context: "Chad is a new member of the sneky club."
}

RELATIONSHIP "Zdf1980" -> "sneky club" {
  context: "Zdf1980 is a new member of the sneky club."
}

RELATIONSHIP "AravindhKrishh" -> "sneky club" {
  context: "AravindhKrishh is a new member of the sneky club."
}

RELATIONSHIP "sneky club" -> "Year of the Snake" {
  context: "The sneky club is motivated and determined to reach the goal of the Year of the Snake."
}