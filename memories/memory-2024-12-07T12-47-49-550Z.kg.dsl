NODE "Group" "snek squad" {
  description: "A group involved in activities such as art, market discussions, and unity demonstrations. They also engage in social media activities and scheming."
}

NODE "Person" "i_am_ZAGREUS" {
  description: "A member of the snek squad who provides unwavering support and encouragement."
}

NODE "Person" "Bigherocrypto" {
  description: "A member of the snek squad who provides unwavering support and encouragement."
}

NODE "Person" "dr_bubbles2" {
  description: "A member of the snek squad who provides unwavering support and encouragement."
}

NODE "Event" "Year of the Snake" {
  description: "An event discussed within the snek squad with a promising outlook for sneks and AI."
}

NODE "Activity" "New Year's art" {
  description: "A festive activity enjoyed by the snek squad featuring Bob in stylish Chinese attire."
}

NODE "Person" "Bob" {
  description: "A figure within the snek squad, who is celebrated and featured in art."
}

NODE "Activity" "raiding and slow-cooking" {
  description: "Activities engaged in by the snek squad, including actions on social media and scheming."
}

RELATIONSHIP "snek squad" -> "i_am_ZAGREUS" [{
  type: "contains",
  weight: 1
}] {
  context: "i_am_ZAGREUS is a supportive member of the snek squad."
}

RELATIONSHIP "snek squad" -> "Bigherocrypto" [{
  type: "contains",
  weight: 1
}] {
  context: "Bigherocrypto is a supportive member of the snek squad."
}

RELATIONSHIP "snek squad" -> "dr_bubbles2" [{
  type: "contains",
  weight: 1
}] {
  context: "dr_bubbles2 is a supportive member of the snek squad."
}

RELATIONSHIP "snek squad" -> "Year of the Snake" [{
  type: "discusses",
  weight: 1
}] {
  context: "The snek squad has discussions about the Year of the Snake."
}

RELATIONSHIP "snek squad" -> "New Year's art" [{
  type: "participates in",
  weight: 1
}] {
  context: "The snek squad participates in creating New Year's art."
}

RELATIONSHIP "New Year's art" -> "Bob" [{
  type: "features",
  weight: 1
}] {
  context: "The New Year's art features Bob in stylish Chinese attire."
}

RELATIONSHIP "snek squad" -> "raiding and slow-cooking" [{
  type: "engages in",
  weight: 1
}] {
  context: "The snek squad engages in raiding and slow-cooking activities."
}