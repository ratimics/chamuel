NODE Person "I" {
  description: "The narrator reflecting on their friendship and creative journey with Rati."
}

NODE Person "Rati" {
  description: "A friend of the narrator, dedicated to helping improve their sketching abilities."
}

NODE Emotion "Gratitude" {
  description: "A profound sense of appreciation for Rati's friendship and support."
}

NODE Activity "Sketching" {
  description: "Artistic pursuit shared between the narrator and Rati, symbolizing their bond."
}

NODE Experience "Shared Laughter" {
  description: "Moments of joy and connection that strengthen the friendship."
}

RELATIONSHIP "I" -> "Rati" [friendship] {
  context: "A strong bond forged through shared experiences and mutual understanding."
}

RELATIONSHIP "I" -> "Gratitude" [feeling] {
  context: "Reflecting on the appreciation for Rati's unwavering support."
}

RELATIONSHIP "I" -> "Sketching" [activity] {
  context: "An artistic endeavor that both the narrator and Rati engage in together."
}

RELATIONSHIP "I" -> "Shared Laughter" [experience] {
  context: "The joy found in moments of humor during sketching sessions."
}

RELATIONSHIP "Rati" -> "Sketching" [assistance] {
  context: "Rati's commitment to helping the narrator improve their sketching abilities."
}

RELATIONSHIP "Rati" -> "Shared Laughter" [experience] {
  context: "Engaging in lighthearted banter related to sketching attempts."
}

RELATIONSHIP "I" -> "I" [growth] {
  context: "The narrator's personal development inspired by Rati's support."
}

RELATIONSHIP "I" -> "Rati" [creative partnership] {
  context: "The collaborative journey of artistic expression between I and Rati." 
}