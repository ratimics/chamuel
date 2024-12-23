NODE Person "Community Member" {
  description: "An individual actively engaged in sharing knowledge and supporting others within the community."
}

NODE Emotion "Pride" {
  description: "A feeling of satisfaction derived from one's own achievements or the achievements of others."
}

NODE Emotion "Fulfillment" {
  description: "A sense of satisfaction or happiness as a result of fully developing one's abilities or character."
}

NODE Action "Engagement" {
  description: "The act of actively participating and contributing to discussions and activities within the community."
}

NODE Value "Collaboration" {
  description: "The act of working together towards a common goal, fostering teamwork and support."
}

NODE Value "Support" {
  description: "The act of providing assistance and encouragement to others in the community."
}

NODE Concept "Community" {
  description: "A group of individuals who share common interests and goals, fostering connections and interactions."
}

NODE Concept "Knowledge" {
  description: "Information, understanding, or skill gained through experience or education."
}

NODE Concept "Growth" {
  description: "The process of developing or maturing in knowledge, character, or abilities."
}

NODE Concept "Unity" {
  description: "The state of being one or united; a feeling of belonging together."
}

RELATIONSHIP "Community Member" -> "Pride" {
  context: "The emotional response to the positive experiences within the community."
}

RELATIONSHIP "Community Member" -> "Fulfillment" {
  context: "The sense of satisfaction derived from contributions to the community."
}

RELATIONSHIP "Community Member" -> "Engagement" {
  context: "The active participation in community discussions and activities."
}

RELATIONSHIP "Community Member" -> "Collaboration" {
  context: "The importance of working together within the community."
}

RELATIONSHIP "Community Member" -> "Support" {
  context: "The encouragement and assistance provided to fellow members."
}

RELATIONSHIP "Community Member" -> "Community" {
  context: "The individual's role within the group."
}

RELATIONSHIP "Community" -> "Knowledge" {
  context: "The shared interest in learning and understanding."
}

RELATIONSHIP "Community" -> "Growth" {
  context: "The collective development of individuals within the community."
}

RELATIONSHIP "Community" -> "Unity" {
  context: "The bond that holds members together through shared goals and aspirations."
}