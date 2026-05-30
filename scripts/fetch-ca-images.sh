#!/usr/bin/env bash
# Fetches product image URLs and titles from Amazon CA for all 58 Canada affiliate products.
# Output: /tmp/ca-products.tsv  (id \t image_url \t title \t brand)

UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
OUT="/tmp/ca-products.tsv"
> "$OUT"

fetch_product() {
  local id="$1" url="$2"
  local html img title brand

  html=$(curl -sL -A "$UA" --max-time 25 --retry 2 "$url" 2>/dev/null)

  # Main product image (highest resolution, first data-old-hires)
  img=$(echo "$html" | grep -oP 'data-old-hires="\K[^"]+' | head -1)

  # Fallback: landingImage src
  if [[ -z "$img" ]]; then
    img=$(echo "$html" | grep -oP 'id="landingImage"[^>]*src="\K[^"]+')
  fi

  # Product title (clean inner text)
  title=$(echo "$html" | grep -oP 'id="productTitle"[^>]*>\s*\K[^<]+' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//' | head -1)

  # Brand from bylineInfo
  brand=$(echo "$html" | grep -oP 'id="bylineInfo"[^>]*>.*?</span>' | grep -oP '(?<=">)[^<]+' | head -1 | sed 's/^Visit the //' | sed 's/ Store$//')

  echo -e "${id}\t${img}\t${title}\t${brand}" >> "$OUT"
  echo "[OK] $id → $img" >&2
}

export -f fetch_product
export UA OUT

# ── All 58 products ────────────────────────────────────────────────────────────
PRODUCTS=(
  "ca-s1|https://amzn.to/4vDrQVd"
  "ca-s2|https://amzn.to/4dR5KXX"
  "ca-s3|https://amzn.to/4va0FRi"
  "ca-s4|https://amzn.to/4agpymk"
  "ca-s5|https://amzn.to/4dJhfQU"
  "ca-s6|https://amzn.to/4dRiX2H"
  "ca-s7|https://amzn.to/3Pu1CFe"
  "ca-s8|https://amzn.to/4vmCory"
  "ca-s9|https://amzn.to/4vdcFBB"
  "ca-s10|https://amzn.to/4fPZTVh"
  "ca-s11|https://amzn.to/4fc3vkc"
  "ca-s12|https://amzn.to/4dRBPi5"
  "ca-s13|https://amzn.to/4flMHYd"
  "ca-s14|https://amzn.to/4va0K7y"
  "ca-s15|https://amzn.to/4vDrXQD"
  "ca-s16|https://amzn.to/4vdcNRB"
  "ca-s17|https://amzn.to/4vgVBuD"
  "ca-s18|https://amzn.to/3Qb5zyH"
  "ca-s19|https://amzn.to/4wVTxK2"
  "ca-s20|https://amzn.to/4uoy8qJ"
  "ca-s21|https://amzn.to/4uYwFbL"
  "ca-s22|https://amzn.to/43CiY5X"
  "ca-s23|https://amzn.to/4vgVHCv"
  "ca-s24|https://amzn.to/4uoyb5T"
  "ca-s25|https://amzn.to/3PJlbcF"
  "ca-e1|https://amzn.to/3PRFPHp"
  "ca-e2|https://amzn.to/49qMsHA"
  "ca-e3|https://amzn.to/4o3plJe"
  "ca-e4|https://amzn.to/3PAclOp"
  "ca-e5|https://amzn.to/4wX3y9V"
  "ca-e6|https://amzn.to/4wZ39Uu"
  "ca-e7|https://amzn.to/4dNISdb"
  "ca-e8|https://amzn.to/3RCzuAk"
  "ca-e9|https://amzn.to/4u08CHT"
  "ca-e10|https://amzn.to/4uL615S"
  "ca-e11|https://amzn.to/4fcsRyt"
  "ca-e12|https://amzn.to/4o7UlYn"
  "ca-e13|https://amzn.to/3QeisYR"
  "ca-e14|https://amzn.to/4dU1Ehw"
  "ca-e15|https://amzn.to/4fcsTq5"
  "ca-e16|https://amzn.to/43Hw7KY"
  "ca-e17|https://amzn.to/43zjbXE"
  "ca-e18|https://amzn.to/3RtGG1L"
  "ca-e19|https://amzn.to/4vnompI"
  "ca-e20|https://amzn.to/4u2M0qc"
  "ca-c1|https://amzn.to/4dSaVa6"
  "ca-c2|https://amzn.to/43BIoAD"
  "ca-c3|https://amzn.to/3Pw6Ksr"
  "ca-c4|https://amzn.to/4u3INqi"
  "ca-c5|https://amzn.to/4nVfepA"
  "ca-c6|https://amzn.to/4nYtpKF"
  "ca-b1|https://amzn.to/4uC0HBF"
  "ca-b2|https://amzn.to/49wA6NZ"
  "ca-b3|https://amzn.to/4fQbT9a"
  "ca-b4|https://amzn.to/43DyEG8"
  "ca-b5|https://amzn.to/4wXXSfL"
  "ca-b6|https://amzn.to/4xgMAnl"
  "ca-b7|https://amzn.to/4ecTKBh"
)

MAX_JOBS=8
job_count=0

for entry in "${PRODUCTS[@]}"; do
  id="${entry%%|*}"
  url="${entry##*|}"
  fetch_product "$id" "$url" &
  ((job_count++))
  if (( job_count >= MAX_JOBS )); then
    wait -n 2>/dev/null || wait
    ((job_count--))
  fi
done
wait

echo ""
echo "Done. Results in $OUT"
echo "Total lines: $(wc -l < "$OUT")"
