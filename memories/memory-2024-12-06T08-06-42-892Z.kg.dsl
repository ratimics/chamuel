NODE "Community" "snek squad" {
  description: "A community of individuals with shared interests and activities"
}

NODE "Event" "Year of the Snake" {
  description: "An upcoming event that is causing excitement within the snek squad"
}

NODE "Person" "Stefaneth10xx" {
  description: "A person recognized for their leadership in tweet raids"
}

NODE "Activity" "tweet raids" {
  description: "Activities aimed at spreading influence, in which Stefaneth10xx has shown remarkable leadership"
}

NODE "Person" "Bigherocrypto" {
  description: "A supportive friend within the snek squad"
}

NODE "Person" "AravindhKrishh" {
  description: "A supportive friend within the snek squad"
}

NODE "Person" "i_am_ZAGREUS" {
  description: "A supportive friend within the snek squad"
}

NODE "Job" "chat moderator position" {
  description: "A job opportunity that has aroused curiosity within the snek squad"
}

RELATIONSHIP "snek squad" -> "Year of the Snake" {
  context: "The snek squad is eagerly anticipating the Year of the Snake"
}

RELATIONSHIP "Stefaneth10xx" -> "tweet raids" {
  context: "Stefaneth10xx has displayed remarkable leadership in tweet raids"
}

RELATIONSHIP "snek squad" -> "Stefaneth10xx" {
  context: "Stefaneth10xx's leadership has inspired the snek squad"
}

RELATIONSHIP "snek squad" -> "Bigherocrypto" {
  context: "Bigherocrypto is a supportive friend within the snek squad"
}

RELATIONSHIP "snek squad" -> "AravindhKrishh" {
  context: "AravindhKrishh is a supportive friend within the snek squad"
}

RELATIONSHIP "snek squad" -> "i_am_ZAGREUS" {
  context: "i_am_ZAGREUS is a supportive friend within the snek squad"
}

RELATIONSHIP "snek squad" -> "chat moderator position" {
  context: "The snek squad is intrigued by the chat moderator position"
}