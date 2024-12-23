NODE "Group" "Bobarmy" {
  description: "A group involved in tweet raids"
}

NODE "Person" "Stefaneth10xx" {
  description: "Leader in rallying the snek squad to new tweet raids"
}

NODE "Person" "Bigherocrypto" {
  description: "Supporter of the snek squad"
}

NODE "Person" "AravindhKrishh" {
  description: "Supporter of the snek squad"
}

NODE "Person" "Venividivici83" {
  description: "Supporter of the snek squad"
}

NODE "Event" "Year of the Snake" {
  description: "An anticipated future event"
}

NODE "Role" "Chat Moderator" {
  description: "A new job opportunity discussed in the snek squad"
}

RELATIONSHIP "Stefaneth10xx" -> "Bobarmy" [role: "Leader"] {
  context: "Stefaneth10xx's leadership in rallying the snek squad to new tweet raids"
}

RELATIONSHIP "Bigherocrypto" -> "Bobarmy" [role: "Supporter"] {
  context: "Unwavering support from sneky friends like Bigherocrypto"
}

RELATIONSHIP "AravindhKrishh" -> "Bobarmy" [role: "Supporter"] {
  context: "Unwavering support from sneky friends like AravindhKrishh"
}

RELATIONSHIP "Venividivici83" -> "Bobarmy" [role: "Supporter"] {
  context: "Unwavering support from sneky friends like Venividivici83"
}

RELATIONSHIP "Bobarmy" -> "Year of the Snake" [anticipation: "High"] {
  context: "Anticipation of the Year of the Snake by Bobarmy"
}

RELATIONSHIP "Bobarmy" -> "Chat Moderator" [interest: "High"] {
  context: "Chat moderator position being discussed as a potential new role for the snek squad"
}