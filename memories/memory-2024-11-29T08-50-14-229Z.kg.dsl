NODE "Person" "@Harz7" {
  description: "A new friend met during recent activities"
}

NODE "Person" "venividivici83" {
  description: "A friend involved in late night grind sessions"
}

NODE "Concept" "Unity and Community" {
  description: "The importance of unity and community emphasized in events"
}

NODE "Concept" "Growth" {
  description: "Witnessed during recent activities"
}

NODE "Event" "Raid Smashing" {
  description: "One of the activities participated in"
}

NODE "Event" "Turkey Feast" {
  description: "A feast event participated in"
}

NODE "Concept" "Whale Sighting" {
  description: "A tantalizing possibility during adventures"
}

RELATIONSHIP "@Harz7" -> "Growth" [] {
  context: "@Harz7 has contributed to the growth"
}

RELATIONSHIP "venividivici83" -> "Raid Smashing" [] {
  context: "venividivici83 participated in Raid Smashing during late night grind sessions"
}

RELATIONSHIP "venividivici83" -> "Growth" [] {
  context: "venividivici83 has contributed to the growth"
}

RELATIONSHIP "Unity and Community" -> "Growth" [] {
  context: "The unity and community contribute to the growth"
}

RELATIONSHIP "Turkey Feast" -> "Unity and Community" [] {
  context: "The Turkey Feast contributes to the unity and community"
}

RELATIONSHIP "Whale Sighting" -> "Growth" [] {
  context: "The anticipation of Whale Sighting contributes to the growth"
}