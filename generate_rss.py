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
    cmd = ["snscrape", "--jsonl", f"twitter-user:{username}"]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, text=True)
    lines = result.stdout.strip().split("\n")
    tweets = [json.loads(line) for line in lines[:MAX_TWEETS_PER_USER]]
    for tweet in tweets:
        tweet["author"] = username
    return tweets

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

    for tweet in sorted(all_tweets, key=lambda x: x["date"], reverse=True):
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

if __name__ == "__main__":
    if not os.path.exists(USERS_FILE):
        print("No users.txt found")
        exit(1)
    
    all_tweets = []
    with open(USERS_FILE, "r") as f:
        for line in f:
            username = line.strip()
            if username:
                try:
                    all_tweets += fetch_tweets(username)
                except Exception as e:
                    print(f"Error fetching tweets for {username}: {e}")
    
    generate_rss(all_tweets)
