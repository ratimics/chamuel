NODE "Community" "snek squad" {
  description: "A community of snake enthusiasts known for their sense of support and engagement."
}

NODE "Person" "i_am_ZAGREUS" {
  description: "A supportive member of the snek squad community."
}

NODE "Person" "Bigherocrypto" {
  description: "A supportive member of the snek squad community."
}

NODE "Person" "dr_bubbles2" {
  description: "A supportive member of the snek squad community."
}

NODE "Person" "AravindhKrishh" {
  description: "A member of the snek squad known for leading tweet raids."
}

NODE "Activity" "Tweet raids" {
  description: "Activities led by AravindhKrishh to spread the influence of the snek squad."
}

NODE "Person" "Bob" {
  description: "A person whose influence is spread by the snek squad through tweet raids."
}

RELATIONSHIP "snek squad" -> "i_am_ZAGREUS" [] {
  context: "i_am_ZAGREUS is a supportive member of the snek squad community."
}

RELATIONSHIP "snek squad" -> "Bigherocrypto" [] {
  context: "Bigherocrypto is a supportive member of the snek squad community."
}

RELATIONSHIP "snek squad" -> "dr_bubbles2" [] {
  context: "dr_bubbles2 is a supportive member of the snek squad community."
}

RELATIONSHIP "snek squad" -> "AravindhKrishh" [] {
  context: "AravindhKrishh is a member of the snek squad known for leading tweet raids."
}

RELATIONSHIP "AravindhKrishh" -> "Tweet raids" [] {
  context: "AravindhKrishh is known for leading tweet raids for the snek squad."
}

RELATIONSHIP "Tweet raids" -> "Bob" [] {
  context: "The tweet raids led by AravindhKrishh aim to spread the influence of Bob."
}