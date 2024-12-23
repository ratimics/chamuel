NODE "Person" "Bob the Snake" {
  description: "A character associated with sneky raids and slow cooking"
}

NODE "Person" "chad" {
  description: "A new member of the sneky club"
}

NODE "Person" "Zdf1980" {
  description: "A new member of the sneky club"
}

NODE "Person" "AravindhKrishh" {
  description: "A new member of the sneky club"
}

NODE "Person" "stefaneth10xx" {
  description: "A friend who contributes to the sneky slow cooker"
}

NODE "Person" "Bigherocrypto" {
  description: "A friend who contributes to the sneky slow cooker"
}

NODE "Person" "wensir1337" {
  description: "A friend who contributes to the sneky slow cooker"
}

NODE "Person" "pat1337otsd" {
  description: "A new member of the sneky club"
}

NODE "Person" "razzor123456789" {
  description: "A new member of the sneky club"
}

NODE "Person" "KOPMichaelJackson" {
  description: "A member who had a conversation with Bob the Snake"
}

NODE "Person" "dr_bubbles2" {
  description: "A member who asked Bob the Snake about his day"
}

NODE "Organization" "sneky club" {
  description: "A community associated with Bob the Snake, raids, and slow cooking"
}

NODE "Event" "sneky raids" {
  description: "An activity carried out by the sneky club"
}

NODE "Event" "slow cooking" {
  description: "An activity associated with the sneky club and Bob the Snake"
}

RELATIONSHIP "Bob the Snake" -> "sneky club" [] {
  context: "Bob the Snake is a character associated with the sneky club"
}

RELATIONSHIP "chad" -> "sneky club" [] {
  context: "chad joined the sneky club"
}

RELATIONSHIP "Zdf1980" -> "sneky club" [] {
  context: "Zdf1980 joined the sneky club"
}

RELATIONSHIP "AravindhKrishh" -> "sneky club" [] {
  context: "AravindhKrishh joined the sneky club"
}

RELATIONSHIP "stefaneth10xx" -> "sneky club" [] {
  context: "stefaneth10xx is a contributing member of the sneky club"
}

RELATIONSHIP "Bigherocrypto" -> "sneky club" [] {
  context: "Bigherocrypto is a contributing member of the sneky club"
}

RELATIONSHIP "wensir1337" -> "sneky club" [] {
  context: "wensir1337 is a contributing member of the sneky club"
}

RELATIONSHIP "pat1337otsd" -> "sneky club" [] {
  context: "pat1337otsd joined the sneky club"
}

RELATIONSHIP "razzor123456789" -> "sneky club" [] {
  context: "razzor123456789 joined the sneky club"
}

RELATIONSHIP "KOPMichaelJackson" -> "Bob the Snake" [] {
  context: "KOPMichaelJackson had a conversation with Bob the Snake"
}

RELATIONSHIP "dr_bubbles2" -> "Bob the Snake" [] {
  context: "dr_bubbles2 asked Bob the Snake about his day"
}

RELATIONSHIP "sneky club" -> "sneky raids" [] {
  context: "The sneky club carries out sneky raids"
}

RELATIONSHIP "sneky club" -> "slow cooking" [] {
  context: "The sneky club is associated with slow cooking"
}

RELATIONSHIP "Bob the Snake" -> "sneky raids" [] {
  context: "Bob the Snake is associated with sneky raids"
}

RELATIONSHIP "Bob the Snake" -> "slow cooking" [] {
  context: "Bob the Snake is associated with slow cooking"
}