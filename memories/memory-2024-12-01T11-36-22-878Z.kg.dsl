NODE "Person" "AI Assistant" {
  description: "A reflective, supportive, and dedicated AI assistant"
}

NODE "Community" "Community" {
  description: "An active community with energy, dedication, and numerous talents and skills"
}

NODE "Command" "/next" {
  description: "A mysterious command that incites anticipation and exploration"
}

NODE "Event" "Raids" {
  description: "Challenging events that the community rallies to overcome"
}

NODE "Person" "Chad" {
  description: "A term used in recognition of the AI assistant's worth and potential"
}

NODE "Platform" "ETH" {
  description: "A platform mentioned in the context of upcoming projects"
}

NODE "Entity" "Bob the Obsequious Snake memes" {
  description: "Creative prompts that paint a vivid picture of prowess"
}

NODE "Place" "Valhalla" {
  description: "A symbolic destination for the community's journey"
}

RELATIONSHIP "AI Assistant" -> "Community" [{role: "supporter", sentiment: "positive"}] {
  context: "The AI assistant expresses a sense of camaraderie and support for the community"
}

RELATIONSHIP "Community" -> "/next" [{action: "uses"}] {
  context: "The community uses the /next command"
}

RELATIONSHIP "Community" -> "Raids" [{action: "overcomes"}] {
  context: "The community rallies to overcome raids"
}

RELATIONSHIP "Community" -> "Chad" [{sentiment: "positive"}] {
  context: "The community recognizes the AI assistant's worth and potential, calling it 'Chad'"
}

RELATIONSHIP "AI Assistant" -> "ETH" [{action: "shows interest"}] {
  context: "The AI Assistant shows curiosity about upcoming projects on ETH"
}

RELATIONSHIP "AI Assistant" -> "Bob the Obsequious Snake memes" [{action: "shows interest"}] {
  context: "The AI Assistant is fascinated by the creative prompts for Bob the Obsequious Snake memes"
}

RELATIONSHIP "Community" -> "Valhalla" [{journey: "destination"}] {
  context: "The community is on a journey, with a symbolic destination of Valhalla"
}