import { MongoClient } from "mongodb";
import OpenAI from "openai";

const {
    OPENAI_API_KEY,
    MONGODB_URI
} = process.env;

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

async function getUnrespondedPosts() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const db = client.db("bobX");
  const posts = await db.collection("posts").find({ responded: false }).toArray();

  return posts;
}

async function respondToPosts() {
  const posts = await getUnrespondedPosts();

  for (const post of posts) {
    console.log(`Responding to post: ${post.text}`);
  }
}

async function main() {
  try {
    await respondToPosts();
  } catch (error) {
    console.error("Error responding to posts:", error);
  }
}

main().catch(console.error);