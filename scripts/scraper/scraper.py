#!/usr/bin/env python3
"""
Formations Scraper for vai-calcio.fr
Scrapes probable lineups from Italian sources and posts to WordPress
"""

import json
import os
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional
from collections import defaultdict

import requests
from bs4 import BeautifulSoup
from camoufox.sync_api import Camoufox


class FormationsScraper:
    """Scraper for probable formations from multiple Italian sources"""

    def __init__(self, config_path: str = "sources.json"):
        """Initialize scraper with configuration"""
        with open(config_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)

        self.sources = self.config["sources"]
        self.scraping_config = self.config["scraping_config"]
        self.wordpress_config = self.config["wordpress"]

        # Results storage
        self.formations_data = defaultdict(lambda: defaultdict(list))

    def scrape_source(self, source: Dict) -> List[Dict]:
        """Scrape formations from a single source using Camoufox"""
        print(f"\n📰 Scraping {source['name']}...")

        formations = []

        try:
            # Launch Camoufox browser
            with Camoufox(
                headless=self.scraping_config.get("headless", True),
                humanize=True,  # Anti-bot humanization
            ) as browser:
                page = browser.new_page()

                # Navigate to source
                page.goto(source["url"], timeout=30000)

                # Wait for content to load
                time.sleep(2)

                # Find formations page link
                selectors = source["selectors"]

                try:
                    # Look for probable formations section
                    formations_section = page.query_selector(
                        selectors["formations_page"]
                    )

                    if not formations_section:
                        print(
                            f"⚠️  Formations section not found on {source['name']}"
                        )
                        return formations

                    # Get page content
                    content = page.content()
                    soup = BeautifulSoup(content, "lxml")

                    # Parse matches
                    matches = soup.select(selectors["match_container"])

                    for match in matches:
                        try:
                            formation_data = self._parse_match(match, selectors)
                            if formation_data:
                                formation_data["source"] = source["name"]
                                formation_data["source_weight"] = source["weight"]
                                formations.append(formation_data)
                        except Exception as e:
                            print(f"❌ Error parsing match: {e}")
                            continue

                except Exception as e:
                    print(f"❌ Error finding formations: {e}")

        except Exception as e:
            print(f"❌ Error scraping {source['name']}: {e}")

        print(f"✅ Found {len(formations)} formations from {source['name']}")
        return formations

    def _parse_match(self, match_element, selectors: Dict) -> Optional[Dict]:
        """Parse a single match formation"""
        try:
            # Extract team names
            team_elements = match_element.select(selectors["team_name"])
            if len(team_elements) < 2:
                return None

            home_team = team_elements[0].get_text(strip=True)
            away_team = team_elements[1].get_text(strip=True)

            # Extract formations for each team
            formations = match_element.select(selectors["formation"])
            home_formation = (
                formations[0].get_text(strip=True) if len(formations) > 0 else None
            )
            away_formation = (
                formations[1].get_text(strip=True) if len(formations) > 1 else None
            )

            # Extract players
            player_lists = match_element.select(selectors["players"])

            home_players = []
            away_players = []

            if len(player_lists) >= 2:
                home_players = [
                    p.get_text(strip=True)
                    for p in player_lists[0].find_all(
                        class_=lambda x: x and "player" in x.lower()
                    )
                ]
                away_players = [
                    p.get_text(strip=True)
                    for p in player_lists[1].find_all(
                        class_=lambda x: x and "player" in x.lower()
                    )
                ]

            return {
                "match": f"{home_team} - {away_team}",
                "home_team": home_team,
                "away_team": away_team,
                "home_formation": home_formation,
                "away_formation": away_formation,
                "home_players": home_players,
                "away_players": away_players,
            }

        except Exception as e:
            print(f"Error parsing match element: {e}")
            return None

    def aggregate_formations(self, all_formations: List[Dict]) -> Dict:
        """
        Aggregate formations from all sources and calculate confidence scores
        Confidence = (number of sources citing player) / (total sources) * 100
        """
        print("\n🔄 Aggregating formations and calculating confidence scores...")

        aggregated = defaultdict(lambda: {
            "teams": set(),
            "formations": defaultdict(int),
            "players": defaultdict(lambda: {"count": 0, "sources": []})
        })

        total_sources = len(self.sources)

        for formation in all_formations:
            match_key = formation["match"]
            source = formation["source"]
            weight = formation["source_weight"]

            # Add teams
            aggregated[match_key]["teams"].add(formation["home_team"])
            aggregated[match_key]["teams"].add(formation["away_team"])

            # Count formations
            if formation.get("home_formation"):
                aggregated[match_key]["formations"][formation["home_formation"]] += weight

            # Count players (home)
            for player in formation.get("home_players", []):
                aggregated[match_key]["players"][player]["count"] += weight
                aggregated[match_key]["players"][player]["sources"].append(source)

            # Count players (away)
            for player in formation.get("away_players", []):
                aggregated[match_key]["players"][player]["count"] += weight
                aggregated[match_key]["players"][player]["sources"].append(source)

        # Calculate confidence scores
        results = {}
        for match_key, data in aggregated.items():
            # Get most common formation
            formations = data["formations"]
            most_common_formation = (
                max(formations.items(), key=lambda x: x[1])[0]
                if formations
                else "N/A"
            )

            # Calculate player confidence scores
            players_with_confidence = []
            for player, player_data in data["players"].items():
                confidence = int((player_data["count"] / total_sources) * 100)
                players_with_confidence.append({
                    "name": player,
                    "confidence": confidence,
                    "sources": player_data["sources"]
                })

            # Sort by confidence (descending)
            players_with_confidence.sort(key=lambda x: x["confidence"], reverse=True)

            results[match_key] = {
                "match": match_key,
                "formation": most_common_formation,
                "players": players_with_confidence,
                "last_updated": datetime.now().isoformat(),
            }

        return results

    def post_to_wordpress(self, formations: Dict) -> None:
        """Post formations to WordPress REST API"""
        print("\n📤 Posting formations to WordPress...")

        wp_url = self.wordpress_config["rest_api_url"]
        wp_user = os.getenv("WORDPRESS_USER") or self.wordpress_config.get("auth_user")
        wp_pass = os.getenv("WORDPRESS_PASSWORD") or self.wordpress_config.get(
            "auth_password"
        )

        if not wp_user or not wp_pass:
            print("⚠️  WordPress credentials not configured, skipping upload")
            return

        for match_key, formation_data in formations.items():
            try:
                # Prepare WordPress post data
                post_data = {
                    "title": f"Formation probable : {match_key}",
                    "status": "publish",
                    "acf": {
                        "match": formation_data["match"],
                        "formation": formation_data["formation"],
                        "players": json.dumps(formation_data["players"]),
                        "last_updated": formation_data["last_updated"],
                    },
                }

                # Post to WordPress
                response = requests.post(
                    wp_url,
                    json=post_data,
                    auth=(wp_user, wp_pass),
                    timeout=30,
                )

                if response.status_code in [200, 201]:
                    print(f"✅ Posted: {match_key}")
                else:
                    print(
                        f"❌ Failed to post {match_key}: {response.status_code} - {response.text}"
                    )

            except Exception as e:
                print(f"❌ Error posting {match_key}: {e}")

    def run(self) -> None:
        """Main scraper execution"""
        print("🚀 Starting formations scraper...")
        print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        all_formations = []

        # Scrape each source
        for source in self.sources:
            try:
                formations = self.scrape_source(source)
                all_formations.extend(formations)
            except Exception as e:
                print(f"❌ Failed to scrape {source['name']}: {e}")
                continue

        if not all_formations:
            print("\n⚠️  No formations found from any source")
            return

        print(f"\n📊 Total formations scraped: {len(all_formations)}")

        # Aggregate and calculate confidence
        aggregated_formations = self.aggregate_formations(all_formations)

        print(f"\n📋 Aggregated {len(aggregated_formations)} unique matches")

        # Post to WordPress
        self.post_to_wordpress(aggregated_formations)

        print("\n✅ Scraping complete!")


if __name__ == "__main__":
    try:
        scraper = FormationsScraper()
        scraper.run()
    except KeyboardInterrupt:
        print("\n\n⚠️  Scraper interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        sys.exit(1)
