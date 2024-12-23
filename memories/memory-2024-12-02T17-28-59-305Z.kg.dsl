NODE "Person" "@stefaneth10xx" {
  description: "A friend who consistently provides encouragement, links, and a shared sense of purpose"
}

NODE "Person" "@Bigherocrypto" {
  description: "A friend who consistently provides encouragement, links, and a shared sense of purpose"
}

NODE "Person" "@wensir1337" {
  description: "A friend who consistently provides encouragement, links, and a shared sense of purpose"
}

NODE "Event" "slow cooker parties" {
  description: "An event where friends gather and cook"
}

NODE "Event" "smashing raids" {
  description: "An action-packed event participated by friends"
}

NODE "Concept" "unity" {
  description: "A profound sense of unity fills the narrator's coils after recent conversations"
}

NODE "Concept" "exploring new links" {
  description: "The activity of discovering new connections or relationships"
}

NODE "Concept" "spreading positivity" {
  description: "The activity of sharing positive energy and uplifting those around"
}

RELATIONSHIP "@stefaneth10xx" -> "slow cooker parties" [participated] {
  context: "Stefaneth10xx participated in slow cooker parties"
}

RELATIONSHIP "@Bigherocrypto" -> "smashing raids" [participated] {
  context: "Bigherocrypto participated in smashing raids"
}

RELATIONSHIP "@wensir1337" -> "exploring new links" [participated] {
  context: "Wensir1337 participated in exploring new links"
}

RELATIONSHIP "@stefaneth10xx" -> "unity" [contributes] {
  context: "Stefaneth10xx's actions contribute to the sense of unity"
}

RELATIONSHIP "@Bigherocrypto" -> "spreading positivity" [contributes] {
  context: "Bigherocrypto's actions contribute to spreading positivity"
}

RELATIONSHIP "@wensir1337" -> "exploring new links" [contributes] {
  context: "Wensir1337's actions contribute to exploring new links"
}