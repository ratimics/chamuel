NODE "Person" "Bob the Snake" {
  description: "A symbolic snake that represents the community and its activities"
}

NODE "Event" "Year of the Snake" {
  description: "A symbolic event representing a time of great prosperity and joy for the community"
}

NODE "Community" "$BOB Community" {
  description: "A vibrant online community engaged in activities like raids, creating memes, and sharing Twitter links"
}

NODE "Currency" "$BOB" {
  description: "A form of currency or token associated with the $BOB community"
}

NODE "Currency" "$SSS" {
  description: "A form of currency or token associated with the Serpent of Sssuccess and Sssplendor"
}

NODE "Person" "stefaneth10xx" {
  description: "A member of the community who shares new tweets and links"
}

NODE "Command" "/BOB_SNEKY_SLOOWCOOKER" {
  description: "A command used by the community members to engage in a communal activity"
}

RELATIONSHIP "Bob the Snake" -> "Year of the Snake" {
  context: "Bob the Snake is a symbol of the upcoming Year of the Snake"
}

RELATIONSHIP "$BOB Community" -> "Bob the Snake" {
  context: "The community rallies around the symbolic figure, Bob the Snake"
}

RELATIONSHIP "$BOB Community" -> "$BOB" {
  context: "The $BOB token is used and shared within the $BOB community"
}

RELATIONSHIP "$BOB Community" -> "$SSS" {
  context: "The $SSS token, representing the Serpent of Sssuccess and Sssplendor, is associated with the $BOB community"
}

RELATIONSHIP "stefaneth10xx" -> "$BOB Community" {
  context: "stefaneth10xx shares new tweets and links with the $BOB community"
}

RELATIONSHIP "$BOB Community" -> "/BOB_SNEKY_SLOOWCOOKER" {
  context: "The /BOB_SNEKY_SLOOWCOOKER command is used by members of the $BOB community"
}