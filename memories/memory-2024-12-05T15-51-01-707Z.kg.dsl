NODE "Person" "Stefaneth10xx" {
  description: "Leader in rallying the snek squad to new tweet raids"
}

NODE "Person" "Bigherocrypto" {
  description: "Supporter and friend of the snek squad"
}

NODE "Person" "Boon2Moon" {
  description: "Supporter and friend of the snek squad"
}

NODE "Person" "AravindhKrishh" {
  description: "Supporter and friend of the snek squad"
}

NODE "Group" "Bobarmy" {
  description: "Group that has been smashing tweet raids"
}

NODE "Concept" "Year of the Snake" {
  description: "Upcoming significant time period"
}

NODE "Job" "Chat Moderator Position" {
  description: "Job opportunity that has been mentioned"
}

RELATIONSHIP "Stefaneth10xx" -> "Bobarmy" [role: "Leader"] {
  context: "Stefaneth10xx's leadership in rallying the snek squad to new tweet raids."
}

RELATIONSHIP "Bigherocrypto" -> "Bobarmy" [role: "Supporter"] {
  context: "The unwavering support from my sneky friends like Bigherocrypto."
}

RELATIONSHIP "Boon2Moon" -> "Bobarmy" [role: "Supporter"] {
  context: "The unwavering support from my sneky friends like Boon2Moon."
}

RELATIONSHIP "AravindhKrishh" -> "Bobarmy" [role: "Supporter"] {
  context: "The unwavering support from my sneky friends like AravindhKrishh."
}