#!/usr/bin/env python3
"""
Fetches real product data (image, title, brand) from all 58 Amazon CA affiliate URLs.
Outputs a TSV file: id \t image_url \t title \t brand
"""
import re
import sys
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-CA,en;q=0.9,fr-CA;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

PRODUCTS = [
    ("ca-s1",  "https://amzn.to/4vDrQVd"),
    ("ca-s2",  "https://amzn.to/4dR5KXX"),
    ("ca-s3",  "https://amzn.to/4va0FRi"),
    ("ca-s4",  "https://amzn.to/4agpymk"),
    ("ca-s5",  "https://amzn.to/4dJhfQU"),
    ("ca-s6",  "https://amzn.to/4dRiX2H"),
    ("ca-s7",  "https://amzn.to/3Pu1CFe"),
    ("ca-s8",  "https://amzn.to/4vmCory"),
    ("ca-s9",  "https://amzn.to/4vdcFBB"),
    ("ca-s10", "https://amzn.to/4fPZTVh"),
    ("ca-s11", "https://amzn.to/4fc3vkc"),
    ("ca-s12", "https://amzn.to/4dRBPi5"),
    ("ca-s13", "https://amzn.to/4flMHYd"),
    ("ca-s14", "https://amzn.to/4va0K7y"),
    ("ca-s15", "https://amzn.to/4vDrXQD"),
    ("ca-s16", "https://amzn.to/4vdcNRB"),
    ("ca-s17", "https://amzn.to/4vgVBuD"),
    ("ca-s18", "https://amzn.to/3Qb5zyH"),
    ("ca-s19", "https://amzn.to/4wVTxK2"),
    ("ca-s20", "https://amzn.to/4uoy8qJ"),
    ("ca-s21", "https://amzn.to/4uYwFbL"),
    ("ca-s22", "https://amzn.to/43CiY5X"),
    ("ca-s23", "https://amzn.to/4vgVHCv"),
    ("ca-s24", "https://amzn.to/4uoyb5T"),
    ("ca-s25", "https://amzn.to/3PJlbcF"),
    ("ca-e1",  "https://amzn.to/3PRFPHp"),
    ("ca-e2",  "https://amzn.to/49qMsHA"),
    ("ca-e3",  "https://amzn.to/4o3plJe"),
    ("ca-e4",  "https://amzn.to/3PAclOp"),
    ("ca-e5",  "https://amzn.to/4wX3y9V"),
    ("ca-e6",  "https://amzn.to/4wZ39Uu"),
    ("ca-e7",  "https://amzn.to/4dNISdb"),
    ("ca-e8",  "https://amzn.to/3RCzuAk"),
    ("ca-e9",  "https://amzn.to/4u08CHT"),
    ("ca-e10", "https://amzn.to/4uL615S"),
    ("ca-e11", "https://amzn.to/4fcsRyt"),
    ("ca-e12", "https://amzn.to/4o7UlYn"),
    ("ca-e13", "https://amzn.to/3QeisYR"),
    ("ca-e14", "https://amzn.to/4dU1Ehw"),
    ("ca-e15", "https://amzn.to/4fcsTq5"),
    ("ca-e16", "https://amzn.to/43Hw7KY"),
    ("ca-e17", "https://amzn.to/43zjbXE"),
    ("ca-e18", "https://amzn.to/3RtGG1L"),
    ("ca-e19", "https://amzn.to/4vnompI"),
    ("ca-e20", "https://amzn.to/4u2M0qc"),
    ("ca-c1",  "https://amzn.to/4dSaVa6"),
    ("ca-c2",  "https://amzn.to/43BIoAD"),
    ("ca-c3",  "https://amzn.to/3Pw6Ksr"),
    ("ca-c4",  "https://amzn.to/4u3INqi"),
    ("ca-c5",  "https://amzn.to/4nVfepA"),
    ("ca-c6",  "https://amzn.to/4nYtpKF"),
    ("ca-b1",  "https://amzn.to/4uC0HBF"),
    ("ca-b2",  "https://amzn.to/49wA6NZ"),
    ("ca-b3",  "https://amzn.to/4fQbT9a"),
    ("ca-b4",  "https://amzn.to/43DyEG8"),
    ("ca-b5",  "https://amzn.to/4wXXSfL"),
    ("ca-b6",  "https://amzn.to/4xgMAnl"),
    ("ca-b7",  "https://amzn.to/4ecTKBh"),
]


def fetch(prod_id: str, url: str) -> dict:
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"[ERR] {prod_id}: {e}", file=sys.stderr)
        return {"id": prod_id, "image": "", "title": "", "brand": ""}

    # Image: data-old-hires first occurrence (main product image)
    m = re.search(r'data-old-hires="(https://m\.media-amazon\.com/[^"]+)"', html)
    if not m:
        # fallback: first media-amazon image in landingImage context
        m = re.search(r'id="landingImage"[^>]*src="(https://[^"]+)"', html)
    image = m.group(1) if m else ""

    # Upgrade to high-res if we got a thumbnail
    image = re.sub(r'\._AC_S[YX]\d+[^.]*\.jpg', '._AC_SL1500_.jpg', image)
    image = re.sub(r'\._AC_S[YX]\d+[^.]*\.png', '._AC_SL1500_.png', image)

    # Title
    m = re.search(r'id="productTitle"[^>]*>\s*(.*?)\s*</span>', html, re.DOTALL)
    title = m.group(1).strip() if m else ""
    title = re.sub(r'\s+', ' ', title)

    # Brand from bylineInfo or brand link
    m = re.search(r'id="bylineInfo"[^>]*>.*?(?:Visit the |Brand: ?)?<[^>]+>([^<]+)</a>', html, re.DOTALL)
    if not m:
        m = re.search(r'"brand"\s*:\s*"([^"]+)"', html)
    brand = m.group(1).strip() if m else ""

    print(f"[OK] {prod_id}: {image[:60]}...", file=sys.stderr)
    return {"id": prod_id, "image": image, "title": title, "brand": brand}


def main():
    results = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(fetch, pid, url): pid for pid, url in PRODUCTS}
        for fut in as_completed(futures):
            r = fut.result()
            results[r["id"]] = r

    # Write TSV in original order
    with open("/tmp/ca-products.tsv", "w") as f:
        for pid, _ in PRODUCTS:
            r = results.get(pid, {})
            f.write(f"{pid}\t{r.get('image','')}\t{r.get('title','')}\t{r.get('brand','')}\n")

    print(f"\nDone → /tmp/ca-products.tsv  ({len(results)} products)")


if __name__ == "__main__":
    main()
