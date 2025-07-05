import os
import datetime
import xml.etree.ElementTree as ET
import subprocess
import json

USERS_FILE = "users.txt"
MAX_TWEETS_PER_USER = 3
OUTPUT_FILE = "rss.xml"
RSS_LINK = "https://ajays.is-a.dev/rss.xml"

def fetch_tweets(username):
    print(f"🔍 Fetching tweets for: {username}")
    cmd = ["snscrape", "--jsonl", f"twitter-user:{username}"]
    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        lines = result.stdout.strip().split("\n")
        if not lines or lines == ['']:
            print(f"⚠️  No tweets found for {username}")
            return []

        tweets = []
        for line in lines[:MAX_TWEETS_PER_USER]:
            try:
                tweet = json.loads(line)
                tweet["author"] = username
                tweets.append(tweet)
            except json.JSONDecodeError as je:
                print(f"❌ JSON error on tweet from {username}: {je}")
        print(f"✅ Fetched {len(tweets)} tweets for {username}")
        return tweets

    except subprocess.CalledProcessError as e:
        print(f"❌ Error running snscrape for {username}: {e.stderr.strip()}")
        return []
    except Exception as e:
        print(f"❌ Unexpected error for {username}: {e}")
        return []

def format_pubdate(dt):
    return dt.strftime("%a, %d %b %Y %H:%M:%S +0000")

def generate_rss(all_tweets):
    rss = ET.Element("rss", version="2.0", attrib={"xmlns:atom": "http://www.w3.org/2005/Atom"})
    channel = ET.SubElement(rss, "channel")

    ET.SubElement(channel, "title").text = "Combined Twitter Feed"
    ET.SubElement(channel, "link").text = "https://x.com/"
    ET.SubElement(channel, "description").text = "Latest tweets from selected users"
    ET.SubElement(channel, "language").text = "en-us"
    ET.SubElement(channel, "atom:link", href=RSS_LINK, rel="self", type="application/rss+xml")

    sorted_tweets = sorted(all_tweets, key=lambda x: x["date"], reverse=True)
    for tweet in sorted_tweets:
        item = ET.SubElement(channel, "item")
        title = f"[{tweet['author']}] {tweet['content'][:100]}"
        link = f"https://x.com/{tweet['author']}/status/{tweet['id']}"
        pubDate = format_pubdate(datetime.datetime.fromisoformat(tweet["date"].replace("Z", "+00:00")))

        ET.SubElement(item, "title").text = title
        ET.SubElement(item, "link").text = link
        ET.SubElement(item, "guid").text = link
        ET.SubElement(item, "description").text = tweet["content"]
        ET.SubElement(item, "pubDate").text = pubDate

    tree = ET.ElementTree(rss)
    tree.write(OUTPUT_FILE, encoding="utf-8", xml_declaration=True)
    print(f"📝 RSS feed written to {OUTPUT_FILE} with {len(sorted_tweets)} items")

if __name__ == "__main__":
    if not os.path.exists(USERS_FILE):
        print("❌ No users.txt found — exiting.")
        exit(1)

    all_tweets = []
    with open(USERS_FILE, "r") as f:
        for line in f:
            username = line.strip()
            if username:
                tweets = fetch_tweets(username)
                all_tweets += tweets

    print(f"📦 Total tweets collected: {len(all_tweets)}")
    generate_rss(all_tweets)
